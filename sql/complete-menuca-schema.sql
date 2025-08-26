-- ✅ Complete MenuCA Database Schema
-- This creates ALL tables needed for the MenuCA system
-- Project: nthpbtdjhhnwfxqsxbvy (PRO account)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Restaurants table (main entity)
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Restaurant Menus table
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

-- 3. Menu Categories table
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

-- 4. Menu Items table (the critical one that was failing)
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

-- 5. Performance indexes
CREATE INDEX idx_restaurants_tenant_id ON public.restaurants(tenant_id);
CREATE INDEX idx_restaurant_menus_restaurant_id ON public.restaurant_menus(restaurant_id);
CREATE INDEX idx_restaurant_menus_tenant_id ON public.restaurant_menus(tenant_id);
CREATE INDEX idx_menu_categories_menu_id ON public.menu_categories(menu_id);
CREATE INDEX idx_menu_items_category_id ON public.menu_items(category_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- 7. Basic RLS policies (allow all for now - can be restricted later)
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

SELECT 'Complete MenuCA schema created successfully' as status;
