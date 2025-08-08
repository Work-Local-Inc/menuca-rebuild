-- MenuCA Full Schema Deployment to Live Supabase
-- This consolidates all schema files for one-time deployment

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE restaurant_status AS ENUM ('active', 'inactive', 'pending_approval', 'suspended');
CREATE TYPE menu_item_status AS ENUM ('available', 'unavailable', 'seasonal', 'discontinued');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('card', 'cash', 'digital_wallet');

-- =========================================
-- RESTAURANT MANAGEMENT TABLES
-- =========================================

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    status restaurant_status DEFAULT 'active',
    featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurant menus table
CREATE TABLE IF NOT EXISTS restaurant_menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Menu categories table
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_id UUID NOT NULL REFERENCES restaurant_menus(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu items table  
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
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

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

CREATE INDEX IF NOT EXISTS idx_restaurants_tenant_id ON restaurants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menus_restaurant_id ON restaurant_menus(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_menu_id ON menu_categories(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);

-- =========================================
-- UTILITY FUNCTIONS
-- =========================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_restaurants_updated_at 
    BEFORE UPDATE ON restaurants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_menus_updated_at 
    BEFORE UPDATE ON restaurant_menus 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at 
    BEFORE UPDATE ON menu_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at 
    BEFORE UPDATE ON menu_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- SAMPLE DATA FOR ADMIN TESTING
-- =========================================

-- Insert test restaurant for admin user
INSERT INTO restaurants (
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

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '🎉 MenuCA enterprise schema deployed to live Supabase!';
    RAISE NOTICE '📊 Tables created: restaurants, restaurant_menus, menu_categories, menu_items';
    RAISE NOTICE '🍕 Ready for Xtreme Pizza data import!';
END
$$;