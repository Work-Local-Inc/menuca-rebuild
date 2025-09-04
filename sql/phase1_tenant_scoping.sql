-- Phase 1 — Tenant Scoping (backwards‑compatible & idempotent)

-- 1) Add tenant_id nullable, then backfill, then set not null
alter table if exists public.restaurants
  add column if not exists tenant_id text;

alter table if exists public.restaurant_menus
  add column if not exists tenant_id text;

-- menu_items may or may not already have tenant_id depending on environment; keep nullable for now
alter table if exists public.menu_items
  add column if not exists tenant_id text;

-- Backfill tenant_id using restaurant -> menu chain where possible
update public.restaurants r
set tenant_id = coalesce(r.tenant_id, 'default-tenant')
where r.tenant_id is null;

update public.restaurant_menus rm
set tenant_id = coalesce(rm.tenant_id, r.tenant_id, 'default-tenant')
from public.restaurants r
where rm.restaurant_id = r.id and rm.tenant_id is null;

update public.menu_items mi
set tenant_id = coalesce(mi.tenant_id, rm.tenant_id, 'default-tenant')
from public.menu_categories mc
join public.restaurant_menus rm on rm.id = mc.menu_id
where mi.category_id = mc.id and mi.tenant_id is null;

-- Indexes
create index if not exists idx_restaurants_tenant_id on public.restaurants(tenant_id);
create index if not exists idx_restaurant_menus_tenant_id on public.restaurant_menus(tenant_id);
create index if not exists idx_menu_items_tenant_id on public.menu_items(tenant_id);

-- Optionally set NOT NULL after backfill (commented to avoid breaking legacy data in interim)
-- alter table public.restaurants alter column tenant_id set not null;
-- alter table public.restaurant_menus alter column tenant_id set not null;
-- alter table public.menu_items alter column tenant_id set not null;

-- Starter RLS: keep public reads as-is; write scoping comes later
alter table if exists public.restaurants enable row level security;
alter table if exists public.restaurant_menus enable row level security;
alter table if exists public.menu_categories enable row level security;
alter table if exists public.menu_items enable row level security;

do $$ begin
  execute 'create policy restaurants_public_read on public.restaurants for select using (true)';
exception when duplicate_object then null; end $$;

do $$ begin
  execute 'create policy menus_public_read on public.restaurant_menus for select using (true)';
exception when duplicate_object then null; end $$;

do $$ begin
  execute 'create policy cats_public_read on public.menu_categories for select using (true)';
exception when duplicate_object then null; end $$;

do $$ begin
  execute 'create policy items_public_read on public.menu_items for select using (true)';
exception when duplicate_object then null; end $$;

select 'Phase 1 complete: tenant_id backfilled + indexes + starter RLS' as status;


