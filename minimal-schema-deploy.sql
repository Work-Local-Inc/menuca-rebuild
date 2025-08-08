-- Minimal Enterprise Schema for Live Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fsjodpnptdbwaigzkmfl/sql

-- Create restaurants table
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL DEFAULT 'default-tenant',
    owner_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine_type VARCHAR(100),
    address JSONB NOT NULL DEFAULT '{}',
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    operating_hours JSONB DEFAULT '{}',
    delivery_radius_km DECIMAL(5,2) DEFAULT 5.0,
    min_order_amount DECIMAL(10,2) DEFAULT 0.00,
    commission_rate DECIMAL(5,4),
    status VARCHAR(50) DEFAULT 'active',
    featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create restaurant_menus table
CREATE TABLE IF NOT EXISTS public.restaurant_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL DEFAULT 'default-tenant',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- Create menu_categories table  
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id UUID NOT NULL REFERENCES public.restaurant_menus(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) DEFAULT 0,
    images JSONB DEFAULT '[]',
    options JSONB DEFAULT '[]',
    nutritional_info JSONB DEFAULT '{}',
    allergens TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    availability JSONB DEFAULT '{"is_available": true, "available_days": [1,2,3,4,5,6,7], "available_times": [{"start_time": "00:00", "end_time": "23:59"}]}',
    display_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    preparation_time INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_restaurants_tenant_id ON public.restaurants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menus_restaurant_id ON public.restaurant_menus(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu_id ON public.menu_categories(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);

-- Insert admin test restaurant
INSERT INTO public.restaurants (
    id, 
    tenant_id, 
    name, 
    description, 
    cuisine_type,
    address,
    status
) VALUES (
    'restaurant-user-adminmenucalocal-YWRtaW5A'::UUID,
    'default-tenant',
    'Admin Test Restaurant', 
    'Test restaurant for admin user menu management',
    'Pizza',
    '{"street": "123 Test Street", "city": "Test City", "state": "TC", "zip": "12345"}',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT '🎉 Enterprise schema deployed! Ready for MCP operations!' as message;