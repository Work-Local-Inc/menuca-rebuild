-- Phase 2 — Sections + Per‑Menu Overrides (idempotent)
-- New: menu_sections, items, menu_section_items
-- Backfill from legacy menu_categories/menu_items
-- Back-compat views: menu_categories_v, menu_items_v

-- Ensure extensions for UUID utilities
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Tables
create table if not exists public.menu_sections (
  id uuid primary key default uuid_generate_v4(),
  menu_id uuid not null references public.restaurant_menus(id) on delete cascade,
  name text not null,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_menu_sections_menu_order on public.menu_sections(menu_id, display_order);

create table if not exists public.items (
  id uuid primary key default uuid_generate_v4(),
  tenant_id text,
  base_name text not null,
  base_desc text default '',
  base_price numeric(10,2),
  sku text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_items_tenant on public.items(tenant_id);

create table if not exists public.menu_section_items (
  id uuid primary key default uuid_generate_v4(),
  menu_section_id uuid not null references public.menu_sections(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  position integer default 0,
  name_override text,
  desc_override text,
  price_override numeric(10,2),
  is_available boolean default true,
  start_time time,
  end_time time,
  day_mask int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_msi_section_position on public.menu_section_items(menu_section_id, position);

-- Backfill: categories -> sections
-- Create a section per existing category if not already mapped
-- Temporary mapping table
create table if not exists public._legacy_category_to_section (
  category_id uuid primary key,
  section_id uuid not null
);

-- Insert sections for any legacy categories without mapping
insert into public.menu_sections (id, menu_id, name, display_order)
select gen_random_uuid(), mc.menu_id, mc.name, coalesce(mc.display_order, 0)
from public.menu_categories mc
left join public._legacy_category_to_section map on map.category_id = mc.id
where map.category_id is null
on conflict do nothing;

-- Populate mapping table for all categories
insert into public._legacy_category_to_section (category_id, section_id)
select mc.id as category_id,
       ms.id as section_id
from public.menu_categories mc
join public.menu_sections ms
  on ms.menu_id = mc.menu_id and ms.name = mc.name
on conflict (category_id) do nothing;

-- Backfill: legacy menu_items -> base items and section items
-- Create base items if not existing (by name/price for now). In future, use canonicalization by tenant.
with legacy as (
  select mi.id as legacy_item_id,
         mi.name,
         coalesce(mi.description, '') as description,
         mi.price::numeric(10,2) as price,
         mc.id as category_id,
         map.section_id,
         mc.menu_id,
         rm.tenant_id
  from public.menu_items mi
  join public.menu_categories mc on mc.id = mi.category_id
  join public.restaurant_menus rm on rm.id = mc.menu_id
  join public._legacy_category_to_section map on map.category_id = mc.id
)
insert into public.items (tenant_id, base_name, base_desc, base_price)
select l.tenant_id, l.name, l.description, l.price
from legacy l
left join public.items i
  on i.tenant_id is not distinct from l.tenant_id
 and i.base_name = l.name
 and coalesce(i.base_price, 0) = coalesce(l.price, 0)
where i.id is null
on conflict do nothing;

-- Link section items
insert into public.menu_section_items (menu_section_id, item_id, position, name_override, desc_override, price_override)
select l.section_id,
       i.id,
       0 as position,
       null as name_override,
       null as desc_override,
       null as price_override
from (
  select mi.id as legacy_item_id,
         mi.name,
         mi.price::numeric(10,2) as price,
         map.section_id,
         rm.tenant_id
  from public.menu_items mi
  join public.menu_categories mc on mc.id = mi.category_id
  join public.restaurant_menus rm on rm.id = mc.menu_id
  join public._legacy_category_to_section map on map.category_id = mc.id
) l
join public.items i
  on i.tenant_id is not distinct from l.tenant_id
 and i.base_name = l.name
 and coalesce(i.base_price, 0) = coalesce(l.price, 0)
left join public.menu_section_items msi on msi.menu_section_id = l.section_id and msi.item_id = i.id
where msi.id is null
on conflict do nothing;

-- Back-compat views
create or replace view public.menu_categories_v as
select 
  ms.id,
  ms.menu_id,
  ms.name,
  ms.display_order,
  ms.created_at,
  ms.updated_at
from public.menu_sections ms;

create or replace view public.menu_items_v as
select 
  msi.id,
  -- Expose legacy foreign key shape via category_id mapping
  map.category_id as category_id,
  msi.menu_section_id as section_id,
  coalesce(msi.name_override, i.base_name) as name,
  coalesce(msi.desc_override, i.base_desc) as description,
  coalesce(msi.price_override, i.base_price) as price,
  true as is_active,
  msi.position as display_order,
  null::text as image_url,
  msi.created_at,
  msi.updated_at
from public.menu_section_items msi
join public.items i on i.id = msi.item_id
join public._legacy_category_to_section map on map.section_id = msi.menu_section_id;

-- RLS starter (reads public like legacy), writes can be constrained later
alter table public.menu_sections enable row level security;
alter table public.menu_section_items enable row level security;
alter table public.items enable row level security;

create policy if not exists menu_sections_public_read on public.menu_sections for select using (true);
create policy if not exists menu_section_items_public_read on public.menu_section_items for select using (true);
create policy if not exists items_public_read on public.items for select using (true);

-- Success marker
select 'Phase 2 complete: sections/items created, backfilled, and views ready' as status;


