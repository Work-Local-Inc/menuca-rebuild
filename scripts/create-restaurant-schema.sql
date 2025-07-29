-- Restaurant Profile Management Schema
-- Implements MC-C-BE-004: Restaurant CRUD operations, configuration, status controls

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address JSONB NOT NULL,
    contact JSONB NOT NULL,
    business_hours JSONB NOT NULL DEFAULT '[]',
    settings JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'pending_approval',
    cuisine_type TEXT[] NOT NULL DEFAULT '{}',
    price_range VARCHAR(20) NOT NULL DEFAULT 'moderate',
    delivery_zones JSONB NOT NULL DEFAULT '[]',
    images JSONB NOT NULL DEFAULT '[]',
    rating DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    -- Constraints
    CONSTRAINT restaurants_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT restaurants_creator_fk FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT restaurants_status_check CHECK (status IN ('active', 'inactive', 'pending_approval', 'suspended', 'closed_temporarily')),
    CONSTRAINT restaurants_price_range_check CHECK (price_range IN ('budget', 'moderate', 'upscale', 'fine_dining')),
    CONSTRAINT restaurants_rating_check CHECK (rating >= 0 AND rating <= 5)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS restaurants_tenant_id_idx ON restaurants(tenant_id);
CREATE INDEX IF NOT EXISTS restaurants_status_idx ON restaurants(status);
CREATE INDEX IF NOT EXISTS restaurants_cuisine_type_idx ON restaurants USING GIN(cuisine_type);
CREATE INDEX IF NOT EXISTS restaurants_created_at_idx ON restaurants(created_at DESC);
CREATE INDEX IF NOT EXISTS restaurants_rating_idx ON restaurants(rating DESC);

-- Full-text search index for restaurant names and descriptions
CREATE INDEX IF NOT EXISTS restaurants_search_idx ON restaurants USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- Geographic index for location-based searches (if coordinates are provided)
CREATE INDEX IF NOT EXISTS restaurants_location_idx ON restaurants USING GIST(
    (address->>'latitude')::numeric, (address->>'longitude')::numeric
) WHERE address ? 'latitude' AND address ? 'longitude';

-- Row Level Security (RLS) for multi-tenant isolation
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access restaurants from their tenant
CREATE POLICY restaurants_tenant_isolation ON restaurants
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- RLS Policy: Restaurant owners can manage their own restaurants
CREATE POLICY restaurants_owner_access ON restaurants
    FOR ALL
    USING (
        tenant_id = current_setting('app.current_tenant_id')::UUID AND
        (
            created_by = current_setting('app.current_user_id')::UUID OR
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = current_setting('app.current_user_id')::UUID 
                AND role IN ('admin', 'restaurant_manager')
            )
        )
    );

-- Audit trigger for tracking changes
CREATE OR REPLACE FUNCTION update_restaurant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER restaurants_updated_at_trigger
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_restaurant_updated_at();

-- Restaurant statistics view
CREATE OR REPLACE VIEW restaurant_statistics AS
SELECT 
    r.id,
    r.tenant_id,
    r.name,
    r.status,
    r.rating,
    r.total_reviews,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.order_total), 0) as total_revenue,
    COALESCE(AVG(o.order_total), 0) as average_order_value,
    COUNT(DISTINCT o.customer_id) as unique_customers,
    COUNT(DISTINCT DATE(o.created_at)) as active_days
FROM restaurants r
LEFT JOIN orders o ON r.id = o.restaurant_id 
    AND o.status IN ('completed', 'delivered')
    AND o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY r.id, r.tenant_id, r.name, r.status, r.rating, r.total_reviews;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON restaurants TO restaurant_user;
GRANT SELECT ON restaurant_statistics TO restaurant_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO restaurant_user;

-- Sample data for development/testing
INSERT INTO restaurants (
    id, tenant_id, name, description, address, contact, cuisine_type, 
    price_range, status, created_by
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM tenants LIMIT 1),
    'Mario''s Italian Kitchen',
    'Authentic Italian cuisine with fresh ingredients and traditional recipes passed down through generations.',
    '{"street": "123 Main Street", "city": "San Francisco", "state": "CA", "postal_code": "94102", "country": "USA", "latitude": 37.7749, "longitude": -122.4194}',
    '{"phone": "+1-415-555-0123", "email": "info@mariositalian.com", "website": "https://mariositalian.com"}',
    ARRAY['Italian', 'European'],
    'moderate',
    'active',
    (SELECT id FROM users WHERE role = 'restaurant_owner' LIMIT 1)
),
(
    gen_random_uuid(),
    (SELECT id FROM tenants LIMIT 1),
    'Dragon Palace',
    'Premium Chinese cuisine featuring Szechuan and Cantonese specialties in an elegant setting.',
    '{"street": "456 Chinatown Ave", "city": "San Francisco", "state": "CA", "postal_code": "94108", "country": "USA", "latitude": 37.7941, "longitude": -122.4078}',
    '{"phone": "+1-415-555-0456", "email": "orders@dragonpalace.com", "website": "https://dragonpalace.com"}',
    ARRAY['Chinese', 'Asian'],
    'upscale',
    'active',
    (SELECT id FROM users WHERE role = 'restaurant_owner' LIMIT 1)
),
(
    gen_random_uuid(),
    (SELECT id FROM tenants LIMIT 1),
    'The Burger Joint',
    'Gourmet burgers made with locally sourced beef and fresh toppings. Casual dining at its finest.',
    '{"street": "789 Castro Street", "city": "San Francisco", "state": "CA", "postal_code": "94114", "country": "USA", "latitude": 37.7609, "longitude": -122.4350}',
    '{"phone": "+1-415-555-0789", "email": "hello@burgerjoint.com"}',
    ARRAY['American', 'Burgers'],
    'budget',
    'active',
    (SELECT id FROM users WHERE role = 'restaurant_owner' LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE restaurants IS 'Restaurant profiles with complete business information, settings, and operational data';
COMMENT ON COLUMN restaurants.address IS 'Complete address information including coordinates for delivery mapping';
COMMENT ON COLUMN restaurants.contact IS 'Contact information including phone, email, website, and social media';
COMMENT ON COLUMN restaurants.business_hours IS 'Operating hours for each day of the week with open/close times';
COMMENT ON COLUMN restaurants.settings IS 'Restaurant operational settings including fees, preferences, and limits';
COMMENT ON COLUMN restaurants.delivery_zones IS 'Defined delivery areas with associated fees and minimums';
COMMENT ON COLUMN restaurants.images IS 'Restaurant images including logo, cover, interior, and food photos';