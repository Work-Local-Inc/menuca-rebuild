# DBA05: Database Performance and Scalability Design

## Performance Architecture Overview

### Target Performance Metrics
- **Response Time**: <2 seconds for 95% of queries during peak load
- **Throughput**: 1,000+ transactions per second
- **Concurrent Users**: 10,000+ simultaneous active users
- **Scalability**: Support 1,000+ restaurant tenants
- **Availability**: 99.9% uptime (8.76 hours downtime/year)

## Query Optimization Strategy

### Index Design
```sql
-- Primary performance indexes
CREATE INDEX CONCURRENTLY idx_orders_tenant_status_date 
    ON orders(tenant_id, status, placed_at DESC) 
    WHERE status IN ('pending', 'confirmed', 'preparing');

CREATE INDEX CONCURRENTLY idx_menu_items_restaurant_available 
    ON menu_items(restaurant_id, status) 
    WHERE status = 'available';

CREATE INDEX CONCURRENTLY idx_commissions_restaurant_date 
    ON commissions(restaurant_id, calculated_at DESC) 
    WHERE status = 'calculated';

-- Composite indexes for dashboard queries
CREATE INDEX CONCURRENTLY idx_orders_analytics 
    ON orders(tenant_id, restaurant_id, DATE(placed_at), status)
    INCLUDE (total_amount, commission_amount);

-- Partial indexes for performance
CREATE INDEX CONCURRENTLY idx_users_active_email 
    ON users(tenant_id, email) 
    WHERE status = 'active';

-- JSON field indexes for configuration searches
CREATE INDEX CONCURRENTLY idx_restaurants_config_gin 
    ON restaurants USING GIN(configuration) 
    WHERE configuration IS NOT NULL;
```

### Query Pattern Optimization
```sql
-- Materialized view for real-time dashboard
CREATE MATERIALIZED VIEW restaurant_analytics AS
SELECT 
    r.tenant_id,
    r.id as restaurant_id,
    r.name as restaurant_name,
    COUNT(o.id) as total_orders,
    SUM(o.total_amount) as total_revenue,
    SUM(o.commission_amount) as total_commission,
    AVG(o.total_amount) as avg_order_value,
    DATE_TRUNC('day', o.placed_at) as order_date
FROM restaurants r
LEFT JOIN orders o ON r.id = o.restaurant_id 
    AND o.placed_at >= CURRENT_DATE - INTERVAL '30 days'
    AND o.status = 'delivered'
GROUP BY r.tenant_id, r.id, r.name, DATE_TRUNC('day', o.placed_at);

CREATE UNIQUE INDEX idx_restaurant_analytics_unique 
    ON restaurant_analytics(tenant_id, restaurant_id, order_date);

-- Refresh strategy
CREATE OR REPLACE FUNCTION refresh_restaurant_analytics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY restaurant_analytics;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every 15 minutes
SELECT cron.schedule('refresh-analytics', '*/15 * * * *', 'SELECT refresh_restaurant_analytics();');
```

## Caching Strategy

### Redis Cache Architecture
```javascript
// Multi-layer caching strategy
const cacheConfig = {
  // L1: Application memory cache (5 minutes)
  memory: {
    ttl: 300,
    maxKeys: 10000
  },
  
  // L2: Redis cache (1 hour)
  redis: {
    cluster: ['redis-1:6379', 'redis-2:6379', 'redis-3:6379'],
    ttl: 3600,
    keyPrefix: 'menuca:',
    strategies: {
      // Frequently accessed data
      menuItems: { ttl: 1800 }, // 30 minutes
      restaurants: { ttl: 3600 }, // 1 hour
      users: { ttl: 900 }, // 15 minutes
      
      // Real-time data
      orders: { ttl: 60 }, // 1 minute
      commissions: { ttl: 300 }, // 5 minutes
      
      // Session data
      sessions: { ttl: 900 }, // 15 minutes
      rateLimits: { ttl: 3600 } // 1 hour
    }
  }
};
```

### Cache Invalidation Strategy
```sql
-- Database trigger for cache invalidation
CREATE OR REPLACE FUNCTION invalidate_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify application to invalidate relevant caches
    PERFORM pg_notify(
        'cache_invalidation',
        json_build_object(
            'table', TG_TABLE_NAME,
            'tenant_id', COALESCE(NEW.tenant_id, OLD.tenant_id),
            'record_id', COALESCE(NEW.id, OLD.id),
            'action', TG_OP
        )::text
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to critical tables
CREATE TRIGGER cache_invalidation_menu_items
    AFTER INSERT OR UPDATE OR DELETE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION invalidate_cache();
```

## Database Scaling Strategy

### Read Replica Configuration
```sql
-- Read replica for analytics and reporting
-- Primary: All writes and real-time reads
-- Replica-1: Dashboard analytics queries  
-- Replica-2: Reporting and data exports

-- Connection routing based on query type
CREATE OR REPLACE FUNCTION route_query(query_type TEXT)
RETURNS TEXT AS $$
BEGIN
    CASE query_type
        WHEN 'write' THEN RETURN 'primary.menuca.db';
        WHEN 'analytics' THEN RETURN 'replica-1.menuca.db';
        WHEN 'reporting' THEN RETURN 'replica-2.menuca.db';
        ELSE RETURN 'primary.menuca.db';
    END CASE;
END;
$$ LANGUAGE plpgsql;
```

### Connection Pool Optimization
```javascript
// PgBouncer configuration for optimal performance
const poolConfig = {
  // Pool sizes per tenant weight
  maxConnections: {
    primary: 100,
    replica: 50
  },
  
  // Connection distribution
  pools: {
    // High-frequency operations
    orders: { size: 30, timeout: 2000 },
    payments: { size: 20, timeout: 5000 },
    
    // Medium-frequency operations  
    menu: { size: 15, timeout: 3000 },
    users: { size: 15, timeout: 3000 },
    
    // Low-frequency operations
    analytics: { size: 10, timeout: 10000 },
    reporting: { size: 10, timeout: 30000 }
  },
  
  // Health checks
  healthCheck: {
    interval: 30000, // 30 seconds
    timeout: 5000,   // 5 seconds
    retries: 3
  }
};
```

## Partitioning Strategy

### Time-based Partitioning
```sql
-- Partition audit_logs by month for performance
CREATE TABLE audit_logs_template (
    LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE audit_logs_2024_01 
    PARTITION OF audit_logs_template 
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Automated partition management
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name TEXT, start_date DATE)
RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    end_date DATE;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + INTERVAL '1 month';
    
    EXECUTE format('CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, end_date);
                   
    EXECUTE format('CREATE INDEX ON %I (tenant_id, created_at)', partition_name);
END;
$$ LANGUAGE plpgsql;
```

### Hash Partitioning for Large Tables
```sql
-- Partition orders by tenant_id hash for even distribution
CREATE TABLE orders_partitioned (
    LIKE orders INCLUDING ALL
) PARTITION BY HASH (tenant_id);

-- Create 16 hash partitions for load distribution
DO $$
BEGIN
    FOR i IN 0..15 LOOP
        EXECUTE format('CREATE TABLE orders_partition_%s PARTITION OF orders_partitioned 
                       FOR VALUES WITH (MODULUS 16, REMAINDER %s)', i, i);
    END LOOP;
END $$;
```

## Performance Monitoring

### Critical Metrics Collection
```sql
-- Performance monitoring view
CREATE VIEW performance_metrics AS
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins + n_tup_upd + n_tup_del as modifications,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;

-- Query performance tracking
CREATE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE mean_time > 1000  -- Queries taking more than 1 second
ORDER BY mean_time DESC;
```

### Automated Performance Alerts
```sql
-- Performance alert function
CREATE OR REPLACE FUNCTION check_performance_alerts()
RETURNS VOID AS $$
DECLARE
    slow_query_count INTEGER;
    high_cpu_usage NUMERIC;
    connection_usage NUMERIC;
BEGIN
    -- Check for slow queries
    SELECT COUNT(*) INTO slow_query_count
    FROM pg_stat_statements 
    WHERE mean_time > 2000 AND calls > 100;
    
    -- Alert if too many slow queries
    IF slow_query_count > 10 THEN
        PERFORM pg_notify('performance_alert', 
            json_build_object('type', 'slow_queries', 'count', slow_query_count)::text);
    END IF;
    
    -- Check connection usage
    SELECT (count(*) * 100.0 / current_setting('max_connections')::numeric) 
    INTO connection_usage
    FROM pg_stat_activity;
    
    IF connection_usage > 80 THEN
        PERFORM pg_notify('performance_alert',
            json_build_object('type', 'high_connections', 'usage', connection_usage)::text);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule performance checks every 5 minutes
SELECT cron.schedule('performance-check', '*/5 * * * *', 'SELECT check_performance_alerts();');
```

## Backup and Recovery Performance

### Optimized Backup Strategy
```bash
# High-performance backup configuration
pg_basebackup \
  --pgdata=/backup/base \
  --format=tar \
  --compress=9 \
  --checkpoint=fast \
  --progress \
  --max-rate=100M \
  --wal-method=stream

# Parallel WAL archiving
archive_command = 'test ! -f /backup/wal/%f && cp %p /backup/wal/%f'
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 32
```

### Recovery Time Optimization
- **Point-in-Time Recovery**: <15 minutes for last 24 hours
- **Full Recovery**: <4 hours for complete database
- **Partial Recovery**: <30 minutes for single tenant
- **Hot Standby**: <60 seconds failover time