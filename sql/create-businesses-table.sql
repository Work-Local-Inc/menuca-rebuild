-- Creates the public.businesses table expected by the dashboard settings
create table if not exists public.businesses (
  id uuid primary key,
  slug text unique,
  name text not null,
  phone text,
  timezone text,
  currency text default 'CAD',
  is_open boolean default true,
  order_limit integer default 0,
  address jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Basic RLS setup (adjust to your tenancy model)
alter table public.businesses enable row level security;

do $$ begin
  create policy if not exists "allow_read_public_businesses"
  on public.businesses for select
  using (true);
exception when others then null; end $$;

-- Upsert trigger for updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists set_businesses_updated_at on public.businesses;
create trigger set_businesses_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();


