-- Advanced Role-Based Access Control (RBAC) Database Schema
-- Creates tables for granular permission management

-- User permissions table for custom permission grants/revokes
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    permission VARCHAR(100) NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT true,
    granted_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, tenant_id, permission),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Role templates for easy permission management
CREATE TABLE IF NOT EXISTS role_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_system_default BOOLEAN DEFAULT false,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, name),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Audit log for permission changes
CREATE TABLE IF NOT EXISTS permission_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    permission VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'granted', 'revoked'
    performed_by UUID NOT NULL,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Security events log for monitoring
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'unauthorized_access', 'permission_check', 'role_change'
    user_id UUID,
    resource VARCHAR(100),
    permission VARCHAR(100),
    result VARCHAR(20), -- 'allowed', 'denied'
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_tenant ON user_permissions(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_role_templates_tenant ON role_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_user_tenant ON permission_audit_log(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_created ON permission_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_user_tenant ON security_events(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);

-- Row Level Security (RLS) policies
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for multi-tenant isolation
CREATE POLICY user_permissions_tenant_isolation ON user_permissions
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY role_templates_tenant_isolation ON role_templates
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY permission_audit_log_tenant_isolation ON permission_audit_log
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY security_events_tenant_isolation ON security_events
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_permissions TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON role_templates TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON permission_audit_log TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON security_events TO menuca_app;

-- Insert default role templates for common use cases
INSERT INTO role_templates (tenant_id, name, description, permissions, is_system_default, created_by)
SELECT 
    '00000000-0000-0000-0000-000000000000'::UUID as tenant_id,
    'Customer Support Agent' as name,
    'Standard permissions for customer support staff' as description,
    '["support:read", "support:manage", "order:read", "user:read"]'::JSONB as permissions,
    true as is_system_default,
    '00000000-0000-0000-0000-000000000000'::UUID as created_by
ON CONFLICT (tenant_id, name) DO NOTHING;

INSERT INTO role_templates (tenant_id, name, description, permissions, is_system_default, created_by)
SELECT 
    '00000000-0000-0000-0000-000000000000'::UUID as tenant_id,
    'Restaurant Manager' as name,
    'Full restaurant management permissions' as description,
    '["restaurant:manage_own", "order:manage_all", "analytics:read", "reports:generate", "campaign:read", "campaign:create"]'::JSONB as permissions,
    true as is_system_default,
    '00000000-0000-0000-0000-000000000000'::UUID as created_by
ON CONFLICT (tenant_id, name) DO NOTHING;

INSERT INTO role_templates (tenant_id, name, description, permissions, is_system_default, created_by)
SELECT 
    '00000000-0000-0000-0000-000000000000'::UUID as tenant_id,
    'Financial Analyst' as name,
    'Financial reporting and commission management' as description,
    '["finance:read", "commission:read", "reports:generate", "reports:export", "analytics:read"]'::JSONB as permissions,
    true as is_system_default,
    '00000000-0000-0000-0000-000000000000'::UUID as created_by
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_permissions_updated_at 
    BEFORE UPDATE ON user_permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_templates_updated_at 
    BEFORE UPDATE ON role_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();