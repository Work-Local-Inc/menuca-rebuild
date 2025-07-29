-- Payment Schema Extension for MenuCA
-- Adds tables for payment processing, payment methods, and refunds

-- =========================================
-- PAYMENT INTENTS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    stripe_payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
    amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in cents
    currency VARCHAR(3) NOT NULL DEFAULT 'usd',
    status VARCHAR(50) NOT NULL DEFAULT 'requires_payment_method',
    client_secret VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payment_intents
CREATE INDEX IF NOT EXISTS idx_payment_intents_tenant_user ON payment_intents(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_order ON payment_intents(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_stripe_id ON payment_intents(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_created_at ON payment_intents(created_at);

-- =========================================
-- PAYMENT METHODS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- card, bank_account, etc.
    card_last4 VARCHAR(4),
    card_brand VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant_user ON payment_methods(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(tenant_id, user_id, is_default) WHERE is_default = TRUE;

-- =========================================
-- REFUNDS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payment_intent_id UUID NOT NULL REFERENCES payment_intents(id) ON DELETE CASCADE,
    stripe_refund_id VARCHAR(255) NOT NULL UNIQUE,
    amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in cents
    currency VARCHAR(3) NOT NULL DEFAULT 'usd',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    reason VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for refunds
CREATE INDEX IF NOT EXISTS idx_refunds_tenant ON refunds(tenant_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_intent ON refunds(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_refunds_stripe_id ON refunds(stripe_refund_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- =========================================
-- CART ITEMS TABLE (if not exists from Phase 1)
-- =========================================
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for cart_items
CREATE INDEX IF NOT EXISTS idx_cart_items_tenant_user ON cart_items(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_restaurant ON cart_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_menu_item ON cart_items(menu_item_id);

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- Enable RLS on payment tables
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Payment Intents RLS Policies
CREATE POLICY payment_intents_tenant_isolation ON payment_intents
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Payment Methods RLS Policies  
CREATE POLICY payment_methods_tenant_isolation ON payment_methods
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Refunds RLS Policies
CREATE POLICY refunds_tenant_isolation ON refunds
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Cart Items RLS Policies
CREATE POLICY cart_items_tenant_isolation ON cart_items
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- =========================================
-- UPDATED_AT TRIGGERS
-- =========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for payment tables
CREATE TRIGGER update_payment_intents_updated_at 
    BEFORE UPDATE ON payment_intents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at 
    BEFORE UPDATE ON refunds 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at 
    BEFORE UPDATE ON cart_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- CONSTRAINTS & VALIDATIONS
-- =========================================

-- Ensure only one default payment method per user per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_methods_unique_default 
    ON payment_methods(tenant_id, user_id) 
    WHERE is_default = TRUE;

-- Validate payment intent status values
ALTER TABLE payment_intents ADD CONSTRAINT chk_payment_intent_status 
    CHECK (status IN (
        'requires_payment_method', 
        'requires_confirmation', 
        'requires_action', 
        'processing', 
        'requires_capture', 
        'canceled', 
        'succeeded'
    ));

-- Validate refund status values
ALTER TABLE refunds ADD CONSTRAINT chk_refund_status 
    CHECK (status IN (
        'pending', 
        'succeeded', 
        'failed', 
        'canceled', 
        'requires_action'
    ));

-- Validate currency codes (ISO 4217)
ALTER TABLE payment_intents ADD CONSTRAINT chk_payment_intent_currency 
    CHECK (currency ~ '^[A-Z]{3}$');

ALTER TABLE refunds ADD CONSTRAINT chk_refund_currency 
    CHECK (currency ~ '^[A-Z]{3}$');

-- =========================================
-- COMMENTS FOR DOCUMENTATION
-- =========================================

COMMENT ON TABLE payment_intents IS 'Stores Stripe payment intents with tenant isolation';
COMMENT ON COLUMN payment_intents.amount IS 'Payment amount in cents (to avoid floating point issues)';
COMMENT ON COLUMN payment_intents.metadata IS 'Additional metadata stored as JSONB for flexibility';

COMMENT ON TABLE payment_methods IS 'Stores user payment methods (cards, bank accounts) linked to Stripe';
COMMENT ON COLUMN payment_methods.is_default IS 'Only one payment method can be default per user per tenant';

COMMENT ON TABLE refunds IS 'Tracks refund requests and their status with Stripe';
COMMENT ON TABLE cart_items IS 'Database backup for Redis-based shopping carts';