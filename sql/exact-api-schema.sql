-- ✅ EXACT MenuCA Schema - Based on API Code Analysis
-- This creates the EXACT tables and columns used by the 67 API endpoints
-- Project: nthpbtdjhhnwfxqsxbvy (PRO account)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. RESTAURANTS table (from pages/api/restaurants/onboard.ts)
CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id text NOT NULL DEFAULT 'default-tenant',
  owner_id text,
  name text NOT NULL,
  description text,
  cuisine_type text,
  phone text,
  email text,
  website text,
  status text DEFAULT 'active',
  featured boolean DEFAULT false,
  address text,  -- Added from [id]/index.ts line 50-52
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. RESTAURANT_MENUS table (from pages/api/admin/import-legacy-menu.ts lines 125-135)
CREATE TABLE public.restaurant_menus (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  tenant_id text NOT NULL DEFAULT 'default-tenant',
  name text NOT NULL DEFAULT 'Main Menu',
  description text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. MENU_CATEGORIES table (from pages/api/admin/import-legacy-menu.ts lines 159-168)
CREATE TABLE public.menu_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id uuid NOT NULL REFERENCES public.restaurant_menus(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. MENU_ITEMS table (from pages/api/admin/import-legacy-menu.ts lines 206-208)
-- CRITICAL: NO tenant_id column! (This was the bug we fixed)
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price decimal(10,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Performance indexes (based on query patterns in API code)
CREATE INDEX idx_restaurants_tenant_id ON public.restaurants(tenant_id);
CREATE INDEX idx_restaurant_menus_restaurant_id ON public.restaurant_menus(restaurant_id);
CREATE INDEX idx_restaurant_menus_tenant_id ON public.restaurant_menus(tenant_id);
CREATE INDEX idx_menu_categories_menu_id ON public.menu_categories(menu_id);
CREATE INDEX idx_menu_items_category_id ON public.menu_items(category_id);

-- 6. Enable Row Level Security (standard Supabase practice)
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- 7. Permissive RLS policies for development (allow all for now)
CREATE POLICY "Allow all access" ON public.restaurants FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.restaurant_menus FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.menu_categories FOR ALL USING (true);
CREATE POLICY "Allow all access" ON public.menu_items FOR ALL USING (true);

-- 8. Updated timestamp function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Updated timestamp triggers
CREATE TRIGGER restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER restaurant_menus_updated_at
  BEFORE UPDATE ON public.restaurant_menus
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER menu_categories_updated_at
  BEFORE UPDATE ON public.menu_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

SELECT 'EXACT API-based MenuCA schema created successfully - Ready for 67 endpoints!' as status;
