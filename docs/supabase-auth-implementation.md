# Supabase Auth + Multi-tenant RLS Implementation

Purpose: Add secure, role-based authentication and authorization for a multi-tenant restaurant ordering platform. Integrate with onboarding so each new restaurant has an owner account; you (admin) retain access to all restaurants.

## Objectives

- Email magic-link auth for owners and staff; public browsing for customers
- Roles: `admin` (you), `owner`, `staff`, `customer`
- Strict RLS across `restaurants`, `restaurant_menus`, `menu_categories`, `menu_items`, and management endpoints
- Onboarding creates the restaurant + grants `owner` role to the onboarding user
- Background imports continue to work via Service Role (bypasses RLS)

## Data Model

Tables/columns to add:

1) `user_restaurant_roles` (link table)
```
user_id uuid not null references auth.users(id)
restaurant_id uuid not null references public.restaurants(id)
role text not null check (role in ('owner','staff','admin'))
unique (user_id, restaurant_id, role)
```

2) `restaurants`
- Add `owner_user_id uuid` (nullable during legacy backfill)

3) Optional `profiles` for UX
```
user_id uuid primary key references auth.users(id)
display_name text
```

## RLS Policies (high level)

Enable RLS on restaurant + menu tables. Example patterns below; adjust for your schema.

### Helper: current roles and memberships
```
-- Return whether the current auth user has role X for a given restaurant
create or replace function public.has_role(r_id uuid, role text)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_restaurant_roles urr
    where urr.user_id = auth.uid()
      and urr.restaurant_id = r_id
      and urr.role = role
  )
$$;

-- Is platform admin? (role recorded per any restaurant or global row)
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_restaurant_roles urr
    where urr.user_id = auth.uid() and urr.role = 'admin'
  )
$$;
```

### Restaurants
```
alter table public.restaurants enable row level security;

-- Read: public may read minimal fields for browsing; owners/staff/admin read all
create policy restaurants_select_public on public.restaurants
for select using (true);

-- Update: owner or admin only
create policy restaurants_update_owner on public.restaurants
for update using (
  is_admin() or has_role(id,'owner')
);

-- Insert: service role only (onboarding / back office) or admin
-- (skip policy; use service key or create explicit policy for admin)
```

### Menus and Items
```
alter table public.restaurant_menus enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;

-- Public read for customer browsing
create policy menus_public_read on public.restaurant_menus for select using (true);
create policy cats_public_read  on public.menu_categories  for select using (true);
create policy items_public_read on public.menu_items       for select using (true);

-- Write policies (owner/staff/admin for their restaurant)
create policy menus_write_owner on public.restaurant_menus
for all using (
  is_admin() or has_role(restaurant_id,'owner') or has_role(restaurant_id,'staff')
) with check (
  is_admin() or has_role(restaurant_id,'owner') or has_role(restaurant_id,'staff')
);

create policy cats_write_owner on public.menu_categories
for all using (
  is_admin() or has_role((select restaurant_id from public.restaurant_menus rm where rm.id = menu_categories.menu_id),'owner')
   or has_role((select restaurant_id from public.restaurant_menus rm where rm.id = menu_categories.menu_id),'staff')
)
with check (
  is_admin() or has_role((select restaurant_id from public.restaurant_menus rm where rm.id = menu_categories.menu_id),'owner')
   or has_role((select restaurant_id from public.restaurant_menus rm where rm.id = menu_categories.menu_id),'staff')
);

create policy items_write_owner on public.menu_items
for all using (
  is_admin() or has_role(restaurant_id,'owner') or has_role(restaurant_id,'staff')
)
with check (
  is_admin() or has_role(restaurant_id,'owner') or has_role(restaurant_id,'staff')
);
```

Notes:
- Background imports run with the Service Role key and bypass RLS (keep using `supabaseAdmin`).
- If you prefer, add a dedicated `importer` role/policy later.

## JWT Claims (optional enhancement)

To avoid frequent role lookups, add a trigger that refreshes JWT custom claims on login (not mandatory at first). For now, `has_role()` is sufficient.

## Onboarding Integration

1) Require auth for onboarding (email magic link). If user is not logged in, prompt for email → Supabase sends link → user returns with session.

2) On POST `/api/restaurants/onboard`:
   - Use session client (not admin) for creation? Prefer admin for reliability, then immediately grant roles.
   - Insert restaurant with `owner_user_id = authUserId`.
   - Insert `user_restaurant_roles(user_id=authUserId, restaurant_id, role='owner')`.
   - Continue menu import (service role) as today.

3) Dashboard/menu management pages check role via `/api/me` or session and show controls accordingly.

## Frontend Auth UX

- Add Login/Logout and SessionProvider. Use Supabase JS with magic link:
```
await supabase.auth.signInWithOtp({ email });
```
Optionally set redirect to `/restaurant/{id}/dashboard` after onboarding.

- Navigation: when logged in, show “Dashboard” + restaurant switcher for owner/admin users.

## Admin Access (You)

- Seed your user as `admin` in `user_restaurant_roles` (single row without restaurant_id OR replicate across all restaurants). Simplest: insert per restaurant; scalable: store a row with `restaurant_id = null` and update `is_admin()` to consider null rows.

## Migration Plan (SQL Outline)

```
-- 1) link table
create table if not exists public.user_restaurant_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  role text not null check (role in ('owner','staff','admin')),
  created_at timestamptz default now(),
  primary key (user_id, restaurant_id, role)
);

-- 2) owner column
alter table public.restaurants add column if not exists owner_user_id uuid;

-- 3) helper functions (has_role, is_admin) as above

-- 4) enable RLS + policies on restaurants, restaurant_menus, menu_categories, menu_items

-- 5) seed admin (replace <ADMIN_USER_ID>)
insert into public.user_restaurant_roles(user_id, restaurant_id, role)
select '<ADMIN_USER_ID>', id, 'admin' from public.restaurants
on conflict do nothing;
```

## API Adjustments

- Use `supabaseAdmin` for controlled writes (onboarding, imports, image uploads). For owner/staff writes from the dashboard, use the user session client so RLS applies.
- Add `/api/me` to return session user and roles for the current restaurant.

## Testing Checklist

- Anonymous
  - Can fetch `GET /api/restaurants/:id` and `GET /api/restaurants/:id/menu`
  - Cannot write menu items
- Owner
  - Can update their restaurant, add/edit categories/items
  - Cannot modify other restaurants
- Admin (you)
  - Full access across restaurants
- Background import
  - Inserts succeed (Service Role)

## Rollout Plan

1) Migrations and policies in Supabase (run via MCP)
2) Add minimal login/logout UI + session provider
3) Gate dashboard write routes behind session; keep customer read open
4) Switch onboarding to require auth → grant owner
5) Seed admin
6) Verify with a fresh onboarding run

## Open Questions / Future

- Staff invitations (email magic links) with `staff` role
- Global admin row with `restaurant_id is null` (and adjust `is_admin()`)
- Organization/team model if needed beyond `owner/staff`


