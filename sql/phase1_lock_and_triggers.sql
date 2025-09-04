-- Phase 1b — Safely lock tenant_id to NOT NULL with autofill triggers (idempotent)

-- Defaults to prevent null inserts from legacy code paths
alter table if exists public.restaurants alter column tenant_id set default 'default-tenant';
alter table if exists public.restaurant_menus alter column tenant_id set default 'default-tenant';
alter table if exists public.menu_items alter column tenant_id set default 'default-tenant';

-- Trigger: when inserting a restaurant_menu, inherit tenant from restaurant if missing
create or replace function public.set_menu_tenant_from_restaurant()
returns trigger language plpgsql as $$
begin
  if new.tenant_id is null then
    select r.tenant_id into new.tenant_id from public.restaurants r where r.id = new.restaurant_id;
    if new.tenant_id is null then
      new.tenant_id := 'default-tenant';
    end if;
  end if;
  return new;
end; $$;

do $$ begin
  if exists (select 1 from pg_trigger where tgname = 'set_menu_tenant_from_restaurant_trg') then
    execute 'drop trigger set_menu_tenant_from_restaurant_trg on public.restaurant_menus';
  end if;
end $$;

create trigger set_menu_tenant_from_restaurant_trg
before insert on public.restaurant_menus
for each row execute function public.set_menu_tenant_from_restaurant();

-- Trigger: when inserting a menu_item, inherit tenant from its menu via category if missing
create or replace function public.set_item_tenant_from_category()
returns trigger language plpgsql as $$
declare v_tenant text;
begin
  if new.tenant_id is null then
    select rm.tenant_id into v_tenant
    from public.menu_categories mc
    join public.restaurant_menus rm on rm.id = mc.menu_id
    where mc.id = new.category_id;
    new.tenant_id := coalesce(v_tenant, 'default-tenant');
  end if;
  return new;
end; $$;

do $$ begin
  if exists (select 1 from pg_trigger where tgname = 'set_item_tenant_from_category_trg') then
    execute 'drop trigger set_item_tenant_from_category_trg on public.menu_items';
  end if;
end $$;

create trigger set_item_tenant_from_category_trg
before insert on public.menu_items
for each row execute function public.set_item_tenant_from_category();

-- After backfill (Phase 1) and with triggers in place, lock columns
alter table if exists public.restaurants alter column tenant_id set not null;
alter table if exists public.restaurant_menus alter column tenant_id set not null;
alter table if exists public.menu_items alter column tenant_id set not null;

select 'Phase 1b complete: tenant_id locked NOT NULL with safe triggers' as status;


