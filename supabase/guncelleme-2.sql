-- =====================================================================
-- 3D Dünyası - Güncelleme 2
-- Daha önce schema.sql'i çalıştırdıysanız SADECE bu dosyayı çalıştırın.
-- (Sıfırdan kurulumda schema.sql zaten bunları içerir.)
-- =====================================================================

-- Açılış tarihi (geri sayım sayacı için) - admin panelinden ayarlanır
alter table public.settings add column if not exists launch_at timestamptz;

-- İletişim bilgileri
update public.settings set
  contact_phone = '0542 146 14 50',
  whatsapp = '905421461450',
  address = 'Ankara, Türkiye'
where id = 1;

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
