-- =====================================================================
-- 3D Dünyası - Güncelleme 3 (Paket 1: ürün sayfası, özel sipariş, bildirimler)
-- Supabase > SQL Editor'da BİR KEZ çalıştırın.
-- =====================================================================

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
