# MenuCA Multi‑Tenant Menu Schema Migration Spec (Non‑Breaking)

Status: draft/ready to execute
Owner: Platform
Last updated: 2025-09-04

Goals
- Preserve working onboarding/import/ordering during rollout
- Add true tenant scoping + RLS
- Normalize menus to sections + per‑menu overrides
- Add modifiers/options, tags, publishing, outages, soft delete

Non‑Goals
- Replacing Stripe/Canada Post
- Major UI redesign (beyond required fields)

Phase 0 — Housekeeping (no UX change)
1) user_preferences
   - user_id uuid PK references auth.users(id)
   - last_restaurant_id uuid
   - prefs jsonb default '{}'::jsonb
   - updated_at timestamptz default now()
   - RLS: enable; select/update where user_id = auth.uid()
   - App: AuthInit reads first; onboarding/login upserts

2) RLS helpers (if missing)
   - has_role(r_id uuid, role text) returns boolean
   - is_admin() returns boolean

Phase 1 — Tenant Scoping (backwards‑compatible)
Tables: restaurants, restaurant_menus, menu_categories, menu_items, images/assets, tags
1) Add tenant_id (nullable) → backfill → set NOT NULL
2) Index/constraints
   - Tenant‑scoped uniques (e.g., UNIQUE(tenant_id, restaurant_id, name))
   - FK indexes on tenant_id/restaurant_id
3) RLS starter policies
   - Reads as today for public menus; writes via service role (later owners)

Optional 1b — Lock tenant_id to NOT NULL (safe)
- Add autofill triggers so inserts inherit tenant_id from parent
- Then set NOT NULL on restaurants/menus/items

Phase 2 — Sections + Per‑Menu Overrides (no breaking changes)
New tables
- menu_sections(id, menu_id, name, display_order, created_at/updated_at)
  - Index: (menu_id, display_order)
- items(id, tenant_id, base_name, base_desc, base_price, sku, created_at/updated_at)
- menu_section_items(
  id, menu_section_id, item_id, position,
  name_override, desc_override, price_override,
  is_available default true,
  start_time, end_time, day_mask,
  created_at/updated_at
)
  - Index: (menu_section_id, position)

Backfill (idempotent)
1) For each menu_category → create menu_section (copy name/display_order)
2) For each legacy menu_item → ensure base item in items; insert menu_section_items
   with position from legacy display_order and overrides (name/desc/price)

Back‑compat views (keep UI/API working)
- VIEW menu_categories_v AS SELECT … FROM menu_sections
- VIEW menu_items_v AS SELECT join(menu_section_items→items) with COALESCE(overrides, base) exposing legacy columns
- Flip read paths to use views first

Phase 3 — Modifiers/Options and Tags (additive)
Modifiers
- modifier_groups(tenant_id, name, min_choices, max_choices, required, display_order)
- modifier_options(modifier_group_id, name, price_delta, display_order)
- item_modifier_groups(item_id, modifier_group_id, display_order, UNIQUE(item_id, modifier_group_id))

Tags
- tags(tenant_id, name, type)
- item_tags(item_id, tag_id, UNIQUE(item_id, tag_id))

Phase 4 — Publishing, Outages, Soft Delete, Audit
- menus: status(draft/live/archived), published_at, effective_from/to
- item_outages(restaurant_id, item_id, until)
- deleted_at, created_by, updated_by on content tables
- Queries filter draft/archived/deleted by default

Phase 5 — API/UI Cutover (small, reversible PRs)
Read
- Move from views to new tables after parity verified

Write
- Create category → menu_sections
- Add item to category → menu_section_items (overrides; do not mutate base)
- Price edits → price_override or base edit for global change
- Onboarding importer → create sections; ensure base items; insert menu_section_items

Phase 6 — Cleanup
- Retire legacy writes; keep views as shims; drop legacy columns later

RLS (starter examples)
- menu_sections/menu_section_items
  - Read: public if parent menu live; else owner/staff/admin
  - Write: is_admin() OR has_role(menu.restaurant_id,'owner'|'staff')
- items/modifier_*/tags
  - Read: public; Write: admin or tenant owner/staff
- user_preferences
  - select/update where user_id = auth.uid()

Operational Plan
1) Create tables → backfill → indexes → set constraints → enable RLS → create views
2) Flip reads to views (feature flag) → migrate writes incrementally → retire legacy
3) Idempotent migrations; no downtime

Importer Changes (behind flag)
- Try direct HTML fast‑path → fallback to Firecrawl
- Create sections; upsert base items; insert menu_section_items with overrides

Testing & Monitoring
- Data counts per menu match before/after (sections/items)
- E2E: onboarding/preview/import/claim/login/dashboard edits/order
- Perf indexes in place as above
- Log to menu_imports.logs on failures

Risks & Mitigations
- Duplicate base items → normalize by tenant + canonicalization; de‑dup later
- RLS lockouts → test with service role + owner user prior to flip
- POS/86ing later → item_outages planned

Rollout Sequence to Start With
1) Phase 0: user_preferences + RLS helpers
2) Phase 2: create menu_sections/menu_section_items; backfill; create views; point read APIs to views (no UI change)
3) Phase 1: tenant_id backfill + constraints + starter RLS (reads unchanged)
4) Phase 3/4/5 in small PRs, feature‑flagged

Execution Steps (Supabase dashboard)
1) Run sql/phase0_user_prefs_and_rls.sql
2) Run sql/phase2_sections_items_views.sql
3) Run sql/phase1_tenant_scoping.sql
4) (Optional) Run sql/phase1_lock_and_triggers.sql to enforce NOT NULL
4) Verify counts with verification script, then test prod reads



