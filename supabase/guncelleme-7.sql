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
