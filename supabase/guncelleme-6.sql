-- =====================================================================
-- 3D Dünyası - Güncelleme 6: ürünü satışa kapatma
-- (guncelleme-buyuk.sql'i daha önce çalıştırdıysanız bunu da bir kez çalıştırın)
-- =====================================================================
alter table public.products add column if not exists is_for_sale boolean not null default true;

-- Sipariş: satışa kapalı ürün satın alınamaz (stok her siparişte otomatik düşer, iptalde geri eklenir)
create or replace function public.place_order(
  p_items jsonb, p_address jsonb, p_payment text, p_coupon text default null, p_note text default null,
  p_delivery text default 'kargo', p_gift_wrap boolean default false, p_gift_note text default null,
  p_use_points boolean default false, p_gift_code text default null
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid(); v_email text; v_item jsonb; v_prod public.products;
  v_qty int; v_unit text; v_price numeric; v_consume int; v_free int;
  v_subtotal numeric := 0; v_coupon_disc numeric := 0; v_promo numeric := 0; v_first numeric := 0;
  v_shipping numeric := 0; v_wrap numeric := 0; v_points numeric := 0; v_gift numeric := 0; v_after numeric;
  v_coupon public.coupons; v_settings public.settings; v_order public.orders; v_gc public.gift_cards;
  v_lines jsonb := '[]'::jsonb; v_promo_row public.promotions; v_bal numeric;
begin
  if v_user is null then raise exception 'Sipariş için giriş yapmalısınız'; end if;
  if p_payment not in ('havale','iyzico') then raise exception 'Geçersiz ödeme yöntemi'; end if;
  if p_delivery not in ('kargo','elden','gel_al') then raise exception 'Geçersiz teslimat yöntemi'; end if;
  if jsonb_array_length(coalesce(p_items,'[]'::jsonb)) = 0 then raise exception 'Sepetiniz boş'; end if;
  select email into v_email from auth.users where id = v_user;
  select * into v_settings from public.settings where id = 1;
  if p_delivery = 'elden' and lower(coalesce(p_address->>'city','')) not in ('ankara') then raise exception 'Elden teslimat sadece Ankara içinde yapılabilir'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, (v_item->>'quantity')::int);
    v_unit := coalesce(v_item->>'unit','adet');
    if v_item->>'kind' = 'hediye_ceki' then
      v_price := (v_item->>'amount')::numeric;
      if v_price is null or v_price < 50 or v_price > 10000 then raise exception 'Hediye çeki tutarı 50 ile 10.000 TL arasında olmalı'; end if;
      v_subtotal := v_subtotal + v_price * v_qty;
      v_lines := v_lines || jsonb_build_object('product_id', null, 'name', 'Hediye çeki (' || v_price || ' TL)', 'unit', 'adet', 'unit_price', v_price,
        'quantity', v_qty, 'personalization', null, 'kind', 'hediye_ceki',
        'meta', jsonb_build_object('recipient_email', v_item->>'recipient_email', 'recipient_name', v_item->>'recipient_name', 'message', v_item->>'message'));
      continue;
    end if;
    select * into v_prod from public.products where id = (v_item->>'product_id')::uuid and is_active for update;
    if not found then raise exception 'Ürün bulunamadı veya satışta değil'; end if;
    if v_prod.section = 'yazici' then raise exception 'Bu bölüm henüz satışta değil'; end if;
    if not v_prod.is_for_sale then raise exception '% şu an satışa kapalı, lütfen sepetinizden çıkarın', v_prod.name; end if;
    if v_unit = 'paket' then
      if v_prod.sale_unit = 'adet' then raise exception '% paket olarak satılmıyor', v_prod.name; end if;
      v_price := coalesce(v_prod.pack_price, public.effective_price(v_prod) * v_prod.pack_size); v_consume := v_qty * v_prod.pack_size;
    else
      if v_prod.sale_unit = 'paket' then raise exception '% sadece paket olarak satılıyor', v_prod.name; end if;
      v_unit := 'adet'; v_price := public.effective_price(v_prod); v_consume := v_qty;
    end if;
    if v_prod.stock < v_consume then raise exception '% için yeterli stok yok (kalan: %)', v_prod.name, v_prod.stock; end if;
    update public.products set stock = stock - v_consume where id = v_prod.id;
    v_subtotal := v_subtotal + v_price * v_qty;

    -- X al Y öde (adet satışlarda, ürün veya kategori bazlı, en avantajlı kampanya)
    if v_unit = 'adet' then
      select * into v_promo_row from public.promotions pr
       where pr.is_active and (pr.starts_at is null or pr.starts_at <= now()) and (pr.ends_at is null or pr.ends_at > now())
         and (pr.product_id = v_prod.id or pr.category_id = v_prod.category_id)
       order by (pr.buy_qty - pr.pay_qty)::numeric / pr.buy_qty desc limit 1;
      if found and v_qty >= v_promo_row.buy_qty then
        v_free := (v_qty / v_promo_row.buy_qty) * (v_promo_row.buy_qty - v_promo_row.pay_qty);
        v_promo := v_promo + v_free * v_price;
      end if;
    end if;

    v_lines := v_lines || jsonb_build_object('product_id', v_prod.id, 'name', v_prod.name, 'unit', v_unit, 'unit_price', v_price, 'quantity', v_qty,
      'personalization', case when v_prod.allow_personalization then nullif(trim(v_item->>'personalization'),'') end, 'kind', 'urun', 'meta', null);
  end loop;

  v_after := v_subtotal - v_promo;

  -- Kupon ya da ilk sipariş indirimi (hangisi girildiyse; kupon öncelikli)
  if p_coupon is not null and length(trim(p_coupon)) > 0 then
    select * into v_coupon from public.coupons where upper(code) = upper(trim(p_coupon)) for update;
    if not found or not v_coupon.is_active then raise exception 'Kupon kodu geçersiz'; end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then raise exception 'Kuponun süresi dolmuş'; end if;
    if v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit then raise exception 'Kupon kullanım limiti dolmuş'; end if;
    if v_after < v_coupon.min_total then raise exception 'Bu kupon için en az % TL alışveriş gerekli', v_coupon.min_total; end if;
    v_coupon_disc := case when v_coupon.type = 'yuzde' then round(v_after * v_coupon.value / 100, 2) else least(v_coupon.value, v_after) end;
    update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
  elsif v_settings.first_order_pct > 0 and not exists (select 1 from public.orders where user_id = v_user and status <> 'iptal') then
    v_first := round(v_after * v_settings.first_order_pct / 100, 2);
  end if;
  v_after := v_after - v_coupon_disc - v_first;

  -- Teslimat ve hediye paketi
  v_shipping := case p_delivery
    when 'gel_al' then 0
    when 'elden' then v_settings.local_delivery_fee
    else case when v_after >= v_settings.free_shipping_limit then 0 else v_settings.shipping_fee end end;
  if p_gift_wrap then v_wrap := v_settings.gift_wrap_fee; end if;
  v_after := v_after + v_shipping + v_wrap;

  -- Puan kullanımı (1 puan = 1 TL)
  if p_use_points then
    select points into v_bal from public.profiles where id = v_user for update;
    v_points := least(coalesce(v_bal, 0), v_after);
    if v_points > 0 then
      update public.profiles set points = points - v_points where id = v_user;
    end if;
  end if;
  v_after := v_after - v_points;

  -- Hediye çeki
  if p_gift_code is not null and length(trim(p_gift_code)) > 0 then
    select * into v_gc from public.gift_cards where upper(code) = upper(trim(p_gift_code)) for update;
    if not found or not v_gc.is_active or v_gc.balance <= 0 or (v_gc.expires_at is not null and v_gc.expires_at < now()) then raise exception 'Hediye çeki geçersiz'; end if;
    v_gift := least(v_gc.balance, v_after);
    update public.gift_cards set balance = balance - v_gift where id = v_gc.id;
  end if;
  v_after := v_after - v_gift;

  insert into public.orders (order_no, user_id, email, payment_method, subtotal, discount, shipping, total, coupon_code, shipping_address, note,
    delivery_method, gift_wrap, gift_note, gift_wrap_fee, points_used, gift_card_code, gift_card_amount, promo_discount, first_order_discount,
    status, payment_status)
  values ('3DD-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)), v_user, v_email, p_payment, v_subtotal,
    v_coupon_disc + v_promo + v_first, v_shipping, round(v_after, 2), nullif(upper(trim(p_coupon)),''), p_address, p_note,
    p_delivery, p_gift_wrap, nullif(trim(p_gift_note),''), v_wrap, v_points, nullif(upper(trim(p_gift_code)),''), v_gift, v_promo, v_first,
    case when round(v_after, 2) = 0 then 'hazirlaniyor' else 'odeme_bekleniyor' end,
    case when round(v_after, 2) = 0 then 'odendi' else 'bekliyor' end)
  returning * into v_order;

  if v_points > 0 then
    insert into public.point_transactions (user_id, order_id, amount, reason) values (v_user, v_order.id, -v_points, 'Siparişte kullanıldı');
  end if;

  insert into public.order_items (order_id, product_id, name, unit, unit_price, quantity, personalization, kind, meta)
  select v_order.id, nullif(l->>'product_id','')::uuid, l->>'name', l->>'unit', (l->>'unit_price')::numeric, (l->>'quantity')::int,
         l->>'personalization', l->>'kind', l->'meta'
  from jsonb_array_elements(v_lines) l;

  -- Ödeme gerekmiyorsa (puan/çekle tamamı ödendi) hediye çekleri hemen oluşur
  if v_order.payment_status = 'odendi' then perform public.issue_gift_cards(v_order.id); end if;
  return v_order;
end; $$;
