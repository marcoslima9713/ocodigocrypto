alter table public.free_access_settings add column if not exists allow_portfolio boolean not null default false;

