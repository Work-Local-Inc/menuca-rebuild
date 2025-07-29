-- Analytics Schema Extension for MenuCA
-- Adds tables and views optimized for analytics and reporting

-- =========================================
-- ORDERS TABLE (ensure it exists with required fields)
-- =========================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total_amount INTEGER NOT NULL CHECK (total_amount >= 0), -- Amount in cents
    subtotal INTEGER NOT NULL CHECK (subtotal >= 0), -- Amount in cents
    tax_amount INTEGER DEFAULT 0 CHECK (tax_amount >= 0), -- Amount in cents
    delivery_fee INTEGER DEFAULT 0 CHECK (delivery_fee >= 0), -- Amount in cents
    tip_amount INTEGER DEFAULT 0 CHECK (tip_amount >= 0), -- Amount in cents
    currency VARCHAR(3) NOT NULL DEFAULT 'usd',
    payment_status VARCHAR(50) DEFAULT 'pending',
    delivery_address JSONB,
    special_instructions TEXT,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for orders (analytics optimized)
CREATE INDEX IF NOT EXISTS idx_orders_tenant_created ON orders(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created ON orders(restaurant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON orders(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_date_only ON orders(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_orders_analytics ON orders(tenant_id, restaurant_id, status, created_at, total_amount);

-- =========================================
-- ORDER ITEMS TABLE (ensure it exists)
-- =========================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price INTEGER NOT NULL CHECK (price >= 0), -- Price per item in cents
    total_price INTEGER NOT NULL CHECK (total_price >= 0), -- Total for this line item in cents
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for order_items (analytics optimized)
CREATE INDEX IF NOT EXISTS idx_order_items_tenant ON order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_order_items_analytics ON order_items(tenant_id, menu_item_id, quantity, total_price);

-- =========================================
-- ANALYTICS MATERIALIZED VIEWS
-- =========================================

-- Daily order summary materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_order_summary AS
SELECT 
    o.tenant_id,
    o.restaurant_id,
    DATE(o.created_at) as order_date,
    COUNT(o.id) as order_count,
    SUM(o.total_amount) as total_revenue,
    AVG(o.total_amount) as avg_order_value,
    COUNT(DISTINCT o.customer_id) as unique_customers,
    COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_orders,
    AVG(EXTRACT(EPOCH FROM (o.actual_delivery_time - o.created_at))/60) as avg_delivery_time_minutes
FROM orders o
WHERE o.created_at >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY o.tenant_id, o.restaurant_id, DATE(o.created_at);

-- Create unique index for the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_order_summary_unique 
ON daily_order_summary(tenant_id, restaurant_id, order_date);

-- Indexes for the materialized view
CREATE INDEX IF NOT EXISTS idx_daily_order_summary_tenant_date ON daily_order_summary(tenant_id, order_date);
CREATE INDEX IF NOT EXISTS idx_daily_order_summary_restaurant_date ON daily_order_summary(restaurant_id, order_date);

-- Monthly customer summary materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_customer_summary AS
SELECT 
    u.tenant_id,
    u.id as customer_id,
    u.email as customer_email,
    DATE_TRUNC('month', o.created_at) as month,
    COUNT(o.id) as order_count,
    SUM(o.total_amount) as total_spent,
    AVG(o.total_amount) as avg_order_value,
    COUNT(DISTINCT o.restaurant_id) as restaurants_ordered_from,
    MIN(o.created_at) as first_order_date,
    MAX(o.created_at) as last_order_date
FROM users u
JOIN orders o ON u.id = o.customer_id
WHERE o.status != 'cancelled'
  AND o.created_at >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY u.tenant_id, u.id, u.email, DATE_TRUNC('month', o.created_at);

-- Create unique index for monthly customer summary
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_customer_summary_unique 
ON monthly_customer_summary(tenant_id, customer_id, month);

-- Menu item performance materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS menu_item_performance AS
SELECT 
    mi.tenant_id,
    mi.restaurant_id,
    mi.id as menu_item_id,
    mi.name as item_name,
    mc.name as category_name,
    DATE_TRUNC('week', o.created_at) as week,
    COUNT(oi.id) as order_count,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.total_price) as total_revenue,
    AVG(oi.price) as avg_price,
    COUNT(DISTINCT o.customer_id) as unique_customers
FROM menu_items mi
LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
LEFT JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mi.status = 'available'
  AND (o.created_at IS NULL OR o.created_at >= CURRENT_DATE - INTERVAL '6 months')
GROUP BY mi.tenant_id, mi.restaurant_id, mi.id, mi.name, mc.name, DATE_TRUNC('week', o.created_at);

-- Create unique index for menu item performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_item_performance_unique 
ON menu_item_performance(tenant_id, restaurant_id, menu_item_id, week);

-- =========================================
-- ANALYTICS AGGREGATION TABLES
-- =========================================

-- Hourly metrics aggregation table for real-time analytics
CREATE TABLE IF NOT EXISTS hourly_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    hour_timestamp TIMESTAMP WITH TIME ZONE NOT NULL, -- Truncated to hour
    metric_type VARCHAR(50) NOT NULL, -- 'orders', 'revenue', 'customers', etc.
    metric_value DECIMAL(15,2) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for hourly metrics
CREATE INDEX IF NOT EXISTS idx_hourly_metrics_tenant_time ON hourly_metrics(tenant_id, hour_timestamp);
CREATE INDEX IF NOT EXISTS idx_hourly_metrics_restaurant_time ON hourly_metrics(restaurant_id, hour_timestamp);
CREATE INDEX IF NOT EXISTS idx_hourly_metrics_type_time ON hourly_metrics(metric_type, hour_timestamp);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hourly_metrics_unique 
ON hourly_metrics(tenant_id, COALESCE(restaurant_id, '00000000-0000-0000-0000-000000000000'::UUID), hour_timestamp, metric_type);

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- Enable RLS on new analytics tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_metrics ENABLE ROW LEVEL SECURITY;

-- Orders RLS Policies
DROP POLICY IF EXISTS orders_tenant_isolation ON orders;
CREATE POLICY orders_tenant_isolation ON orders
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Order Items RLS Policies
DROP POLICY IF EXISTS order_items_tenant_isolation ON order_items;
CREATE POLICY order_items_tenant_isolation ON order_items
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Hourly Metrics RLS Policies
DROP POLICY IF EXISTS hourly_metrics_tenant_isolation ON hourly_metrics;
CREATE POLICY hourly_metrics_tenant_isolation ON hourly_metrics
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- =========================================
-- FUNCTIONS FOR ANALYTICS
-- =========================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_order_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_customer_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY menu_item_performance;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate customer lifetime value
CREATE OR REPLACE FUNCTION calculate_customer_ltv(
    p_tenant_id UUID,
    p_customer_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    v_total_spent DECIMAL;
    v_order_count INTEGER;
    v_months_active DECIMAL;
    v_avg_monthly_spend DECIMAL;
    v_ltv DECIMAL;
BEGIN
    -- Get customer metrics
    SELECT 
        COALESCE(SUM(total_amount), 0) / 100.0,
        COUNT(*),
        GREATEST(
            DATE_PART('month', AGE(MAX(created_at), MIN(created_at))) + 1,
            1
        )
    INTO v_total_spent, v_order_count, v_months_active
    FROM orders
    WHERE tenant_id = p_tenant_id 
      AND customer_id = p_customer_id 
      AND status != 'cancelled';

    -- Calculate average monthly spend
    v_avg_monthly_spend := v_total_spent / v_months_active;
    
    -- Simple LTV calculation: avg monthly spend * 12 months (assume 1 year retention)
    v_ltv := v_avg_monthly_spend * 12;
    
    RETURN COALESCE(v_ltv, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get trending menu items
CREATE OR REPLACE FUNCTION get_trending_menu_items(
    p_tenant_id UUID,
    p_restaurant_id UUID,
    p_days_back INTEGER DEFAULT 30
) RETURNS TABLE(
    menu_item_id UUID,
    item_name TEXT,
    current_orders BIGINT,
    previous_orders BIGINT,
    growth_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mi.id,
        mi.name,
        COALESCE(current_period.order_count, 0) as current_orders,
        COALESCE(previous_period.order_count, 0) as previous_orders,
        CASE 
            WHEN COALESCE(previous_period.order_count, 0) = 0 THEN 100.0
            ELSE ((COALESCE(current_period.order_count, 0) - COALESCE(previous_period.order_count, 0)) * 100.0 / previous_period.order_count)
        END as growth_rate
    FROM menu_items mi
    LEFT JOIN (
        SELECT 
            oi.menu_item_id,
            COUNT(*) as order_count
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.tenant_id = p_tenant_id
          AND o.restaurant_id = p_restaurant_id
          AND o.created_at >= CURRENT_DATE - INTERVAL '%s days'
          AND o.created_at >= CURRENT_DATE - INTERVAL '%s days'
          AND o.status != 'cancelled'
        GROUP BY oi.menu_item_id
    ) current_period ON mi.id = current_period.menu_item_id
    LEFT JOIN (
        SELECT 
            oi.menu_item_id,
            COUNT(*) as order_count
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.tenant_id = p_tenant_id
          AND o.restaurant_id = p_restaurant_id
          AND o.created_at >= CURRENT_DATE - INTERVAL '%s days'
          AND o.created_at < CURRENT_DATE - INTERVAL '%s days'
          AND o.status != 'cancelled'
        GROUP BY oi.menu_item_id
    ) previous_period ON mi.id = previous_period.menu_item_id
    WHERE mi.tenant_id = p_tenant_id
      AND mi.restaurant_id = p_restaurant_id
      AND mi.status = 'available'
    ORDER BY growth_rate DESC, current_orders DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- TRIGGERS FOR REAL-TIME METRICS
-- =========================================

-- Function to update hourly metrics when orders are created/updated
CREATE OR REPLACE FUNCTION update_hourly_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert/update hourly order count
    INSERT INTO hourly_metrics (
        tenant_id, restaurant_id, hour_timestamp, metric_type, metric_value, metadata
    ) VALUES (
        NEW.tenant_id,
        NEW.restaurant_id,
        DATE_TRUNC('hour', NEW.created_at),
        'orders',
        1,
        jsonb_build_object('order_id', NEW.id, 'status', NEW.status)
    )
    ON CONFLICT (tenant_id, restaurant_id, hour_timestamp, metric_type)
    DO UPDATE SET 
        metric_value = hourly_metrics.metric_value + 1,
        metadata = hourly_metrics.metadata || EXCLUDED.metadata;

    -- Insert/update hourly revenue
    IF NEW.status != 'cancelled' THEN
        INSERT INTO hourly_metrics (
            tenant_id, restaurant_id, hour_timestamp, metric_type, metric_value, metadata
        ) VALUES (
            NEW.tenant_id,
            NEW.restaurant_id,
            DATE_TRUNC('hour', NEW.created_at),
            'revenue',
            NEW.total_amount / 100.0,
            jsonb_build_object('order_id', NEW.id, 'amount', NEW.total_amount)
        )
        ON CONFLICT (tenant_id, restaurant_id, hour_timestamp, metric_type)
        DO UPDATE SET 
            metric_value = hourly_metrics.metric_value + EXCLUDED.metric_value;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order metrics
DROP TRIGGER IF EXISTS trigger_update_hourly_metrics ON orders;
CREATE TRIGGER trigger_update_hourly_metrics
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_hourly_metrics();

-- =========================================
-- UPDATED_AT TRIGGERS
-- =========================================

-- Add triggers for new analytics tables
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at 
    BEFORE UPDATE ON order_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- COMMENTS FOR DOCUMENTATION
-- =========================================

COMMENT ON TABLE orders IS 'Core orders table with analytics-optimized indexes';
COMMENT ON TABLE order_items IS 'Individual line items within orders for detailed analytics';
COMMENT ON TABLE hourly_metrics IS 'Real-time aggregated metrics updated via triggers';

COMMENT ON MATERIALIZED VIEW daily_order_summary IS 'Pre-aggregated daily metrics for fast analytics queries';
COMMENT ON MATERIALIZED VIEW monthly_customer_summary IS 'Monthly customer behavior analysis';
COMMENT ON MATERIALIZED VIEW menu_item_performance IS 'Weekly menu item performance tracking';

COMMENT ON FUNCTION refresh_analytics_views IS 'Refreshes all analytics materialized views';
COMMENT ON FUNCTION calculate_customer_ltv IS 'Calculates customer lifetime value';
COMMENT ON FUNCTION get_trending_menu_items IS 'Returns trending menu items with growth rates';