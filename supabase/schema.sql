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
  whatsapp text default '905421461450',
  contact_email text default 'iletisim@xn--3ddnyas-p2a59b.com.tr',
  contact_phone text default '0542 146 14 50',
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

-- ---------- AÇILIŞ TARİHİ ----------
alter table public.settings add column if not exists launch_at timestamptz;

-- E-posta bülteni aboneleri
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
drop policy if exists "bulten_kayit" on public.newsletter_subscribers;
create policy "bulten_kayit" on public.newsletter_subscribers for insert with check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
drop policy if exists "bulten_admin" on public.newsletter_subscribers;
create policy "bulten_admin" on public.newsletter_subscribers for select using (public.is_admin());
drop policy if exists "bulten_sil" on public.newsletter_subscribers;
create policy "bulten_sil" on public.newsletter_subscribers for delete using (public.is_admin());

-- Galeri: Instagram gönderileri ve atölye fotoğrafları
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('instagram','atolye')),
  image_url text not null,
  link text,
  caption text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.gallery_items enable row level security;
drop policy if exists "galeri_oku" on public.gallery_items;
create policy "galeri_oku" on public.gallery_items for select using (true);
drop policy if exists "galeri_yaz" on public.gallery_items;
create policy "galeri_yaz" on public.gallery_items for all using (public.is_admin()) with check (public.is_admin());

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

-- Ürünlere video, 3D model, teknik bilgi ve canlı önizleme
alter table public.products add column if not exists video_url text;
alter table public.products add column if not exists model_url text;
alter table public.products add column if not exists specs jsonb not null default '[]';
alter table public.products add column if not exists preview_type text check (preview_type in ('isimlik','plaka','etiket'));

-- Fotoğraflı yorumlar
alter table public.reviews add column if not exists images text[] not null default '{}';
insert into storage.buckets (id, name, public) values ('yorum-gorselleri','yorum-gorselleri', true) on conflict do nothing;
drop policy if exists "yorum_gorsel_oku" on storage.objects;
create policy "yorum_gorsel_oku" on storage.objects for select using (bucket_id = 'yorum-gorselleri');
drop policy if exists "yorum_gorsel_yukle" on storage.objects;
create policy "yorum_gorsel_yukle" on storage.objects for insert with check (
  bucket_id = 'yorum-gorselleri' and auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text);

-- Soru-cevap
create table if not exists public.product_questions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text,
  question text not null check (length(question) between 5 and 600),
  answer text,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.product_questions enable row level security;
drop policy if exists "soru_oku" on public.product_questions;
create policy "soru_oku" on public.product_questions for select using (answer is not null or user_id = auth.uid() or public.is_admin());
drop policy if exists "soru_sor" on public.product_questions;
create policy "soru_sor" on public.product_questions for insert with check (user_id = auth.uid() and answer is null);
drop policy if exists "soru_admin" on public.product_questions;
create policy "soru_admin" on public.product_questions for update using (public.is_admin());
drop policy if exists "soru_sil" on public.product_questions;
create policy "soru_sil" on public.product_questions for delete using (public.is_admin());

-- Stoğa gelince haber ver
create table if not exists public.stock_alerts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  email text not null,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (product_id, email)
);
alter table public.stock_alerts enable row level security;
drop policy if exists "stok_alarm_ekle" on public.stock_alerts;
create policy "stok_alarm_ekle" on public.stock_alerts for insert with check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and notified_at is null);
drop policy if exists "stok_alarm_admin" on public.stock_alerts;
create policy "stok_alarm_admin" on public.stock_alerts for all using (public.is_admin());

-- Özel sipariş: seçimler, tahmini fiyat ve siparişe dönüşme
alter table public.custom_requests add column if not exists material text;
alter table public.custom_requests add column if not exists color text;
alter table public.custom_requests add column if not exists infill int;
alter table public.custom_requests add column if not exists layer_height numeric(4,2);
alter table public.custom_requests add column if not exists scale int default 100;
alter table public.custom_requests add column if not exists volume_cm3 numeric(10,2);
alter table public.custom_requests add column if not exists dims text;
alter table public.custom_requests add column if not exists estimate_price numeric(10,2);
alter table public.custom_requests add column if not exists order_id uuid references public.orders(id) on delete set null;

-- Tahmini fiyat ayarları (admin panelinden düzenlenir)
alter table public.settings add column if not exists pricing jsonb not null default '{
  "baslangic": 50,
  "min_fiyat": 75,
  "malzemeler": [
    {"ad": "PLA",  "yogunluk": 1.24, "gram_fiyat": 1.5},
    {"ad": "PETG", "yogunluk": 1.27, "gram_fiyat": 1.8},
    {"ad": "TPU",  "yogunluk": 1.21, "gram_fiyat": 2.5},
    {"ad": "ABS",  "yogunluk": 1.04, "gram_fiyat": 1.9}
  ],
  "renkler": ["Beyaz", "Siyah", "Gri", "Kırmızı", "Mavi", "Turuncu", "Yeşil", "Sarı"],
  "kaliteler": [
    {"ad": "Taslak (0,28 mm)", "katman": 0.28, "carpan": 0.85},
    {"ad": "Standart (0,20 mm)", "katman": 0.20, "carpan": 1.0},
    {"ad": "İnce (0,12 mm)", "katman": 0.12, "carpan": 1.4}
  ]
}';

-- Onaylanan teklifi siparişe dönüştür (fiyat sunucuda tekliften alınır)
create or replace function public.accept_quote(p_request uuid, p_address jsonb, p_note text default null)
returns public.orders language plpgsql security definer set search_path = public as $$
declare r public.custom_requests; s public.settings; o public.orders; v_ship numeric;
begin
  select * into r from public.custom_requests where id = p_request for update;
  if not found or r.user_id is distinct from auth.uid() then raise exception 'Talep bulunamadı'; end if;
  if r.status <> 'teklif_verildi' or r.quote_price is null then raise exception 'Bu talep için geçerli bir teklif yok'; end if;
  if r.order_id is not null then raise exception 'Bu teklif zaten siparişe dönüştürülmüş'; end if;
  select * into s from public.settings where id = 1;
  v_ship := case when r.quote_price >= s.free_shipping_limit then 0 else s.shipping_fee end;
  insert into public.orders (order_no, user_id, email, payment_method, subtotal, discount, shipping, total, shipping_address, note)
  values ('3DD-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)), auth.uid(), r.email, 'havale',
          r.quote_price, 0, v_ship, r.quote_price + v_ship, p_address, p_note)
  returning * into o;
  insert into public.order_items (order_id, product_id, name, unit, unit_price, quantity, personalization)
  values (o.id, null, 'Özel baskı: ' || left(r.description, 80), 'adet', r.quote_price, 1,
          nullif(concat_ws(' / ', r.material, r.color, case when r.infill is not null then '%' || r.infill || ' doluluk' end, r.personalization_text), ''));
  update public.custom_requests set status = 'onaylandi', order_id = o.id where id = r.id;
  return o;
end; $$;


-- ########## guncelleme-4.sql ##########
-- =====================================================================
-- 3D Dünyası - Güncelleme 4 (Paket 2: kampanya, puan, hesap, teslimat)
-- =====================================================================

-- ---------- Ayarlar ----------
alter table public.settings add column if not exists first_order_pct numeric(5,2) not null default 10;
alter table public.settings add column if not exists loyalty_pct numeric(5,2) not null default 5;
alter table public.settings add column if not exists gift_wrap_fee numeric(10,2) not null default 49.90;
alter table public.settings add column if not exists local_delivery_fee numeric(10,2) not null default 60;
alter table public.settings add column if not exists pickup_address text default 'Atölyemiz, Ankara (adres sipariş sonrası iletilir)';
alter table public.settings add column if not exists cart_reminder boolean not null default true;

-- ---------- Ürün: süreli indirim ve set içeriği ----------
alter table public.products add column if not exists sale_ends_at timestamptz;
alter table public.products add column if not exists bundle_items jsonb not null default '[]';

-- İndirim süresi dolduysa eski fiyata dönülür
create or replace function public.effective_price(p public.products) returns numeric
language sql stable as $$
  select case when p.sale_ends_at is not null and p.sale_ends_at < now() and p.compare_price is not null then p.compare_price else p.price end;
$$;

-- ---------- X al Y öde kampanyaları ----------
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  buy_qty int not null check (buy_qty >= 2),
  pay_qty int not null check (pay_qty >= 1),
  product_id uuid references public.products(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (pay_qty < buy_qty)
);
alter table public.promotions enable row level security;
drop policy if exists "kampanya_oku" on public.promotions;
create policy "kampanya_oku" on public.promotions for select using (true);
drop policy if exists "kampanya_yaz" on public.promotions;
create policy "kampanya_yaz" on public.promotions for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Puan sistemi ----------
alter table public.profiles add column if not exists points numeric(10,2) not null default 0;
create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  amount numeric(10,2) not null,
  reason text not null,
  created_at timestamptz not null default now()
);
alter table public.point_transactions enable row level security;
drop policy if exists "puan_oku" on public.point_transactions;
create policy "puan_oku" on public.point_transactions for select using (user_id = auth.uid() or public.is_admin());

-- ---------- Hediye çekleri ----------
create table if not exists public.gift_cards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  initial_amount numeric(10,2) not null check (initial_amount > 0),
  balance numeric(10,2) not null check (balance >= 0),
  order_id uuid references public.orders(id) on delete set null,
  recipient_email text,
  recipient_name text,
  message text,
  expires_at timestamptz default (now() + interval '1 year'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.gift_cards enable row level security;
drop policy if exists "cek_admin" on public.gift_cards;
create policy "cek_admin" on public.gift_cards for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Siparişe yeni alanlar ----------
alter table public.orders add column if not exists delivery_method text not null default 'kargo' check (delivery_method in ('kargo','elden','gel_al'));
alter table public.orders add column if not exists gift_wrap boolean not null default false;
alter table public.orders add column if not exists gift_note text;
alter table public.orders add column if not exists gift_wrap_fee numeric(10,2) not null default 0;
alter table public.orders add column if not exists points_used numeric(10,2) not null default 0;
alter table public.orders add column if not exists points_earned numeric(10,2) not null default 0;
alter table public.orders add column if not exists gift_card_code text;
alter table public.orders add column if not exists gift_card_amount numeric(10,2) not null default 0;
alter table public.orders add column if not exists promo_discount numeric(10,2) not null default 0;
alter table public.orders add column if not exists first_order_discount numeric(10,2) not null default 0;
alter table public.orders add column if not exists invoice_path text;
alter table public.order_items add column if not exists kind text not null default 'urun' check (kind in ('urun','ozel','hediye_ceki'));
alter table public.order_items add column if not exists meta jsonb;

-- ---------- Kayıtlı adresler ----------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Ev',
  full_name text not null, phone text not null, city text not null, district text not null, address text not null, zip text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.addresses enable row level security;
drop policy if exists "adres_kendi" on public.addresses;
create policy "adres_kendi" on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Sunucuda sepet (terk edilen sepet hatırlatması için) ----------
create table if not exists public.carts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  reminded_at timestamptz
);
alter table public.carts enable row level security;
drop policy if exists "sepet_kendi" on public.carts;
create policy "sepet_kendi" on public.carts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- İade talepleri ----------
create table if not exists public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  reason text not null,
  details text,
  iban text,
  status text not null default 'yeni' check (status in ('yeni','onaylandi','reddedildi','tamamlandi')),
  admin_note text,
  created_at timestamptz not null default now()
);
alter table public.return_requests enable row level security;
drop policy if exists "iade_ekle" on public.return_requests;
create policy "iade_ekle" on public.return_requests for insert with check (
  user_id = auth.uid() and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid() and o.status = 'teslim_edildi'));
drop policy if exists "iade_oku" on public.return_requests;
create policy "iade_oku" on public.return_requests for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "iade_admin" on public.return_requests;
create policy "iade_admin" on public.return_requests for update using (public.is_admin());

-- ---------- Kurumsal teklif talepleri ----------
create table if not exists public.corporate_requests (
  id uuid primary key default gen_random_uuid(),
  company text not null, full_name text not null, email text not null, phone text,
  quantity text, details text not null,
  status text not null default 'yeni' check (status in ('yeni','gorusuluyor','teklif_verildi','kazanildi','kaybedildi')),
  admin_note text,
  created_at timestamptz not null default now()
);
alter table public.corporate_requests enable row level security;
drop policy if exists "kurumsal_ekle" on public.corporate_requests;
create policy "kurumsal_ekle" on public.corporate_requests for insert with check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and status = 'yeni');
drop policy if exists "kurumsal_admin" on public.corporate_requests;
create policy "kurumsal_admin" on public.corporate_requests for all using (public.is_admin());

-- ---------- Faturalar (özel depolama) ----------
insert into storage.buckets (id, name, public) values ('faturalar','faturalar', false) on conflict do nothing;
drop policy if exists "fatura_admin" on storage.objects;
create policy "fatura_admin" on storage.objects for all using (bucket_id = 'faturalar' and public.is_admin()) with check (bucket_id = 'faturalar' and public.is_admin());
drop policy if exists "fatura_musteri" on storage.objects;
create policy "fatura_musteri" on storage.objects for select using (
  bucket_id = 'faturalar' and exists (select 1 from public.orders o where o.invoice_path = name and o.user_id = auth.uid()));

-- ---------- Ödeme ekranı bilgisi ----------
create or replace function public.checkout_info() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'points', coalesce((select points from public.profiles where id = auth.uid()), 0),
    'first_order', not exists (select 1 from public.orders where user_id = auth.uid() and status <> 'iptal'),
    'first_order_pct', s.first_order_pct, 'gift_wrap_fee', s.gift_wrap_fee, 'local_delivery_fee', s.local_delivery_fee,
    'pickup_address', s.pickup_address, 'loyalty_pct', s.loyalty_pct)
  from public.settings s where s.id = 1;
$$;

create or replace function public.check_gift_card(p_code text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare g public.gift_cards;
begin
  select * into g from public.gift_cards where upper(code) = upper(trim(p_code));
  if not found or not g.is_active or g.balance <= 0 then return jsonb_build_object('ok', false, 'message', 'Hediye çeki geçersiz veya bakiyesi yok'); end if;
  if g.expires_at is not null and g.expires_at < now() then return jsonb_build_object('ok', false, 'message', 'Hediye çekinin süresi dolmuş'); end if;
  return jsonb_build_object('ok', true, 'balance', g.balance);
end; $$;

-- ---------- SİPARİŞ OLUŞTURMA v2 ----------
drop function if exists public.place_order(jsonb, jsonb, text, text, text);
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

-- ---------- Ödenen siparişteki hediye çeklerini oluştur ----------
create or replace function public.issue_gift_cards(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare i record; n int;
begin
  for i in select * from public.order_items where order_id = p_order and kind = 'hediye_ceki' loop
    for n in 1..i.quantity loop
      insert into public.gift_cards (code, initial_amount, balance, order_id, recipient_email, recipient_name, message)
      values ('HC-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)), i.unit_price, i.unit_price, p_order,
              i.meta->>'recipient_email', i.meta->>'recipient_name', i.meta->>'message');
    end loop;
  end loop;
end; $$;

create or replace function public.on_order_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_rate numeric; v_earn numeric;
begin
  -- Ödeme onaylanınca hediye çeklerini üret (bir kez)
  if new.payment_status = 'odendi' and old.payment_status <> 'odendi'
     and not exists (select 1 from public.gift_cards where order_id = new.id) then
    perform public.issue_gift_cards(new.id);
  end if;
  -- Teslim edilince puan kazandır (hediye çeki ve kargo hariç, ödenen tutar üzerinden)
  if new.status = 'teslim_edildi' and old.status <> 'teslim_edildi' and new.user_id is not null and new.points_earned = 0 then
    select loyalty_pct into v_rate from public.settings where id = 1;
    v_earn := floor((new.total - new.shipping - new.gift_wrap_fee
               - coalesce((select sum(unit_price*quantity) from public.order_items where order_id = new.id and kind = 'hediye_ceki'),0))
               * coalesce(v_rate,0) / 100);
    if v_earn > 0 then
      update public.profiles set points = points + v_earn where id = new.user_id;
      insert into public.point_transactions (user_id, order_id, amount, reason) values (new.user_id, new.id, v_earn, 'Sipariş puanı');
      new.points_earned := v_earn;
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists orders_change on public.orders;
create trigger orders_change before update on public.orders for each row execute function public.on_order_change();

-- ---------- İptal v2: stok, kupon, puan ve hediye çeki iadesi ----------
create or replace function public.cancel_order(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders; i record;
begin
  if not public.is_admin() and auth.role() <> 'service_role' then raise exception 'Yetkisiz'; end if;
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

-- ---------- Ödeme ekranı için birebir tutar önizlemesi (hiçbir şey kaydetmez) ----------
create or replace function public.preview_order(
  p_items jsonb, p_address jsonb, p_coupon text default null, p_delivery text default 'kargo',
  p_gift_wrap boolean default false, p_use_points boolean default false, p_gift_code text default null
) returns jsonb language plpgsql as $$
declare o public.orders;
begin
  begin
    o := public.place_order(p_items, p_address, 'havale', p_coupon, null, p_delivery, p_gift_wrap, null, p_use_points, p_gift_code);
    raise exception '__onizleme__';
  exception when others then
    if sqlerrm <> '__onizleme__' then return jsonb_build_object('ok', false, 'message', sqlerrm); end if;
  end;
  return jsonb_build_object('ok', true, 'subtotal', o.subtotal, 'promo', o.promo_discount, 'first_order', o.first_order_discount,
    'coupon', o.discount - o.promo_discount - o.first_order_discount, 'shipping', o.shipping, 'gift_wrap', o.gift_wrap_fee,
    'points', o.points_used, 'gift_card', o.gift_card_amount, 'total', o.total);
end; $$;

-- Kargo takip bağlantıları (admin panelinden düzenlenebilir; {kod} takip numarasıyla değişir)
alter table public.settings add column if not exists cargo_links jsonb not null default '{
  "Yurtiçi Kargo": "https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code={kod}",
  "Aras Kargo": "https://kargotakip.araskargo.com.tr/mainpage.aspx?code={kod}",
  "MNG Kargo": "https://www.mngkargo.com.tr/gonderi-takip/?code={kod}",
  "PTT Kargo": "https://gonderitakip.ptt.gov.tr/Track/Verify?q={kod}",
  "Sürat Kargo": "https://suratkargo.com.tr/KargoTakip/?kargotakipno={kod}"
}';


-- ########## guncelleme-5.sql ##########
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


-- ########## guncelleme-6.sql ##########
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


-- ########## guncelleme-7.sql ##########
-- =====================================================================
-- 3D Dünyası - Güncelleme 7 (Aşama 1: atölye yönetimi ve temel eksikler)
-- =====================================================================

-- ---------- Tedarikçiler ----------
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null, contact text, phone text, email text, website text, notes text,
  created_at timestamptz not null default now()
);
alter table public.suppliers enable row level security;
drop policy if exists "tedarikci_admin" on public.suppliers;
create policy "tedarikci_admin" on public.suppliers for all using (public.is_staff('siparis')) with check (public.is_staff('siparis'));

-- ---------- Filament envanteri ----------
create table if not exists public.filaments (
  id uuid primary key default gen_random_uuid(),
  material text not null default 'PLA', color text not null, color_hex text, brand text,
  remaining_g numeric(10,1) not null default 0, low_threshold_g numeric(10,1) not null default 250,
  cost_per_kg numeric(10,2), supplier_id uuid references public.suppliers(id) on delete set null,
  is_active boolean not null default true, notes text,
  created_at timestamptz not null default now()
);
create table if not exists public.filament_movements (
  id uuid primary key default gen_random_uuid(),
  filament_id uuid not null references public.filaments(id) on delete cascade,
  change_g numeric(10,1) not null, reason text not null,
  print_job_id uuid references public.print_jobs(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.filaments enable row level security;
alter table public.filament_movements enable row level security;
drop policy if exists "filament_staff" on public.filaments;
create policy "filament_staff" on public.filaments for all using (public.is_staff('siparis')) with check (public.is_staff('siparis'));
drop policy if exists "filament_hareket_staff" on public.filament_movements;
create policy "filament_hareket_staff" on public.filament_movements for all using (public.is_staff('siparis')) with check (public.is_staff('siparis'));

create or replace function public.apply_filament_movement() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.filaments set remaining_g = greatest(0, remaining_g + new.change_g) where id = new.filament_id;
  return new;
end; $$;
drop trigger if exists filament_movement_apply on public.filament_movements;
create trigger filament_movement_apply after insert on public.filament_movements for each row execute function public.apply_filament_movement();

-- Ürün hangi filamentle basılıyor + baskı işinde kullanılan filament
alter table public.products add column if not exists filament_id uuid references public.filaments(id) on delete set null;
alter table public.print_jobs add column if not exists filament_id uuid references public.filaments(id) on delete set null;
alter table public.print_jobs add column if not exists grams numeric(10,1);

-- ---------- Yazıcı saat sayacı ve bakım ----------
alter table public.printers add column if not exists total_hours numeric(10,2) not null default 0;
alter table public.printers add column if not exists model text;
create table if not exists public.printer_maintenance (
  id uuid primary key default gen_random_uuid(),
  printer_id uuid not null references public.printers(id) on delete cascade,
  task text not null, interval_hours numeric(8,1) not null,
  last_done_hours numeric(10,2) not null default 0, last_done_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.printer_maintenance enable row level security;
drop policy if exists "bakim_staff" on public.printer_maintenance;
create policy "bakim_staff" on public.printer_maintenance for all using (public.is_staff('siparis')) with check (public.is_staff('siparis'));

-- Yeni yazıcıya standart bakım kalemleri
create or replace function public.default_maintenance() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.printer_maintenance (printer_id, task, interval_hours, last_done_hours) values
    (new.id, 'Nozul temizliği / değişimi', 300, new.total_hours),
    (new.id, 'Tabla kalibrasyonu ve temizliği', 100, new.total_hours),
    (new.id, 'Kayış gerginliği ve mil yağlama', 500, new.total_hours);
  return new;
end; $$;
drop trigger if exists printers_default_maintenance on public.printers;
create trigger printers_default_maintenance after insert on public.printers for each row execute function public.default_maintenance();
insert into public.printer_maintenance (printer_id, task, interval_hours)
select p.id, t.task, t.h from public.printers p
cross join (values ('Nozul temizliği / değişimi', 300), ('Tabla kalibrasyonu ve temizliği', 100), ('Kayış gerginliği ve mil yağlama', 500)) as t(task, h)
where not exists (select 1 from public.printer_maintenance m where m.printer_id = p.id);

-- Baskı işi bitince: yazıcı saatini artır, filamenti düş
create or replace function public.on_print_job_done() returns trigger language plpgsql security definer set search_path = public as $$
declare v_item public.order_items; v_prod public.products; v_adet numeric; v_saat numeric; v_gram numeric; v_fil uuid;
begin
  if new.status <> 'bitti' or old.status = 'bitti' then return new; end if;
  if new.order_item_id is not null then
    select * into v_item from public.order_items where id = new.order_item_id;
    select * into v_prod from public.products where id = v_item.product_id;
    v_adet := coalesce(v_item.quantity, 1) * case when v_item.unit = 'paket' then coalesce(v_prod.pack_size, 1) else 1 end;
  end if;
  v_saat := coalesce(new.hours, v_prod.print_hours * v_adet);
  v_gram := coalesce(new.grams, v_prod.print_grams * v_adet);
  v_fil := coalesce(new.filament_id, v_prod.filament_id);
  if new.printer_id is not null and v_saat > 0 then
    update public.printers set total_hours = total_hours + v_saat where id = new.printer_id;
  end if;
  if v_fil is not null and v_gram > 0 then
    insert into public.filament_movements (filament_id, change_g, reason, print_job_id) values (v_fil, -v_gram, 'Baskı: ' || new.title, new.id);
  end if;
  new.hours := v_saat; new.grams := v_gram; new.filament_id := v_fil;
  return new;
end; $$;
drop trigger if exists print_job_done on public.print_jobs;
create trigger print_job_done before update on public.print_jobs for each row execute function public.on_print_job_done();

-- ---------- Gider-gelir defteri ----------
create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('gelir','gider')),
  category text not null, amount numeric(12,2) not null check (amount > 0),
  entry_date date not null default current_date, description text,
  supplier_id uuid references public.suppliers(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.ledger_entries enable row level security;
drop policy if exists "defter_admin" on public.ledger_entries;
create policy "defter_admin" on public.ledger_entries for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Müşteri notları ----------
create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  note text not null, author text,
  created_at timestamptz not null default now()
);
alter table public.customer_notes enable row level security;
drop policy if exists "musteri_not_staff" on public.customer_notes;
create policy "musteri_not_staff" on public.customer_notes for all using (public.is_staff('siparis')) with check (public.is_staff('siparis'));
-- Sipariş sorumlusu müşteri adreslerini de görebilsin
drop policy if exists "adres_staff" on public.addresses;
create policy "adres_staff" on public.addresses for select using (public.is_staff('siparis'));

-- ---------- Hata kayıtları ----------
create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  message text not null, url text, stack text, user_agent text, count int not null default 1,
  last_seen timestamptz not null default now(), created_at timestamptz not null default now(),
  unique (message, url)
);
alter table public.error_logs enable row level security;
drop policy if exists "hata_admin" on public.error_logs;
create policy "hata_admin" on public.error_logs for all using (public.is_admin());

-- ---------- Form güvenliği: herkese açık formlar artık sunucu üzerinden (bot koruması) ----------
drop policy if exists "bulten_kayit" on public.newsletter_subscribers;
drop policy if exists "stok_alarm_ekle" on public.stock_alerts;
drop policy if exists "kurumsal_ekle" on public.corporate_requests;
