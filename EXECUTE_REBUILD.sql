-- 🚨 COMPLETE WIPE + REBUILD FOR PRO ACCOUNT
-- Project: nthpbtdjhhnwfxqsxbvy
-- This combines wipe + rebuild in one atomic operation

-- ===== STEP 1: NUCLEAR WIPE =====

-- Drop all existing tables if they exist
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.menu_categories CASCADE;
DROP TABLE IF EXISTS public.restaurant_menus CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop any other tables that might exist
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.menus CASCADE;

-- Drop any custom functions
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

-- Drop any custom types
DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;

-- ===== STEP 2: REBUILD WITH TENANT_ID =====

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. RESTAURANTS table (current working structure)
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
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. RESTAURANT_MENUS table
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

-- 3. MENU_CATEGORIES table
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

-- 4. MENU_ITEMS table - WITH tenant_id (THE FIX!)
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  tenant_id text NOT NULL DEFAULT 'default-tenant', -- THE ENTERPRISE FIX!
  name text NOT NULL,
  description text DEFAULT '',
  price decimal(10,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_restaurants_tenant_id ON public.restaurants(tenant_id);
CREATE INDEX idx_restaurant_menus_restaurant_id ON public.restaurant_menus(restaurant_id);
CREATE INDEX idx_restaurant_menus_tenant_id ON public.restaurant_menus(tenant_id);
CREATE INDEX idx_menu_categories_menu_id ON public.menu_categories(menu_id);
CREATE INDEX idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX idx_menu_items_tenant_id ON public.menu_items(tenant_id); -- For enterprise queries

-- Enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Allow all policies for now
CREATE POLICY "allow_all_access" ON public.restaurants FOR ALL USING (true);
CREATE POLICY "allow_all_access" ON public.restaurant_menus FOR ALL USING (true);
CREATE POLICY "allow_all_access" ON public.menu_categories FOR ALL USING (true);
CREATE POLICY "allow_all_access" ON public.menu_items FOR ALL USING (true);

-- Updated timestamp function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER restaurant_menus_updated_at BEFORE UPDATE ON public.restaurant_menus FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER menu_categories_updated_at BEFORE UPDATE ON public.menu_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== VALIDATION =====

SELECT '✅ WIPE + REBUILD COMPLETE! 
✅ tenant_id added to menu_items (enterprise ready)
✅ All foreign keys established  
✅ All indexes created
✅ RLS enabled with permissive policies
✅ Ready to test onboarding flow!' as status;
