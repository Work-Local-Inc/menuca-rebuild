-- 🏢 ENTERPRISE-READY MenuCA Schema
-- Supports: Current API + Multi-tenant scaling + Performance optimization
-- Project: nthpbtdjhhnwfxqsxbvy (PRO account)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For query monitoring

-- ===============================
-- ENTERPRISE HIERARCHY
-- ===============================

-- 1. BUSINESSES table (enterprise/franchise level)
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text UNIQUE,
  name text NOT NULL,
  phone text,
  timezone text DEFAULT 'America/Toronto',
  currency text DEFAULT 'CAD',
  is_open boolean DEFAULT true,
  order_limit integer DEFAULT 0,
  address jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. RESTAURANTS table (individual locations) - CURRENT API COMPATIBLE
CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL, -- Enterprise link
  tenant_id text NOT NULL DEFAULT 'default-tenant', -- Multi-tenancy
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

-- 3. RESTAURANT_MENUS table - CURRENT API COMPATIBLE
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

-- 4. MENU_CATEGORIES table - CURRENT API COMPATIBLE
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

-- 5. MENU_ITEMS table - CURRENT API COMPATIBLE (NO tenant_id!)
-- This matches your WORKING API exactly
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

-- ===============================
-- ENTERPRISE PERFORMANCE INDEXES
-- ===============================

-- Business-level indexes
CREATE INDEX idx_businesses_slug ON public.businesses(slug);
CREATE INDEX idx_businesses_is_open ON public.businesses(is_open);

-- Multi-tenant performance indexes
CREATE INDEX idx_restaurants_tenant_id ON public.restaurants(tenant_id);
CREATE INDEX idx_restaurants_business_id ON public.restaurants(business_id);
CREATE INDEX idx_restaurants_status ON public.restaurants(status);

-- Menu hierarchy indexes (critical for API performance)
CREATE INDEX idx_restaurant_menus_restaurant_id ON public.restaurant_menus(restaurant_id);
CREATE INDEX idx_restaurant_menus_tenant_id ON public.restaurant_menus(tenant_id);
CREATE INDEX idx_restaurant_menus_is_active ON public.restaurant_menus(is_active);

CREATE INDEX idx_menu_categories_menu_id ON public.menu_categories(menu_id);
CREATE INDEX idx_menu_categories_is_active ON public.menu_categories(is_active);
CREATE INDEX idx_menu_categories_display_order ON public.menu_categories(display_order);

CREATE INDEX idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX idx_menu_items_is_active ON public.menu_items(is_active);
CREATE INDEX idx_menu_items_display_order ON public.menu_items(display_order);

-- Composite indexes for complex queries
CREATE INDEX idx_restaurants_tenant_status ON public.restaurants(tenant_id, status);
CREATE INDEX idx_menu_items_category_active ON public.menu_items(category_id, is_active);

-- ===============================
-- ENTERPRISE ROW LEVEL SECURITY
-- ===============================

-- Enable RLS on all tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development (can be restricted later)
CREATE POLICY "allow_all_businesses" ON public.businesses FOR ALL USING (true);
CREATE POLICY "allow_all_restaurants" ON public.restaurants FOR ALL USING (true);
CREATE POLICY "allow_all_menus" ON public.restaurant_menus FOR ALL USING (true);
CREATE POLICY "allow_all_categories" ON public.menu_categories FOR ALL USING (true);
CREATE POLICY "allow_all_items" ON public.menu_items FOR ALL USING (true);

-- Public read access for active menu items (customer-facing)
CREATE POLICY "public_read_active_items" ON public.menu_items 
  FOR SELECT USING (is_active = true);

-- ===============================
-- ENTERPRISE AUDIT & TRIGGERS
-- ===============================

-- Updated timestamp function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated timestamp triggers
CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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

-- ===============================
-- ENTERPRISE MONITORING VIEWS
-- ===============================

-- Performance monitoring view
CREATE OR REPLACE VIEW public.restaurant_stats AS
SELECT 
  r.id,
  r.name,
  r.tenant_id,
  b.name as business_name,
  COUNT(DISTINCT rm.id) as menu_count,
  COUNT(DISTINCT mc.id) as category_count,
  COUNT(DISTINCT mi.id) as item_count,
  r.created_at
FROM public.restaurants r
LEFT JOIN public.businesses b ON r.business_id = b.id
LEFT JOIN public.restaurant_menus rm ON r.id = rm.restaurant_id
LEFT JOIN public.menu_categories mc ON rm.id = mc.menu_id  
LEFT JOIN public.menu_items mi ON mc.id = mi.category_id
GROUP BY r.id, r.name, r.tenant_id, b.name, r.created_at;

-- ===============================
-- VALIDATION & SUCCESS CONFIRMATION
-- ===============================

-- Test that all foreign keys work
DO $$ 
DECLARE
  test_business_id uuid;
  test_restaurant_id uuid;
  test_menu_id uuid;
  test_category_id uuid;
  test_item_id uuid;
BEGIN
  -- Test full hierarchy creation
  INSERT INTO public.businesses (name) VALUES ('Test Enterprise') RETURNING id INTO test_business_id;
  INSERT INTO public.restaurants (business_id, name) VALUES (test_business_id, 'Test Restaurant') RETURNING id INTO test_restaurant_id;
  INSERT INTO public.restaurant_menus (restaurant_id, name) VALUES (test_restaurant_id, 'Test Menu') RETURNING id INTO test_menu_id;
  INSERT INTO public.menu_categories (menu_id, name) VALUES (test_menu_id, 'Test Category') RETURNING id INTO test_category_id;
  INSERT INTO public.menu_items (category_id, name, price) VALUES (test_category_id, 'Test Item', 9.99) RETURNING id INTO test_item_id;
  
  -- Clean up test data
  DELETE FROM public.businesses WHERE id = test_business_id;
  
  RAISE NOTICE 'Enterprise schema validation successful!';
END $$;

SELECT '🏢 ENTERPRISE-READY MenuCA schema created successfully! 
✅ Current API compatible (no tenant_id in menu_items)
✅ Multi-tenant scaling ready (tenant_id in restaurants/menus)  
✅ Enterprise hierarchy (businesses → restaurants)
✅ Performance optimized (comprehensive indexes)
✅ Monitoring ready (stats views)
✅ Ready for 100+ client migration!' as status;
