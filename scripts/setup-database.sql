-- MenuCA Multi-tenant Database Setup
-- This script sets up the core database schema with Row Level Security

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'inactive');
CREATE TYPE user_role AS ENUM ('customer', 'staff', 'manager', 'admin', 'super_admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');

-- =========================================
-- CORE TABLES
-- =========================================

-- Tenants table (no RLS - system managed)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    configuration JSONB DEFAULT '{}',
    commission_rate DECIMAL(5,4) DEFAULT 0.0500, -- 5%
    status tenant_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table with RLS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'customer',
    status user_status DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- =========================================
-- ROW LEVEL SECURITY SETUP
-- =========================================

-- Enable RLS on tenant-specific tables (policies will be created after roles)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =========================================
-- UTILITY FUNCTIONS
-- =========================================

-- Function to get current tenant ID
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
    WHEN others THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON tenants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- ROLES AND PERMISSIONS
-- =========================================

-- Create application database roles
DO $$
BEGIN
    -- Create authenticated_users role first (needed for RLS policies)
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated_users') THEN
        CREATE ROLE authenticated_users;
    END IF;
    
    -- Create application roles
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'menuca_app') THEN
        CREATE ROLE menuca_app WITH LOGIN PASSWORD 'secure_app_password';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'menuca_readonly') THEN
        CREATE ROLE menuca_readonly WITH LOGIN PASSWORD 'secure_readonly_password';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'menuca_admin') THEN
        CREATE ROLE menuca_admin WITH LOGIN PASSWORD 'secure_admin_password';
    END IF;
END
$$;

-- Grant permissions to application role
GRANT USAGE ON SCHEMA public TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO menuca_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO menuca_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO menuca_app;
GRANT authenticated_users TO menuca_app;

-- Grant read-only permissions
GRANT USAGE ON SCHEMA public TO menuca_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO menuca_readonly;
GRANT authenticated_users TO menuca_readonly;

-- Grant admin permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO menuca_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO menuca_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO menuca_admin;

-- Now create RLS policies after roles are created
CREATE POLICY tenant_isolation_users ON users
    FOR ALL TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- =========================================
-- SAMPLE DATA FOR TESTING
-- =========================================

-- Insert default tenant for development
INSERT INTO tenants (id, name, domain, subdomain, status) 
VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID, 
    'Default Tenant', 
    'localhost', 
    'default', 
    'active'
) ON CONFLICT (domain) DO NOTHING;

-- Insert test user for development
DO $$
DECLARE
    default_tenant_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
BEGIN
    INSERT INTO users (
        tenant_id, 
        email, 
        password_hash, 
        first_name, 
        last_name, 
        role, 
        email_verified
    ) VALUES (
        default_tenant_id,
        'admin@menuca.local',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/vl5/WFUli', -- 'password123'
        'Admin',
        'User',
        'admin',
        true
    ) ON CONFLICT (tenant_id, email) DO NOTHING;
END
$$;

-- =========================================
-- MONITORING AND HEALTH CHECK VIEWS
-- =========================================

-- View for tenant statistics
CREATE OR REPLACE VIEW tenant_stats AS
SELECT 
    t.id,
    t.name,
    t.domain,
    t.status,
    COUNT(u.id) as user_count,
    COUNT(u.id) FILTER (WHERE u.status = 'active') as active_users,
    t.created_at
FROM tenants t
LEFT JOIN users u ON t.id = u.tenant_id
GROUP BY t.id, t.name, t.domain, t.status, t.created_at;

-- View for database health
CREATE OR REPLACE VIEW db_health AS
SELECT 
    'database' as component,
    pg_database_size(current_database()) as size_bytes,
    (SELECT count(*) FROM tenants) as tenant_count,
    (SELECT count(*) FROM users) as user_count,
    NOW() as checked_at;

-- =========================================
-- COMPLETION MESSAGE
-- =========================================

-- Log setup completion
DO $$
BEGIN
    RAISE NOTICE 'MenuCA database setup completed successfully!';
    RAISE NOTICE 'Default tenant ID: default';
    RAISE NOTICE 'Test admin user: admin@menuca.local (password: password123)';
    RAISE NOTICE 'Row Level Security is enabled for multi-tenant isolation';
END
$$;