-- =====================================================================
-- Ahmedabad Games Connect: database setup
-- Run this whole file ONCE in Supabase: SQL Editor > New query > paste > Run
-- =====================================================================

-- 1. Admin list (people allowed to see and manage submissions)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admin sees own row" on public.admins;
create policy "admin sees own row" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- 2. Tables for visitor submissions
create table if not exists public.hazard_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new',
  category text not null,
  severity text,
  location text,
  description text,
  vehicle_no text,
  phone text,
  photo_path text
);

create table if not exists public.parking_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new',
  name text not null,
  phone text not null,
  vehicle_no text not null,
  vehicle_type text,
  members int,
  venue text,
  park_date date,
  arrival_time time,
  hours int,
  accessible text
);

create table if not exists public.parking_listings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new',
  name text not null,
  phone text not null,
  address text not null,
  landmark text,
  floor_level text,
  location_pin text,
  nearest_venue text,
  vehicle_type text,
  spaces int,
  space_size text,
  rate text,
  availability text,
  owner_type text
);

create table if not exists public.food_vendors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new',
  name text not null,
  phone text not null,
  stall_name text not null,
  food_type text,
  veg_type text,
  cart_type text,
  area text,
  timings text,
  menu text,
  fssai_no text,
  vending_cert_no text
);

create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new',
  name text not null,
  phone text not null,
  skills text,
  availability text
);

-- Special help numbers added by the local administration (visible to everyone)
create table if not exists public.help_numbers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'approved',
  active boolean not null default true,
  name text not null,
  number text not null,
  note text
);

-- 3. Security rules (Row Level Security)
-- Visitors (not logged in) can ADD submissions but can never read them.
-- Admins can read, update and delete everything.
do $$
declare t text;
begin
  foreach t in array array['hazard_reports','parking_requests','parking_listings','food_vendors','volunteers','help_numbers']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format('create policy "admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Visitors may insert into the five submission tables only as "new"
do $$
declare t text;
begin
  foreach t in array array['hazard_reports','parking_requests','parking_listings','food_vendors','volunteers']
  loop
    execute format('drop policy if exists "public can submit" on public.%I', t);
    execute format('create policy "public can submit" on public.%I for insert to anon, authenticated with check (status = ''new'')', t);
  end loop;
end $$;

-- Everyone can read active special help numbers
drop policy if exists "public reads help numbers" on public.help_numbers;
create policy "public reads help numbers" on public.help_numbers
  for select to anon, authenticated using (active = true);

-- 4. Private photo storage for hazard reports (max 2 MB, images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hazard-photos', 'hazard-photos', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "public can upload hazard photos" on storage.objects;
create policy "public can upload hazard photos" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'hazard-photos');

drop policy if exists "admin reads hazard photos" on storage.objects;
create policy "admin reads hazard photos" on storage.objects
  for select to authenticated using (bucket_id = 'hazard-photos' and public.is_admin());

drop policy if exists "admin deletes hazard photos" on storage.objects;
create policy "admin deletes hazard photos" on storage.objects
  for delete to authenticated using (bucket_id = 'hazard-photos' and public.is_admin());

-- 5. AFTER you create your admin user (see README, step 3), run this line
--    with YOUR email to make that user an admin:
-- insert into public.admins (user_id) select id from auth.users where email = 'YOUR_EMAIL_HERE';
