# DBA04: Database Security Architecture

## Encryption Strategy

### Data at Rest
- **Database Level**: PostgreSQL Transparent Data Encryption (TDE)
- **File System**: Full disk encryption (LUKS/dm-crypt)
- **Sensitive Fields**: Application-level encryption for PII/PCI data
- **Key Management**: AWS KMS or HashiCorp Vault integration

### Data in Transit
- **Database Connections**: TLS 1.3 minimum, certificate pinning
- **API Communication**: HTTPS only with HSTS headers
- **Internal Services**: mTLS for service-to-service communication
- **Certificate Management**: Automated rotation every 90 days

## Access Control Architecture

### Database User Roles
```sql
-- Service account roles
CREATE ROLE app_read_only;
CREATE ROLE app_read_write;
CREATE ROLE app_admin;

-- Grant minimal permissions
GRANT SELECT ON ALL TABLES TO app_read_only;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES TO app_read_write;
GRANT ALL PRIVILEGES ON ALL TABLES TO app_admin;

-- No direct database access for application users
-- All access through application middleware with RLS
```

### Row Level Security Implementation
```sql
-- Function to get current tenant from JWT
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
    WHEN others THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies with audit logging
CREATE POLICY secure_tenant_access ON orders
    FOR ALL TO authenticated_users
    USING (
        tenant_id = get_current_tenant_id() AND
        audit_access('orders', id::text)
    );
```

## Authentication & Authorization

### JWT Token Management
- **Signing Algorithm**: RS256 with rotated private keys
- **Token Expiry**: 15 minutes access, 7 days refresh
- **Claims**: tenant_id, user_id, roles, permissions
- **Storage**: Redis with automatic expiry

### Session Management
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_accessed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);
```

## Audit and Compliance

### PCI DSS Compliance
- **Card Data**: Never stored in database
- **Tokenization**: Stripe tokens only
- **Audit Logging**: All payment-related operations
- **Access Monitoring**: Failed authentication attempts

### GDPR Compliance
```sql
-- Data retention policies
CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    retention_period INTERVAL NOT NULL,
    anonymization_fields JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Right to be forgotten implementation
CREATE OR REPLACE FUNCTION anonymize_user_data(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Anonymize personal data while preserving analytics
    UPDATE users SET 
        email = 'anonymized_' || id::text || '@deleted.local',
        first_name = 'DELETED',
        last_name = 'USER',
        phone = NULL
    WHERE id = user_uuid;
    
    -- Log the anonymization
    INSERT INTO audit_logs (user_id, table_name, action, new_values)
    VALUES (user_uuid, 'users', 'anonymize', '{"status": "anonymized"}'::jsonb);
END;
$$ LANGUAGE plpgsql;
```

### Comprehensive Audit Logging
```sql
-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        tenant_id,
        user_id,
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        current_setting('app.current_user_id', true)::UUID,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP::audit_action,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) END,
        current_setting('app.client_ip', true)::INET,
        current_setting('app.user_agent', true)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to all sensitive tables
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## Database Security Monitoring

### Real-time Alerts
- Failed authentication attempts (>5 in 5 minutes)
- Unusual query patterns or data access
- RLS policy violations
- Privilege escalation attempts
- Cross-tenant data access attempts

### Security Metrics
```sql
-- Security monitoring views
CREATE VIEW security_metrics AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) FILTER (WHERE action = 'login') as login_attempts,
    COUNT(*) FILTER (WHERE table_name = 'users' AND action = 'update') as profile_changes,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(DISTINCT tenant_id) as active_tenants
FROM audit_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at);
```

## Backup Security

### Encrypted Backups
- **Encryption**: AES-256 with separate backup keys
- **Storage**: AWS S3 with server-side encryption
- **Retention**: 30 days full backups, 1 year monthly archives
- **Access Control**: Separate IAM roles for backup operations

### Point-in-Time Recovery
- **WAL Archiving**: Continuous archiving with encryption
- **Recovery Testing**: Monthly automated recovery tests
- **Cross-Region Replication**: Disaster recovery backups

## Network Security

### Database Network Isolation
- **VPC**: Dedicated database subnets with no internet access
- **Security Groups**: Port 5432 only from application servers
- **VPN Access**: Bastion hosts for administrative access
- **IP Whitelisting**: Restricted administrative access

### Connection Security
```postgresql.conf
# PostgreSQL security configuration
ssl = on
ssl_ciphers = 'ECDHE+AESGCM:ECDHE+CHACHA20:ECDHE+AES256:ECDHE+AES128:!aNULL:!SHA1'
ssl_prefer_server_ciphers = on
ssl_min_protocol_version = 'TLSv1.3'

# Connection limits and timeouts
max_connections = 200
statement_timeout = 30000  # 30 seconds
idle_in_transaction_session_timeout = 300000  # 5 minutes

# Logging for security monitoring
log_connections = on
log_disconnections = on
log_statement = 'mod'  # Log all modifications
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```