-- Global settings for what free users can access
create table if not exists public.free_access_settings (
  id text primary key default 'global',
  allowed_modules text[] not null default array['ciclo-de-juros-e-spx500']::text[],
  allow_dashboard boolean not null default false,
  allow_dca_calculator boolean not null default false,
  updated_at timestamptz default now()
);

alter table public.free_access_settings enable row level security;

-- Anyone can read the settings
create policy if not exists "Anyone can read free access settings" on public.free_access_settings
  for select using (true);

-- Only admins can update
create policy if not exists "Admins can manage free access settings" on public.free_access_settings
  for all using (public.has_role(auth.uid(), 'admin'));

-- Ensure there is at least one row
insert into public.free_access_settings (id)
values ('global')
on conflict (id) do nothing;


