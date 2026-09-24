-- =====================================================================
-- 3ddünyası veritabanı şeması
-- Supabase > SQL Editor > New query > bu dosyanın tamamını yapıştırıp RUN
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- PROFİLLER ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- AYARLAR (tek satır) ----------
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  shipping_fee numeric(10,2) not null default 89.90,
  free_shipping_limit numeric(10,2) not null default 750,
  bank_name text default 'Banka adı',
  iban text default 'TR00 0000 0000 0000 0000 0000 00',
  account_holder text default 'Hesap sahibi',
  whatsapp text default '905000000000',
  contact_email text default 'iletisim@3ddunyasi.com',
  contact_phone text default '+90 500 000 00 00',
  address text default 'Ankara, Türkiye',
  instagram text default '3ddunyasi',
  updated_at timestamptz default now()
);
insert into public.settings (id) values (1) on conflict do nothing;

-- ---------- KATEGORİLER ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('baski','malzeme','yazici')),
  name text not null,
  slug text not null unique,
  sort int not null default 0
);

-- ---------- ÜRÜNLER ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('baski','malzeme','yazici')),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10,2) not null check (price >= 0),
  compare_price numeric(10,2),
  stock int not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  sale_unit text not null default 'adet' check (sale_unit in ('adet','paket','ikisi')),
  pack_size int not null default 1 check (pack_size >= 1),
  pack_price numeric(10,2),
  allow_personalization boolean not null default false,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists products_section_idx on public.products(section);
create index if not exists products_name_idx on public.products using gin (to_tsvector('simple', name));

-- ---------- KUPONLAR ----------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('yuzde','tutar')),
  value numeric(10,2) not null check (value > 0),
  min_total numeric(10,2) not null default 0,
  usage_limit int,
  used_count int not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- SİPARİŞLER ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null default 'odeme_bekleniyor'
    check (status in ('odeme_bekleniyor','hazirlaniyor','kargoda','teslim_edildi','iptal')),
  payment_method text not null check (payment_method in ('havale','iyzico')),
  payment_status text not null default 'bekliyor' check (payment_status in ('bekliyor','odendi','basarisiz','iade')),
  payment_ref text,
  subtotal numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  coupon_code text,
  shipping_address jsonb not null,
  cargo_company text,
  tracking_no text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  unit text not null default 'adet',
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  personalization text
);

-- ---------- YORUMLAR ----------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  rating int not null check (rating between 1 and 5),
  comment text,
  is_approved boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

-- ---------- FAVORİLER ----------
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------- ÖZEL SİPARİŞ TALEPLERİ ----------
create table if not exists public.custom_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('stl','yazi')),
  full_name text not null,
  email text not null,
  phone text,
  description text not null,
  personalization_text text,
  file_path text,
  quantity int not null default 1,
  status text not null default 'yeni' check (status in ('yeni','teklif_verildi','onaylandi','reddedildi','tamamlandi')),
  quote_price numeric(10,2),
  admin_note text,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- RLS (satır güvenliği)
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.custom_requests enable row level security;

-- profiles
drop policy if exists "profil_oku" on public.profiles;
create policy "profil_oku" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profil_guncelle" on public.profiles;
create policy "profil_guncelle" on public.profiles for update using (id = auth.uid() or public.is_admin());
-- müşteri kendi rolünü değiştiremesin (SQL Editor'dan yapılan değişikliklere izin verilir)
create or replace function public.protect_role() returns trigger language plpgsql as $$
begin
  if new.role <> old.role and auth.uid() is not null and not public.is_admin() then new.role := old.role; end if;
  return new;
end; $$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles for each row execute function public.protect_role();

-- settings
drop policy if exists "ayar_oku" on public.settings;
create policy "ayar_oku" on public.settings for select using (true);
drop policy if exists "ayar_yaz" on public.settings;
create policy "ayar_yaz" on public.settings for update using (public.is_admin());

-- categories
drop policy if exists "kat_oku" on public.categories;
create policy "kat_oku" on public.categories for select using (true);
drop policy if exists "kat_yaz" on public.categories;
create policy "kat_yaz" on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- products
drop policy if exists "urun_oku" on public.products;
create policy "urun_oku" on public.products for select using (is_active or public.is_admin());
drop policy if exists "urun_yaz" on public.products;
create policy "urun_yaz" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- coupons (sadece admin; kupon kontrolü fonksiyonla yapılır)
drop policy if exists "kupon_admin" on public.coupons;
create policy "kupon_admin" on public.coupons for all using (public.is_admin()) with check (public.is_admin());

-- orders
drop policy if exists "siparis_oku" on public.orders;
create policy "siparis_oku" on public.orders for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "siparis_admin" on public.orders;
create policy "siparis_admin" on public.orders for update using (public.is_admin());

drop policy if exists "kalem_oku" on public.order_items;
create policy "kalem_oku" on public.order_items for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- reviews: herkes onaylıyı okur; sadece teslim alınmış ürüne yorum yapılır
drop policy if exists "yorum_oku" on public.reviews;
create policy "yorum_oku" on public.reviews for select using (is_approved or user_id = auth.uid() or public.is_admin());
drop policy if exists "yorum_ekle" on public.reviews;
create policy "yorum_ekle" on public.reviews for insert with check (
  user_id = auth.uid() and exists (
    select 1 from public.orders o join public.order_items i on i.order_id = o.id
    where o.user_id = auth.uid() and o.status = 'teslim_edildi' and i.product_id = reviews.product_id
  )
);
drop policy if exists "yorum_sil" on public.reviews;
create policy "yorum_sil" on public.reviews for delete using (user_id = auth.uid() or public.is_admin());
drop policy if exists "yorum_admin" on public.reviews;
create policy "yorum_admin" on public.reviews for update using (public.is_admin());

-- favorites
drop policy if exists "fav_kendi" on public.favorites;
create policy "fav_kendi" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- custom_requests
drop policy if exists "talep_ekle" on public.custom_requests;
create policy "talep_ekle" on public.custom_requests for insert with check (user_id = auth.uid());
drop policy if exists "talep_oku" on public.custom_requests;
create policy "talep_oku" on public.custom_requests for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "talep_admin" on public.custom_requests;
create policy "talep_admin" on public.custom_requests for update using (public.is_admin());

-- =====================================================================
-- SİPARİŞ OLUŞTURMA (fiyat, stok ve kupon sunucuda hesaplanır)
-- p_items: [{"product_id": "...", "quantity": 2, "unit": "adet", "personalization": "Ali"}]
-- =====================================================================
create or replace function public.place_order(
  p_items jsonb, p_address jsonb, p_payment text, p_coupon text default null, p_note text default null
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_item jsonb;
  v_prod public.products;
  v_qty int; v_unit text; v_price numeric; v_consume int;
  v_subtotal numeric := 0; v_discount numeric := 0; v_shipping numeric := 0;
  v_coupon public.coupons;
  v_settings public.settings;
  v_order public.orders;
  v_lines jsonb := '[]'::jsonb;
begin
  if v_user is null then raise exception 'Sipariş için giriş yapmalısınız'; end if;
  if p_payment not in ('havale','iyzico') then raise exception 'Geçersiz ödeme yöntemi'; end if;
  if jsonb_array_length(coalesce(p_items,'[]'::jsonb)) = 0 then raise exception 'Sepetiniz boş'; end if;
  select email into v_email from auth.users where id = v_user;
  select * into v_settings from public.settings where id = 1;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, (v_item->>'quantity')::int);
    v_unit := coalesce(v_item->>'unit','adet');
    select * into v_prod from public.products where id = (v_item->>'product_id')::uuid and is_active for update;
    if not found then raise exception 'Ürün bulunamadı veya satışta değil'; end if;
    if v_prod.section = 'yazici' then raise exception 'Bu bölüm henüz satışta değil'; end if;

    if v_unit = 'paket' then
      if v_prod.sale_unit = 'adet' then raise exception '% paket olarak satılmıyor', v_prod.name; end if;
      v_price := coalesce(v_prod.pack_price, v_prod.price * v_prod.pack_size);
      v_consume := v_qty * v_prod.pack_size;
    else
      if v_prod.sale_unit = 'paket' then raise exception '% sadece paket olarak satılıyor', v_prod.name; end if;
      v_unit := 'adet';
      v_price := v_prod.price;
      v_consume := v_qty;
    end if;

    if v_prod.stock < v_consume then
      raise exception '% için yeterli stok yok (kalan: %)', v_prod.name, v_prod.stock;
    end if;
    update public.products set stock = stock - v_consume where id = v_prod.id;

    v_subtotal := v_subtotal + v_price * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_prod.id, 'name', v_prod.name, 'unit', v_unit,
      'unit_price', v_price, 'quantity', v_qty,
      'personalization', case when v_prod.allow_personalization then nullif(trim(v_item->>'personalization'),'') end);
  end loop;

  if p_coupon is not null and length(trim(p_coupon)) > 0 then
    select * into v_coupon from public.coupons where upper(code) = upper(trim(p_coupon)) for update;
    if not found or not v_coupon.is_active then raise exception 'Kupon kodu geçersiz'; end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then raise exception 'Kuponun süresi dolmuş'; end if;
    if v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit then raise exception 'Kupon kullanım limiti dolmuş'; end if;
    if v_subtotal < v_coupon.min_total then raise exception 'Bu kupon için en az % TL alışveriş gerekli', v_coupon.min_total; end if;
    v_discount := case when v_coupon.type = 'yuzde' then round(v_subtotal * v_coupon.value / 100, 2) else least(v_coupon.value, v_subtotal) end;
    update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
  end if;

  v_shipping := case when (v_subtotal - v_discount) >= v_settings.free_shipping_limit then 0 else v_settings.shipping_fee end;

  insert into public.orders (order_no, user_id, email, payment_method, subtotal, discount, shipping, total, coupon_code, shipping_address, note)
  values (
    '3DD-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
    v_user, v_email, p_payment, v_subtotal, v_discount, v_shipping,
    v_subtotal - v_discount + v_shipping, nullif(upper(trim(p_coupon)),''), p_address, p_note)
  returning * into v_order;

  insert into public.order_items (order_id, product_id, name, unit, unit_price, quantity, personalization)
  select v_order.id, (l->>'product_id')::uuid, l->>'name', l->>'unit', (l->>'unit_price')::numeric, (l->>'quantity')::int, l->>'personalization'
  from jsonb_array_elements(v_lines) l;

  return v_order;
end; $$;

-- Kupon ön kontrolü (sepette indirim göstermek için)
create or replace function public.check_coupon(p_code text, p_subtotal numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.coupons;
begin
  select * into c from public.coupons where upper(code) = upper(trim(p_code));
  if not found or not c.is_active then return jsonb_build_object('ok', false, 'message', 'Kupon kodu geçersiz'); end if;
  if c.expires_at is not null and c.expires_at < now() then return jsonb_build_object('ok', false, 'message', 'Kuponun süresi dolmuş'); end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then return jsonb_build_object('ok', false, 'message', 'Kupon kullanım limiti dolmuş'); end if;
  if p_subtotal < c.min_total then return jsonb_build_object('ok', false, 'message', 'Bu kupon için en az ' || c.min_total || ' TL alışveriş gerekli'); end if;
  return jsonb_build_object('ok', true, 'discount',
    case when c.type = 'yuzde' then round(p_subtotal * c.value / 100, 2) else least(c.value, p_subtotal) end);
end; $$;

-- Sipariş iptalinde stok ve kupon iadesi (admin veya sunucu)
create or replace function public.cancel_order(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders; i record;
begin
  if not public.is_admin() and auth.role() <> 'service_role' then raise exception 'Yetkisiz'; end if;
  select * into o from public.orders where id = p_order for update;
  if not found or o.status = 'iptal' then return; end if;
  for i in select oi.*, p.pack_size from public.order_items oi left join public.products p on p.id = oi.product_id where oi.order_id = p_order loop
    if i.product_id is not null then
      update public.products set stock = stock + case when i.unit = 'paket' then i.quantity * coalesce(i.pack_size,1) else i.quantity end
      where id = i.product_id;
    end if;
  end loop;
  if o.coupon_code is not null then
    update public.coupons set used_count = greatest(0, used_count - 1) where upper(code) = o.coupon_code;
  end if;
  update public.orders set status = 'iptal', payment_status = case when payment_status = 'odendi' then 'iade' else 'basarisiz' end where id = p_order;
end; $$;

-- Ürün puan ortalaması görünümü
create or replace view public.product_ratings with (security_invoker = true) as
  select product_id, round(avg(rating)::numeric, 1) as avg_rating, count(*) as review_count
  from public.reviews where is_approved group by product_id;

-- =====================================================================
-- DEPOLAMA (görseller ve STL dosyaları)
-- =====================================================================
insert into storage.buckets (id, name, public) values ('urun-gorselleri','urun-gorselleri', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('ozel-siparis','ozel-siparis', false) on conflict do nothing;

drop policy if exists "gorsel_oku" on storage.objects;
create policy "gorsel_oku" on storage.objects for select using (bucket_id = 'urun-gorselleri');
drop policy if exists "gorsel_yaz" on storage.objects;
create policy "gorsel_yaz" on storage.objects for insert with check (bucket_id = 'urun-gorselleri' and public.is_admin());
drop policy if exists "gorsel_sil" on storage.objects;
create policy "gorsel_sil" on storage.objects for delete using (bucket_id = 'urun-gorselleri' and public.is_admin());

drop policy if exists "stl_yukle" on storage.objects;
create policy "stl_yukle" on storage.objects for insert with check (
  bucket_id = 'ozel-siparis' and auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "stl_oku" on storage.objects;
create policy "stl_oku" on storage.objects for select using (
  bucket_id = 'ozel-siparis' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
