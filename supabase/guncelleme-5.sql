-- =====================================================================
-- 3D Dünyası - Güncelleme 5 (Paket 3: yönetim araçları, roller, blog, filament vitrini)
-- =====================================================================

-- ---------- Çalışan rolleri ----------
-- admin: her şey · siparis: siparişler, baskı kuyruğu, talepler, iadeler, sorular · urun: ürünler, kategoriler, galeri
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('customer','admin','siparis','urun'));

create or replace function public.is_staff(p_alan text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and (role = 'admin' or role = p_alan));
$$;

-- Sipariş alanı yetkileri
drop policy if exists "siparis_oku" on public.orders;
create policy "siparis_oku" on public.orders for select using (user_id = auth.uid() or public.is_staff('siparis'));
drop policy if exists "siparis_admin" on public.orders;
create policy "siparis_admin" on public.orders for update using (public.is_staff('siparis'));
drop policy if exists "kalem_oku" on public.order_items;
create policy "kalem_oku" on public.order_items for select using (public.is_staff('siparis') or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
drop policy if exists "talep_oku" on public.custom_requests;
create policy "talep_oku" on public.custom_requests for select using (user_id = auth.uid() or public.is_staff('siparis'));
drop policy if exists "talep_admin" on public.custom_requests;
create policy "talep_admin" on public.custom_requests for update using (public.is_staff('siparis'));
drop policy if exists "iade_oku" on public.return_requests;
create policy "iade_oku" on public.return_requests for select using (user_id = auth.uid() or public.is_staff('siparis'));
drop policy if exists "iade_admin" on public.return_requests;
create policy "iade_admin" on public.return_requests for update using (public.is_staff('siparis'));
drop policy if exists "soru_oku" on public.product_questions;
create policy "soru_oku" on public.product_questions for select using (answer is not null or user_id = auth.uid() or public.is_staff('siparis'));
drop policy if exists "soru_admin" on public.product_questions;
create policy "soru_admin" on public.product_questions for update using (public.is_staff('siparis'));
drop policy if exists "stl_oku" on storage.objects;
create policy "stl_oku" on storage.objects for select using (
  bucket_id = 'ozel-siparis' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff('siparis')));
drop policy if exists "fatura_admin" on storage.objects;
create policy "fatura_admin" on storage.objects for all using (bucket_id = 'faturalar' and public.is_staff('siparis')) with check (bucket_id = 'faturalar' and public.is_staff('siparis'));
-- Siparişteki müşteri adı için profil okuma
drop policy if exists "profil_oku" on public.profiles;
create policy "profil_oku" on public.profiles for select using (id = auth.uid() or public.is_staff('siparis'));

-- Ürün alanı yetkileri
drop policy if exists "urun_oku" on public.products;
create policy "urun_oku" on public.products for select using (is_active or public.is_staff('urun'));
drop policy if exists "urun_yaz" on public.products;
create policy "urun_yaz" on public.products for all using (public.is_staff('urun')) with check (public.is_staff('urun'));
drop policy if exists "kat_yaz" on public.categories;
create policy "kat_yaz" on public.categories for all using (public.is_staff('urun')) with check (public.is_staff('urun'));
drop policy if exists "galeri_yaz" on public.gallery_items;
create policy "galeri_yaz" on public.gallery_items for all using (public.is_staff('urun')) with check (public.is_staff('urun'));
drop policy if exists "gorsel_yaz" on storage.objects;
create policy "gorsel_yaz" on storage.objects for insert with check (bucket_id = 'urun-gorselleri' and public.is_staff('urun'));
drop policy if exists "gorsel_sil" on storage.objects;
create policy "gorsel_sil" on storage.objects for delete using (bucket_id = 'urun-gorselleri' and public.is_staff('urun'));

-- İptal: sipariş yetkilisi de yapabilsin
create or replace function public.cancel_order_guard() returns boolean language sql stable as $$ select public.is_staff('siparis') or auth.role() = 'service_role' $$;

create or replace function public.cancel_order(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders; i record;
begin
  if not public.cancel_order_guard() then raise exception 'Yetkisiz'; end if;
  select * into o from public.orders where id = p_order for update;
  if not found or o.status = 'iptal' then return; end if;
  for i in select oi.*, p.pack_size from public.order_items oi left join public.products p on p.id = oi.product_id where oi.order_id = p_order loop
    if i.product_id is not null then
      update public.products set stock = stock + case when i.unit = 'paket' then i.quantity * coalesce(i.pack_size,1) else i.quantity end where id = i.product_id;
    end if;
  end loop;
  if o.coupon_code is not null then update public.coupons set used_count = greatest(0, used_count - 1) where upper(code) = o.coupon_code; end if;
  if o.points_used > 0 and o.user_id is not null then
    update public.profiles set points = points + o.points_used where id = o.user_id;
    insert into public.point_transactions (user_id, order_id, amount, reason) values (o.user_id, o.id, o.points_used, 'İptal iadesi');
  end if;
  if o.points_earned > 0 and o.user_id is not null then
    update public.profiles set points = greatest(0, points - o.points_earned) where id = o.user_id;
    insert into public.point_transactions (user_id, order_id, amount, reason) values (o.user_id, o.id, -o.points_earned, 'İptal: kazanılan puan geri alındı');
  end if;
  if o.gift_card_amount > 0 then update public.gift_cards set balance = balance + o.gift_card_amount where upper(code) = o.gift_card_code; end if;
  update public.gift_cards set is_active = false where order_id = p_order;
  update public.orders set status = 'iptal', payment_status = case when payment_status = 'odendi' then 'iade' else 'basarisiz' end where id = p_order;
end; $$;

-- ---------- Maliyet ve kâr ----------
alter table public.products add column if not exists print_grams numeric(10,1);
alter table public.products add column if not exists print_hours numeric(6,2);
alter table public.products add column if not exists extra_cost numeric(10,2) not null default 0;
alter table public.products add column if not exists cost_price numeric(10,2);
alter table public.order_items add column if not exists unit_cost numeric(10,2);
alter table public.settings add column if not exists filament_gram_cost numeric(10,3) not null default 0.8;
alter table public.settings add column if not exists printer_hour_cost numeric(10,2) not null default 12;
alter table public.settings add column if not exists low_stock_threshold int not null default 3;

-- Sipariş anında maliyeti kaleme kaydet (sonradan maliyet değişse de rapor doğru kalır)
create or replace function public.set_item_cost() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.product_id is not null and new.unit_cost is null then
    select case when new.unit = 'paket' then p.cost_price * p.pack_size else p.cost_price end into new.unit_cost
    from public.products p where p.id = new.product_id;
  end if;
  return new;
end; $$;
drop trigger if exists order_items_cost on public.order_items;
create trigger order_items_cost before insert on public.order_items for each row execute function public.set_item_cost();

-- ---------- Baskı kuyruğu ----------
create table if not exists public.printers (
  id uuid primary key default gen_random_uuid(),
  name text not null, is_active boolean not null default true, sort int not null default 0
);
create table if not exists public.print_jobs (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references public.order_items(id) on delete cascade,
  title text not null,
  printer_id uuid references public.printers(id) on delete set null,
  status text not null default 'bekliyor' check (status in ('bekliyor','basiliyor','son_islem','bitti')),
  hours numeric(6,2), note text, sort int not null default 0,
  started_at timestamptz, finished_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.printers enable row level security;
alter table public.print_jobs enable row level security;
drop policy if exists "yazici_staff" on public.printers;
create policy "yazici_staff" on public.printers for all using (public.is_staff('siparis')) with check (public.is_staff('siparis'));
drop policy if exists "is_staff" on public.print_jobs;
create policy "is_staff" on public.print_jobs for all using (public.is_staff('siparis')) with check (public.is_staff('siparis'));
insert into public.printers (name, sort) select 'Yazıcı 1', 1 where not exists (select 1 from public.printers);

-- ---------- Blog ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null, slug text not null unique, excerpt text, content text not null default '',
  cover text, is_published boolean not null default false, published_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.posts enable row level security;
drop policy if exists "yazi_oku" on public.posts;
create policy "yazi_oku" on public.posts for select using (is_published or public.is_staff('urun'));
drop policy if exists "yazi_yaz" on public.posts;
create policy "yazi_yaz" on public.posts for all using (public.is_staff('urun')) with check (public.is_staff('urun'));

-- ---------- Yazıcı ve filament vitrini ----------
alter table public.products add column if not exists brand text;
alter table public.products add column if not exists color_hex text;
alter table public.products add column if not exists group_key text;
alter table public.products add column if not exists variant_label text;
create index if not exists products_group_idx on public.products(group_key);

insert into public.products (section, category_id, name, slug, description, price, stock, images, brand, color_hex, group_key, variant_label, specs, is_active)
select 'yazici', c.id, v.name, v.slug, v.descr, v.price, 0, array['/ornek/yazici.svg'], v.brand, v.hex, v.grp, v.lbl, v.specs::jsonb, true
from (values
 ('filamentler','PLA filament 1 kg - Siyah','pla-1kg-siyah','Kolay basılan, kokusuz PLA filament. 1,75 mm, ±0,02 mm hassasiyet.',549.90,'3D Dünyası','#1E1E22','pla-siyah','1 kg','[{"ad":"Çap","deger":"1,75 mm"},{"ad":"Baskı sıcaklığı","deger":"190-220 °C"},{"ad":"Tabla sıcaklığı","deger":"50-60 °C"}]'),
 ('filamentler','PLA filament 250 g - Siyah','pla-250g-siyah','Deneme ve küçük projeler için 250 g makara.',179.90,'3D Dünyası','#1E1E22','pla-siyah','250 g','[{"ad":"Çap","deger":"1,75 mm"},{"ad":"Baskı sıcaklığı","deger":"190-220 °C"}]'),
 ('filamentler','PLA filament 1 kg - Turuncu','pla-1kg-turuncu','Canlı turuncu PLA filament. 1,75 mm.',549.90,'3D Dünyası','#E8620C','pla-turuncu','1 kg','[{"ad":"Çap","deger":"1,75 mm"},{"ad":"Baskı sıcaklığı","deger":"190-220 °C"}]'),
 ('filamentler','PETG filament 1 kg - Beyaz','petg-1kg-beyaz','Dayanıklı, darbeye ve ısıya daha dirençli PETG.',629.90,'3D Dünyası','#F4F4F2','petg-beyaz','1 kg','[{"ad":"Çap","deger":"1,75 mm"},{"ad":"Baskı sıcaklığı","deger":"230-250 °C"},{"ad":"Tabla sıcaklığı","deger":"70-85 °C"}]'),
 ('yazicilar','Başlangıç seviyesi FDM 3D yazıcı','fdm-baslangic-yazici','Kutudan çıkar çıkmaz baskıya hazır, 220 × 220 × 250 mm baskı alanı.',0,'Yakında','','','','[{"ad":"Baskı alanı","deger":"220 × 220 × 250 mm"}]')
) as v(cat, name, slug, descr, price, brand, hex, grp, lbl, specs)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;
delete from public.products where slug = 'fdm-3d-yazici' and not exists (select 1 from public.order_items where product_id = products.id);
