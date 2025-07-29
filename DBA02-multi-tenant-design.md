# DBA02: Multi-Tenant Database Design

## Tenant Isolation Strategy: Shared Schema with Row Level Security (RLS)

### Architecture Decision
**Selected Approach**: Shared database, shared schema with PostgreSQL Row Level Security
**Rationale**:
- Cost-effective for 1000+ tenants
- Simplified maintenance and upgrades
- Strong isolation with PostgreSQL RLS
- Efficient resource utilization

### Tenant Identification
```sql
-- All tenant-specific tables include tenant_id
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    status tenant_status DEFAULT 'active'
);

-- Example RLS policy
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders
    FOR ALL TO authenticated_users
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### Tenant Routing Middleware
- Extract tenant from subdomain or API key
- Set `app.current_tenant_id` session variable
- Validate tenant access permissions
- Apply RLS policies automatically

### Data Isolation Guarantees
- **Physical Isolation**: None (shared infrastructure)
- **Logical Isolation**: PostgreSQL RLS policies
- **Application Isolation**: Middleware enforcement
- **Backup Isolation**: Per-tenant restore capabilities

### Tenant Provisioning Process
1. Create tenant record in `tenants` table
2. Initialize tenant-specific configuration
3. Set up default user roles and permissions
4. Create initial restaurant and menu data
5. Configure payment processing integration

## Security Measures
- All queries filtered by tenant_id automatically
- Cross-tenant queries impossible via RLS
- Tenant context validated on every request
- Audit logging per tenant
- Data encryption at rest and in transit