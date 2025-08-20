-- ====================================================================
-- 🚀 ENTERPRISE SCHEMA EXTENSION - PHASE 2
-- ====================================================================
-- Migrates from simple 'businesses' table to full enterprise schema
-- with restaurants, menu_items, and orders for scalable platform
-- ====================================================================

-- 1. CREATE RESTAURANTS TABLE (Enterprise replacement for businesses)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id), -- Migration link
    slug TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    cuisine_type TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    timezone TEXT DEFAULT 'America/Toronto',
    currency TEXT DEFAULT 'CAD',
    is_open BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    order_limit INTEGER DEFAULT 0,
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    minimum_order DECIMAL(10,2) DEFAULT 0.00,
    
    -- Address information
    address JSONB,
    location POINT, -- For geographical queries
    
    -- Operating hours
    operating_hours JSONB, -- {monday: {open: "09:00", close: "22:00"}, ...}
    
    -- Branding
    logo_url TEXT,
    cover_image_url TEXT,
    
    -- Settings
    settings JSONB, -- Custom restaurant settings
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE MENU CATEGORIES TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT unique_category_per_restaurant UNIQUE(restaurant_id, name)
);

-- 3. CREATE MENU ITEMS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
    
    -- Basic item info
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2), -- For profit analysis
    
    -- Item details
    image_url TEXT,
    prep_time INTEGER DEFAULT 0, -- minutes
    calories INTEGER,
    allergens TEXT[], -- array of allergen names
    
    -- Availability
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    stock_quantity INTEGER, -- NULL = unlimited
    
    -- Categorization
    tags TEXT[], -- searchable tags
    
    -- Customization options
    customization_options JSONB, -- Available modifications
    
    -- Display
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE ORDERS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL UNIQUE, -- Human-readable order number
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    
    -- Customer information
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    
    -- Order details
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
    order_type TEXT DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup', 'dine_in')),
    
    -- Delivery information
    delivery_address JSONB,
    delivery_instructions TEXT,
    delivery_time TIMESTAMPTZ,
    
    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Payment
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_intent_id TEXT, -- Stripe payment intent ID
    
    -- Special notes
    special_instructions TEXT,
    internal_notes TEXT,
    
    -- Tablet integration
    tablet_sent_at TIMESTAMPTZ,
    tablet_accepted_at TIMESTAMPTZ,
    tablet_rejected_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CREATE ORDER ITEMS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
    
    -- Item details at time of order
    item_name TEXT NOT NULL, -- Snapshot of menu item name
    item_price DECIMAL(10,2) NOT NULL, -- Price at time of order
    quantity INTEGER NOT NULL DEFAULT 1,
    
    -- Customizations applied
    customizations JSONB, -- Applied customizations
    special_instructions TEXT,
    
    -- Line total
    line_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ENABLE ROW LEVEL SECURITY
-- ====================================================================
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 7. CREATE RLS POLICIES
-- ====================================================================

-- Restaurants policies
DO $$ BEGIN
    CREATE POLICY IF NOT EXISTS "restaurants_public_read"
    ON public.restaurants FOR SELECT
    USING (is_active = true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Menu categories policies
DO $$ BEGIN
    CREATE POLICY IF NOT EXISTS "menu_categories_public_read"
    ON public.menu_categories FOR SELECT
    USING (is_active = true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Menu items policies
DO $$ BEGIN
    CREATE POLICY IF NOT EXISTS "menu_items_public_read"
    ON public.menu_items FOR SELECT
    USING (is_available = true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Orders policies (more restrictive)
DO $$ BEGIN
    CREATE POLICY IF NOT EXISTS "orders_authenticated_access"
    ON public.orders FOR ALL
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Order items policies
DO $$ BEGIN
    CREATE POLICY IF NOT EXISTS "order_items_via_orders"
    ON public.order_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id
    ));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 8. CREATE UPDATED_AT TRIGGERS
-- ====================================================================

-- Restaurants trigger
DROP TRIGGER IF EXISTS set_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER set_restaurants_updated_at
    BEFORE UPDATE ON public.restaurants
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Menu categories trigger
DROP TRIGGER IF EXISTS set_menu_categories_updated_at ON public.menu_categories;
CREATE TRIGGER set_menu_categories_updated_at
    BEFORE UPDATE ON public.menu_categories
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Menu items trigger
DROP TRIGGER IF EXISTS set_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER set_menu_items_updated_at
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Orders trigger
DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. CREATE INDEXES FOR PERFORMANCE
-- ====================================================================

-- Restaurant indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_active ON public.restaurants(is_active) WHERE is_active = true;

-- Menu category indexes
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant ON public.menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_order ON public.menu_categories(restaurant_id, display_order);

-- Menu item indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(restaurant_id, is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON public.menu_items(restaurant_id, is_featured) WHERE is_featured = true;

-- Order indexes
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

-- Order item indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item ON public.order_items(menu_item_id);

-- 10. MIGRATION DATA FROM BUSINESSES TO RESTAURANTS
-- ====================================================================

-- Migrate existing businesses to restaurants table
INSERT INTO public.restaurants (
    business_id, slug, name, phone, timezone, currency, 
    is_open, order_limit, address, created_at, updated_at
)
SELECT 
    id as business_id,
    slug,
    name,
    phone,
    timezone,
    currency,
    is_open,
    order_limit,
    address,
    created_at,
    updated_at
FROM public.businesses
ON CONFLICT (business_id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    timezone = EXCLUDED.timezone,
    currency = EXCLUDED.currency,
    is_open = EXCLUDED.is_open,
    order_limit = EXCLUDED.order_limit,
    address = EXCLUDED.address,
    updated_at = now();

-- 11. CREATE UTILITY FUNCTIONS
-- ====================================================================

-- Function to get restaurant by business_id (for backward compatibility)
CREATE OR REPLACE FUNCTION public.get_restaurant_by_business_id(business_uuid UUID)
RETURNS TABLE(
    id UUID,
    name TEXT,
    slug TEXT,
    phone TEXT,
    timezone TEXT,
    currency TEXT,
    is_open BOOLEAN,
    order_limit INTEGER,
    address JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.slug,
        r.phone,
        r.timezone,
        r.currency,
        r.is_open,
        r.order_limit,
        r.address
    FROM public.restaurants r
    WHERE r.business_id = business_uuid
    AND r.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate order total
CREATE OR REPLACE FUNCTION public.calculate_order_total(order_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total DECIMAL(10,2) := 0;
BEGIN
    SELECT COALESCE(SUM(line_total), 0)
    INTO total
    FROM public.order_items
    WHERE order_id = order_uuid;
    
    -- Add delivery fee, tax, tip from orders table
    SELECT total + COALESCE(delivery_fee, 0) + COALESCE(tax_amount, 0) + COALESCE(tip_amount, 0) - COALESCE(discount_amount, 0)
    INTO total
    FROM public.orders
    WHERE id = order_uuid;
    
    RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 🎯 ENTERPRISE SCHEMA DEPLOYMENT COMPLETE
-- ====================================================================
-- Tables created: restaurants, menu_categories, menu_items, orders, order_items
-- Migration: Existing businesses data preserved and linked
-- Security: RLS enabled with appropriate policies
-- Performance: Optimized indexes for common queries
-- Compatibility: Utility functions for backward compatibility
-- ====================================================================