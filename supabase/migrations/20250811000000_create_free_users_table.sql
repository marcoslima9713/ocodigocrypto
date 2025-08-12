-- Tabela para usuários gratuitos (não pagantes)
create table if not exists public.free_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  allowed_modules text[] not null default array['ciclo-de-juros-e-spx500']::text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.free_users enable row level security;

-- Políticas: cada usuário vê e gerencia apenas seu próprio registro
create policy "Users can view their own free access" on public.free_users
  for select using (auth.uid() = user_id);

create policy "Users can insert their own free access" on public.free_users
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own free access" on public.free_users
  for update using (auth.uid() = user_id);

-- Gatilho para updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_free_users_updated_at on public.free_users;
create trigger set_free_users_updated_at
before update on public.free_users
for each row execute function public.set_updated_at();


