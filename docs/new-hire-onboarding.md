## Menuca Rebuild — New Hire Onboarding

Audience: Engineers joining Menuca. Duration: 60 minutes to get oriented; 1 week to become productive.

### 0) Access you’ll need
- **GitHub**: read/write on `menuca-rebuild`.
- **Vercel**: access to project dashboards and env vars.
- **Supabase**: access to the project (read/write) and SQL editor.
- **Stripe (test mode)**: dashboard access to verify Checkout sessions and webhook events.

Request access from the owner before your first day. Secrets are stored in Vercel and Supabase; never commit secrets to the repo.

### 1) 60‑minute walkthrough agenda
- **5 min — Product tour (production)**
  - Open production: `https://menuca-rebuild-pro.vercel.app/`
  - Run through Menu → Cart → Delivery → Payment → Confirm.
- **10 min — Architecture overview**
  - Next.js App Router in `app/` and legacy API routes in `pages/api/`.
  - Supabase for auth/storage/db; Stripe for payments; Vercel for hosting.
- **15 min — Codebase map (guided)**
  - `app/menu/[id]/page.tsx`, `app/checkout/page.tsx`, `app/admin/page.tsx`.
  - API endpoints in `pages/api/*` (e.g., stripe, addresses, imports).
  - Libraries in `lib/` (scrapers, Supabase clients, parsers, utils).
  - SQL in `sql/` and docs in `docs/`.
- **10 min — Data model & flows**
  - Restaurant/menu structure; cart and delivery persistence; RLS basics.
  - Stripe Checkout metadata: `{restaurant_id, items_count, delivery_*}`.
- **10 min — Deploy & environments**
  - Vercel environments (Production/Preview/Development), `vercel.json`.
  - Env vars managed in Vercel; DB in Supabase.
- **10 min — Agentic workflow demo**
  - Show how we use Cursor/AI to create todos, search code, and implement small, safe edits with quick tests.
  - Emphasize honesty about tool capabilities and limits; avoid claiming access we don’t have.

### 2) Quick reference: where things live
- **Production app**: `https://menuca-rebuild-pro.vercel.app/`
- **Routing (Next.js App Router)**: `app/`
  - `app/page.tsx`: Home
  - `app/menu/[id]/page.tsx`: Menu by restaurant id
  - `app/checkout/page.tsx`: Checkout
  - `app/orders/page.tsx`: Orders
  - `app/admin/page.tsx`: Admin UI
- **API routes (Node, serverful)**: `pages/api/*`
  - Stripe: `pages/api/stripe/*`
  - Addresses: `pages/api/addresses/*`
  - Business settings and utilities: see `config/api-map.ts` and `app/api/*`
- **Libraries**: `lib/`
  - Supabase clients: `lib/supabase.ts`, `lib/supabaseAdmin.ts`
  - Menu parsing/scraping: `lib/universal-menu-parser.ts`, `lib/scrapers.ts`
  - Utility helpers: `lib/utils.ts`, `lib/tablet-client.ts`
- **Scripts**: `scripts/`
  - Importers and scrapers: `legacy-platform-scraper.js`, `import-modifiers.js`
  - Debug/verification: `verify-menu-migration-counts.js`, `verify-dashboard-sticky.js`
- **SQL & schema**: `sql/`
  - Core schema: `complete-menuca-schema.sql`, `enterprise-ready-schema.sql`
  - Policies/RLS and migrations: `phase0_*`, `phase1_*`, `phase2_*`
  - Patterns: `SUPABASE_SCHEMA_PATTERNS.md`
- **Docs**: `docs/`
  - Auth: `supabase-auth-implementation.md`
  - Onboarding (this doc): `docs/new-hire-onboarding.md`

### 3) Local development
- Node LTS, pnpm or npm
- Install: `npm install`
- Run: `npm run dev`
- Env vars: mirror from Vercel Environment → Development. Do not hardcode.
- Test the flow locally using the same routes as production.

### 4) Data, Auth, and Payments
- **Supabase**
  - Use the dashboard for SQL, tables, and policies.
  - Review RLS patterns in `SUPABASE_SCHEMA_PATTERNS.md` and `sql/phase*` files.
- **Stripe**
  - Checkout session creation in API routes; metadata includes restaurant and delivery context.
  - Webhooks forward orders to our tablet system; verify events in Stripe dashboard.

### 5) Agentic coding workflow (how we work)
- Write down a clear task → create a tiny TODO list.
- Use semantic search and small edits. Prefer surgical changes in the right file.
- Test in development and verify via the production domain when safe.
- Keep changes minimal, readable, and reversible. Avoid large refactors in first pass.
- Never bypass delivery capture or insert placeholder data in production.

### 6) 5‑minute demo script (for stakeholders)
1) Open production domain and show real restaurant menu.
2) Add items to cart, proceed to Checkout, complete delivery form.
3) Trigger Stripe Checkout (test mode), show metadata in Stripe.
4) Show order forwarding to tablet (logs/confirmation).
5) Show how a small UI or copy change ships via Vercel.

### 7) First‑week checklist
- [ ] Access to GitHub, Vercel, Supabase, Stripe (test)
- [ ] Run app locally; load `/menu/{restaurantId}` and `/checkout`
- [ ] Read `docs/supabase-auth-implementation.md` and skim `sql/` schema
- [ ] Make a tiny change: copy tweak or minor UI polish; open PR
- [ ] Explore `lib/universal-menu-parser.ts`; run a debug script in `scripts/`
- [ ] Trace the Checkout flow end-to-end, confirm Stripe metadata
- [ ] Pair on one small bug/feature; deploy to Preview, then Production
 - [ ] Review production domain and do not use placeholder data; follow delivery-capture flow.

### 8) Support & conventions
- Prefer clarity over cleverness; descriptive names and small functions.
- Add concise docs when you introduce a new pattern.
- Use Vercel and Supabase dashboards for environment and DB changes; avoid leaking secrets to code.

If anything is unclear, add a note to this doc during onboarding so we continuously improve it.


