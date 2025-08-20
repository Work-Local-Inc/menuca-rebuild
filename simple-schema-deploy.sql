-- Simple version for immediate deployment
-- CREATE RESTAURANTS TABLE
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id),
    name TEXT NOT NULL,
    phone TEXT,
    timezone TEXT DEFAULT 'America/Toronto',
    currency TEXT DEFAULT 'CAD',
    is_open BOOLEAN DEFAULT true,
    order_limit INTEGER DEFAULT 0,
    address JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- CREATE MENU ITEMS TABLE  
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- CREATE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL UNIQUE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    customer_name TEXT,
    customer_phone TEXT,
    status TEXT DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY IF NOT EXISTS "restaurants_public_read" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "menu_items_public_read" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "orders_authenticated" ON public.orders FOR ALL USING (auth.role() = 'authenticated');

-- Migrate existing businesses
INSERT INTO public.restaurants (business_id, name, phone, timezone, currency, is_open, order_limit, address, created_at, updated_at)
SELECT id, name, phone, timezone, currency, is_open, order_limit, address, created_at, updated_at
FROM public.businesses
ON CONFLICT (business_id) DO NOTHING;