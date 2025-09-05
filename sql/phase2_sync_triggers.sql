-- Phase 2 – live sync triggers from legacy tables to new tables (idempotent)

create or replace function public._ensure_item_and_link(p_category_id uuid, p_item_name text, p_item_desc text, p_item_price numeric)
returns void language plpgsql as $$
declare v_section_id uuid; v_tenant text; v_item_id uuid;
begin
  -- map category -> section
  select map.section_id into v_section_id from public._legacy_category_to_section map where map.category_id = p_category_id;
  if v_section_id is null then
    -- create section from category now
    insert into public.menu_sections (menu_id, name, display_order)
    select mc.menu_id, mc.name, coalesce(mc.display_order,0)
    from public.menu_categories mc
    where mc.id = p_category_id
    returning id into v_section_id;
    insert into public._legacy_category_to_section(category_id, section_id)
    values(p_category_id, v_section_id)
    on conflict (category_id) do update set section_id = excluded.section_id;
  end if;

  -- tenant from menu
  select rm.tenant_id into v_tenant
  from public.menu_categories mc
  join public.restaurant_menus rm on rm.id = mc.menu_id
  where mc.id = p_category_id;

  -- ensure base item exists
  select i.id into v_item_id from public.items i
  where (i.tenant_id is not distinct from v_tenant)
    and i.base_name = p_item_name
    and coalesce(i.base_price,0) = coalesce(p_item_price,0)
  limit 1;
  if v_item_id is null then
    insert into public.items(tenant_id, base_name, base_desc, base_price)
    values (v_tenant, p_item_name, coalesce(p_item_desc,''), p_item_price)
    returning id into v_item_id;
  end if;

  -- link into section if missing
  insert into public.menu_section_items(menu_section_id, item_id, position)
  select v_section_id, v_item_id, 0
  where not exists (
    select 1 from public.menu_section_items msi where msi.menu_section_id = v_section_id and msi.item_id = v_item_id
  );
end;$$;

-- After INSERT on menu_categories: create section + mapping if missing
create or replace function public._on_menu_categories_ai()
returns trigger language plpgsql as $$
begin
  insert into public.menu_sections(menu_id, name, display_order)
  values (new.menu_id, new.name, coalesce(new.display_order,0))
  returning id into new.id; -- not used
  insert into public._legacy_category_to_section(category_id, section_id)
  select new.id, ms.id from public.menu_sections ms
  where ms.menu_id = new.menu_id and ms.name = new.name
  on conflict (category_id) do nothing;
  return new;
end;$$;

do $$ begin
  if exists (select 1 from pg_trigger where tgname = 'trg_menu_categories_ai') then
    execute 'drop trigger trg_menu_categories_ai on public.menu_categories';
  end if;
end $$;

create trigger trg_menu_categories_ai
after insert on public.menu_categories
for each row execute function public._on_menu_categories_ai();

-- After INSERT on menu_items: ensure base item + link
create or replace function public._on_menu_items_ai()
returns trigger language plpgsql as $$
begin
  perform public._ensure_item_and_link(new.category_id, new.name, coalesce(new.description,''), new.price::numeric);
  return new;
end;$$;

do $$ begin
  if exists (select 1 from pg_trigger where tgname = 'trg_menu_items_ai') then
    execute 'drop trigger trg_menu_items_ai on public.menu_items';
  end if;
end $$;

create trigger trg_menu_items_ai
after insert on public.menu_items
for each row execute function public._on_menu_items_ai();

-- Success marker
select 'Phase 2 sync triggers installed' as status;


