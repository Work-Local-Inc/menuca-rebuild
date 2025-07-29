-- Commission Schema Extension for MenuCA
-- Adds tables for commission tracking, calculation, and reporting

-- =========================================
-- COMMISSIONS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL, -- May reference orders(id) or be adjustment ID
    transaction_type VARCHAR(50) NOT NULL DEFAULT 'order_commission',
    gross_amount INTEGER NOT NULL DEFAULT 0 CHECK (gross_amount >= 0), -- Amount in cents
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (commission_rate >= 0 AND commission_rate <= 100), -- Percentage
    commission_amount INTEGER NOT NULL DEFAULT 0 CHECK (commission_amount >= 0), -- Amount in cents
    platform_fee INTEGER NOT NULL DEFAULT 0 CHECK (platform_fee >= 0), -- Amount in cents
    net_amount INTEGER NOT NULL DEFAULT 0, -- Amount in cents (can be negative for adjustments)
    currency VARCHAR(3) NOT NULL DEFAULT 'usd',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    payment_due_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for commissions
CREATE INDEX IF NOT EXISTS idx_commissions_tenant_restaurant ON commissions(tenant_id, restaurant_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_restaurant_date ON commissions(restaurant_id, calculation_date);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_payment_due ON commissions(payment_due_date) WHERE status IN ('calculated', 'pending');
CREATE INDEX IF NOT EXISTS idx_commissions_transaction_type ON commissions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at);

-- Partial index for active commissions
CREATE INDEX IF NOT EXISTS idx_commissions_active ON commissions(tenant_id, restaurant_id, created_at) 
    WHERE status IN ('pending', 'calculated');

-- =========================================
-- COMMISSION PAYMENT BATCHES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS commission_payment_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    batch_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_commissions INTEGER NOT NULL CHECK (total_commissions >= 0), -- Amount in cents
    total_platform_fees INTEGER NOT NULL CHECK (total_platform_fees >= 0), -- Amount in cents
    net_amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) NOT NULL DEFAULT 'usd',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(100),
    payment_reference VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payment batches
CREATE INDEX IF NOT EXISTS idx_payment_batches_tenant_restaurant ON commission_payment_batches(tenant_id, restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payment_batches_status ON commission_payment_batches(status);
CREATE INDEX IF NOT EXISTS idx_payment_batches_payment_date ON commission_payment_batches(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_batches_period ON commission_payment_batches(period_start, period_end);

-- =========================================
-- COMMISSION BATCH ITEMS TABLE
-- =========================================
-- Links individual commissions to payment batches
CREATE TABLE IF NOT EXISTS commission_batch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES commission_payment_batches(id) ON DELETE CASCADE,
    commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for batch items
CREATE INDEX IF NOT EXISTS idx_batch_items_batch ON commission_batch_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_items_commission ON commission_batch_items(commission_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_batch_items_unique ON commission_batch_items(commission_id);

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- Enable RLS on commission tables
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_batch_items ENABLE ROW LEVEL SECURITY;

-- Commissions RLS Policies
CREATE POLICY commissions_tenant_isolation ON commissions
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Payment Batches RLS Policies  
CREATE POLICY payment_batches_tenant_isolation ON commission_payment_batches
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Batch Items RLS Policies
CREATE POLICY batch_items_tenant_isolation ON commission_batch_items
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- =========================================
-- UPDATED_AT TRIGGERS
-- =========================================

-- Add triggers for commission tables
CREATE TRIGGER update_commissions_updated_at 
    BEFORE UPDATE ON commissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_batches_updated_at 
    BEFORE UPDATE ON commission_payment_batches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- CONSTRAINTS & VALIDATIONS
-- =========================================

-- Validate transaction types
ALTER TABLE commissions ADD CONSTRAINT chk_commission_transaction_type 
    CHECK (transaction_type IN (
        'order_commission', 
        'delivery_fee', 
        'service_fee', 
        'adjustment'
    ));

-- Validate commission status values
ALTER TABLE commissions ADD CONSTRAINT chk_commission_status 
    CHECK (status IN (
        'pending', 
        'calculated', 
        'paid', 
        'disputed', 
        'refunded'
    ));

-- Validate payment batch status values
ALTER TABLE commission_payment_batches ADD CONSTRAINT chk_batch_status 
    CHECK (status IN (
        'pending', 
        'processing', 
        'paid', 
        'failed', 
        'cancelled'
    ));

-- Validate currency codes (ISO 4217)
ALTER TABLE commissions ADD CONSTRAINT chk_commission_currency 
    CHECK (currency ~ '^[A-Z]{3}$');

ALTER TABLE commission_payment_batches ADD CONSTRAINT chk_batch_currency 
    CHECK (currency ~ '^[A-Z]{3}$');

-- Ensure period_end is after period_start
ALTER TABLE commission_payment_batches ADD CONSTRAINT chk_batch_period_order 
    CHECK (period_end > period_start);

-- =========================================
-- VIEWS FOR REPORTING
-- =========================================

-- Commission summary view by restaurant
CREATE OR REPLACE VIEW commission_summary_by_restaurant AS
SELECT 
    c.tenant_id,
    c.restaurant_id,
    r.name as restaurant_name,
    DATE_TRUNC('month', c.calculation_date) as month,
    COUNT(DISTINCT c.order_id) FILTER (WHERE c.transaction_type = 'order_commission') as total_orders,
    SUM(c.gross_amount) FILTER (WHERE c.transaction_type = 'order_commission') as gross_revenue,
    SUM(c.commission_amount) as total_commission,
    SUM(c.platform_fee) as total_platform_fees,
    SUM(c.net_amount) as net_amount,
    c.currency,
    CASE 
        WHEN COUNT(CASE WHEN c.status = 'paid' THEN 1 END) = COUNT(*) THEN 'paid'
        WHEN COUNT(CASE WHEN c.status = 'calculated' THEN 1 END) > 0 THEN 'calculated'
        ELSE 'pending'
    END as overall_status
FROM commissions c
JOIN restaurants r ON c.restaurant_id = r.id
GROUP BY c.tenant_id, c.restaurant_id, r.name, DATE_TRUNC('month', c.calculation_date), c.currency;

-- Daily commission summary view
CREATE OR REPLACE VIEW daily_commission_summary AS
SELECT 
    c.tenant_id,
    DATE_TRUNC('day', c.calculation_date) as date,
    COUNT(DISTINCT c.restaurant_id) as total_restaurants,
    COUNT(DISTINCT c.order_id) FILTER (WHERE c.transaction_type = 'order_commission') as total_orders,
    SUM(c.gross_amount) FILTER (WHERE c.transaction_type = 'order_commission') as gross_revenue,
    SUM(c.commission_amount) as total_commission,
    SUM(c.platform_fee) as total_platform_fees,
    SUM(c.net_amount) as total_net_amount,
    c.currency
FROM commissions c
GROUP BY c.tenant_id, DATE_TRUNC('day', c.calculation_date), c.currency
ORDER BY date DESC;

-- Outstanding payments view
CREATE OR REPLACE VIEW outstanding_commission_payments AS
SELECT 
    c.tenant_id,
    c.restaurant_id,
    r.name as restaurant_name,
    COUNT(*) as pending_commissions,
    SUM(c.net_amount) as total_amount_due,
    MIN(c.payment_due_date) as earliest_due_date,
    MAX(c.payment_due_date) as latest_due_date,
    c.currency
FROM commissions c
JOIN restaurants r ON c.restaurant_id = r.id
WHERE c.status IN ('calculated', 'pending')
  AND c.net_amount > 0  -- Exclude negative adjustments
GROUP BY c.tenant_id, c.restaurant_id, r.name, c.currency
HAVING SUM(c.net_amount) > 0
ORDER BY earliest_due_date ASC;

-- =========================================
-- FUNCTIONS FOR COMMISSION CALCULATIONS
-- =========================================

-- Function to calculate commission for an order
CREATE OR REPLACE FUNCTION calculate_order_commission(
    p_tenant_id UUID,
    p_restaurant_id UUID,
    p_order_id UUID,
    p_gross_amount INTEGER,
    p_commission_rate DECIMAL DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_commission_id UUID;
    v_rate DECIMAL;
    v_commission_amount INTEGER;
    v_platform_fee INTEGER;
    v_net_amount INTEGER;
BEGIN
    -- Get commission rate (use parameter or restaurant default)
    IF p_commission_rate IS NOT NULL THEN
        v_rate := p_commission_rate;
    ELSE
        SELECT COALESCE(commission_rate, 15.0) INTO v_rate
        FROM restaurants 
        WHERE tenant_id = p_tenant_id AND id = p_restaurant_id;
        
        IF v_rate IS NULL THEN
            RAISE EXCEPTION 'Restaurant not found';
        END IF;
    END IF;

    -- Calculate amounts (platform fee is $0.30 = 30 cents)
    v_commission_amount := ROUND(p_gross_amount * (v_rate / 100));
    v_platform_fee := 30; -- 30 cents platform fee
    v_net_amount := p_gross_amount - v_commission_amount - v_platform_fee;

    -- Insert commission record
    INSERT INTO commissions (
        tenant_id, restaurant_id, order_id, transaction_type,
        gross_amount, commission_rate, commission_amount, platform_fee, net_amount,
        status, calculation_date, payment_due_date
    ) VALUES (
        p_tenant_id, p_restaurant_id, p_order_id, 'order_commission',
        p_gross_amount, v_rate, v_commission_amount, v_platform_fee, v_net_amount,
        'calculated', NOW(), NOW() + INTERVAL '7 days'
    ) RETURNING id INTO v_commission_id;

    RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- COMMENTS FOR DOCUMENTATION
-- =========================================

COMMENT ON TABLE commissions IS 'Tracks commission calculations for orders and adjustments with tenant isolation';
COMMENT ON COLUMN commissions.gross_amount IS 'Order total in cents (before commissions and fees)';
COMMENT ON COLUMN commissions.commission_rate IS 'Commission percentage (e.g., 15.5 for 15.5%)';
COMMENT ON COLUMN commissions.commission_amount IS 'Platform commission in cents';
COMMENT ON COLUMN commissions.platform_fee IS 'Additional platform fees in cents';
COMMENT ON COLUMN commissions.net_amount IS 'Amount due to restaurant in cents (can be negative for debits)';
COMMENT ON COLUMN commissions.payment_due_date IS 'When payment is due to restaurant';

COMMENT ON TABLE commission_payment_batches IS 'Groups commissions into payment batches for bulk payouts';
COMMENT ON TABLE commission_batch_items IS 'Links individual commissions to payment batches';

COMMENT ON VIEW commission_summary_by_restaurant IS 'Monthly commission summary aggregated by restaurant';
COMMENT ON VIEW daily_commission_summary IS 'Daily commission summary for tenant-wide reporting';
COMMENT ON VIEW outstanding_commission_payments IS 'Restaurants with pending commission payments';

COMMENT ON FUNCTION calculate_order_commission IS 'Calculates and creates commission record for an order';