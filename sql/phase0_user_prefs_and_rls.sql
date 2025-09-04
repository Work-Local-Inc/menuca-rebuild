-- Phase 0 — Housekeeping (idempotent)
-- 1) user_preferences table + RLS
-- 2) RLS helper functions: has_role(), is_admin()

-- user_preferences
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_restaurant_id uuid,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

-- Select/update only by the owner of the row
create policy if not exists user_prefs_self_select on public.user_preferences
for select using (auth.uid() = user_id);

create policy if not exists user_prefs_self_upsert on public.user_preferences
for insert with check (auth.uid() = user_id);

create policy if not exists user_prefs_self_update on public.user_preferences
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Helper link table for roles (if missing)
create table if not exists public.user_restaurant_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  role text not null check (role in ('owner','staff','admin')),
  created_at timestamptz default now(),
  primary key (user_id, restaurant_id, role)
);

create index if not exists idx_urr_user on public.user_restaurant_roles(user_id);
create index if not exists idx_urr_restaurant on public.user_restaurant_roles(restaurant_id);
create index if not exists idx_urr_role on public.user_restaurant_roles(role);

alter table public.user_restaurant_roles enable row level security;

-- Permissive read for now; restrict later if needed
create policy if not exists urr_read_all on public.user_restaurant_roles for select using (true);

-- Helper functions
create or replace function public.has_role(r_id uuid, role text)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_restaurant_roles urr
    where urr.user_id = auth.uid()
      and (urr.restaurant_id = r_id or urr.restaurant_id is null)
      and urr.role = role
  )
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_restaurant_roles urr
    where urr.user_id = auth.uid() and urr.role = 'admin'
  )
$$;

-- Success marker
select 'Phase 0 complete: user_preferences + RLS helpers ready' as status;


