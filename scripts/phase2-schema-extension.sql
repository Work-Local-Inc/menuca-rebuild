-- MenuCA Phase 2 Database Schema Extension
-- Adds restaurant, menu, order, and payment tables for core ordering system

-- Create additional types for Phase 2
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
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine_type VARCHAR(100),
    address JSONB NOT NULL, -- {street, city, state, zip, country}
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    operating_hours JSONB, -- {monday: {open: "09:00", close: "22:00"}, ...}
    delivery_radius_km DECIMAL(5,2) DEFAULT 5.0,
    min_order_amount DECIMAL(10,2) DEFAULT 0.00,
    commission_rate DECIMAL(5,4), -- Override tenant default if set
    status restaurant_status DEFAULT 'pending_approval',
    featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu categories table
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
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
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2), -- For profit calculations
    preparation_time_minutes INTEGER DEFAULT 0,
    calories INTEGER,
    ingredients TEXT[],
    allergens TEXT[],
    dietary_tags TEXT[], -- vegetarian, vegan, gluten-free, etc.
    image_url VARCHAR(500),
    status menu_item_status DEFAULT 'available',
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- ORDERING SYSTEM TABLES
-- =========================================

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL, -- Human-readable order number
    status order_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    commission_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address JSONB, -- {street, city, state, zip, instructions}
    delivery_phone VARCHAR(20),
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    special_instructions TEXT,
    payment_method payment_method,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, order_number)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- PAYMENT AND COMMISSION TABLES
-- =========================================

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status payment_status DEFAULT 'pending',
    payment_method payment_method NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission tracking table
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    commission_rate DECIMAL(5,4) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, calculated, paid
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- =========================================
-- SHOPPING CART (REDIS-BACKED)
-- =========================================

-- Cart items table (for persistence backup)
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, user_id, menu_item_id)
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Restaurant indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_tenant_id ON restaurants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);
CREATE INDEX IF NOT EXISTS idx_restaurants_featured ON restaurants(featured);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON restaurants(cuisine_type);

-- Menu indexes
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_status ON menu_items(status);
CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON menu_items(is_featured);

-- Order indexes
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Payment and commission indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_commissions_restaurant_id ON commissions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order_id ON commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

-- Cart indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_restaurant_id ON cart_items(restaurant_id);

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- Enable RLS on all new tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_restaurants ON restaurants
    FOR ALL TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY tenant_isolation_menu_categories ON menu_categories
    FOR ALL TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY tenant_isolation_menu_items ON menu_items
    FOR ALL TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY tenant_isolation_orders ON orders
    FOR ALL TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY tenant_isolation_order_items ON order_items
    FOR ALL TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY tenant_isolation_payments ON payments
    FOR ALL TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY tenant_isolation_commissions ON commissions
    FOR ALL TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

CREATE POLICY tenant_isolation_cart_items ON cart_items
    FOR ALL TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- =========================================
-- TRIGGERS FOR UPDATED_AT
-- =========================================

CREATE TRIGGER update_restaurants_updated_at 
    BEFORE UPDATE ON restaurants 
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

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at 
    BEFORE UPDATE ON cart_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- UTILITY FUNCTIONS FOR PHASE 2
-- =========================================

-- Function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_order_number(tenant_uuid UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    order_num VARCHAR(50);
    counter INTEGER;
BEGIN
    -- Get daily counter for this tenant
    SELECT COALESCE(MAX(CAST(SPLIT_PART(order_number, '-', 3) AS INTEGER)), 0) + 1
    INTO counter
    FROM orders 
    WHERE tenant_id = tenant_uuid 
    AND DATE(created_at) = CURRENT_DATE;
    
    -- Format: ORD-YYYYMMDD-XXXX
    order_num := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate commission
CREATE OR REPLACE FUNCTION calculate_commission(
    restaurant_uuid UUID,
    order_amount DECIMAL(10,2)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    commission_rate DECIMAL(5,4);
    commission_amount DECIMAL(10,2);
BEGIN
    -- Get restaurant-specific commission rate or use tenant default
    SELECT COALESCE(r.commission_rate, t.commission_rate)
    INTO commission_rate
    FROM restaurants r
    JOIN tenants t ON r.tenant_id = t.id
    WHERE r.id = restaurant_uuid;
    
    commission_amount := order_amount * commission_rate;
    
    RETURN commission_amount;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- GRANT PERMISSIONS TO APPLICATION ROLES
-- =========================================

-- Grant permissions on new tables to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON restaurants TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON menu_categories TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON menu_items TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON order_items TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON payments TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON commissions TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO menuca_app;

-- Grant read-only permissions
GRANT SELECT ON restaurants TO menuca_readonly;
GRANT SELECT ON menu_categories TO menuca_readonly;
GRANT SELECT ON menu_items TO menuca_readonly;
GRANT SELECT ON orders TO menuca_readonly;
GRANT SELECT ON order_items TO menuca_readonly;
GRANT SELECT ON payments TO menuca_readonly;
GRANT SELECT ON commissions TO menuca_readonly;
GRANT SELECT ON cart_items TO menuca_readonly;

-- =========================================
-- SAMPLE DATA FOR DEVELOPMENT
-- =========================================

-- Insert sample restaurant
DO $$
DECLARE
    default_tenant_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
    admin_user_id UUID;
    restaurant_id UUID;
    category_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM users 
    WHERE tenant_id = default_tenant_id AND email = 'admin@menuca.local';
    
    -- Insert sample restaurant
    INSERT INTO restaurants (
        id, tenant_id, owner_id, name, description, cuisine_type,
        address, phone, email, operating_hours, status
    ) VALUES (
        uuid_generate_v4(), default_tenant_id, admin_user_id,
        'Demo Pizza Palace', 'Authentic Italian pizza and pasta',
        'Italian',
        '{"street": "123 Main St", "city": "Demo City", "state": "DC", "zip": "12345", "country": "US"}',
        '+1-555-0123', 'demo@pizzapalace.com',
        '{"monday": {"open": "11:00", "close": "23:00"}, "tuesday": {"open": "11:00", "close": "23:00"}}',
        'active'
    ) RETURNING id INTO restaurant_id;
    
    -- Insert sample menu category
    INSERT INTO menu_categories (
        id, tenant_id, restaurant_id, name, description
    ) VALUES (
        uuid_generate_v4(), default_tenant_id, restaurant_id,
        'Pizzas', 'Our signature wood-fired pizzas'
    ) RETURNING id INTO category_id;
    
    -- Insert sample menu items
    INSERT INTO menu_items (
        tenant_id, restaurant_id, category_id, name, description, price
    ) VALUES 
    (default_tenant_id, restaurant_id, category_id, 'Margherita Pizza', 'Fresh tomato sauce, mozzarella, basil', 12.99),
    (default_tenant_id, restaurant_id, category_id, 'Pepperoni Pizza', 'Tomato sauce, mozzarella, pepperoni', 14.99),
    (default_tenant_id, restaurant_id, category_id, 'Supreme Pizza', 'Loaded with pepperoni, sausage, peppers, onions', 18.99);
    
END
$$;

-- =========================================
-- COMPLETION MESSAGE
-- =========================================

DO $$
BEGIN
    RAISE NOTICE 'Phase 2 database schema extension completed successfully!';
    RAISE NOTICE 'Added tables: restaurants, menu_categories, menu_items, orders, order_items, payments, commissions, cart_items';
    RAISE NOTICE 'Sample restaurant "Demo Pizza Palace" created with menu items';
    RAISE NOTICE 'All tables have Row Level Security policies for multi-tenant isolation';
END
$$;