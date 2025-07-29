# DBA06: Data Management and Operations

## Backup and Disaster Recovery

### Backup Strategy
```bash
# Automated backup configuration
#!/bin/bash
# /scripts/backup-database.sh

BACKUP_DIR="/backup/menuca"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# Full database backup with compression
pg_dump \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --format=custom \
  --compress=9 \
  --create \
  --clean \
  --if-exists \
  --verbose \
  --file="$BACKUP_DIR/menuca_full_$DATE.dump" \
  menuca_production

# Per-tenant backup capability
pg_dump \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --format=custom \
  --compress=9 \
  --where="tenant_id='$TENANT_ID'" \
  --table=users \
  --table=restaurants \
  --table=menu_items \
  --table=orders \
  --table=payments \
  --file="$BACKUP_DIR/tenant_${TENANT_ID}_$DATE.dump" \
  menuca_production

# Upload to S3 with encryption
aws s3 cp "$BACKUP_DIR/menuca_full_$DATE.dump" \
  s3://menuca-backups/daily/ \
  --sse AES256 \
  --storage-class STANDARD_IA

# Cleanup old local backups
find $BACKUP_DIR -name "*.dump" -mtime +$RETENTION_DAYS -delete
```

### Disaster Recovery Plan
```sql
-- Recovery procedures and validation
CREATE OR REPLACE FUNCTION validate_backup_integrity(backup_file TEXT)
RETURNS BOOLEAN AS $$
DECLARE 
    record_count INTEGER;
    tenant_count INTEGER;
BEGIN
    -- Restore to temporary database for validation
    PERFORM pg_restore(backup_file, 'menuca_test_restore');
    
    -- Validate data integrity
    SELECT COUNT(*) INTO record_count FROM menuca_test_restore.orders;
    SELECT COUNT(DISTINCT tenant_id) INTO tenant_count FROM menuca_test_restore.tenants;
    
    -- Cleanup test database
    DROP DATABASE menuca_test_restore;
    
    RETURN record_count > 0 AND tenant_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Automated recovery testing
CREATE TABLE recovery_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_file TEXT NOT NULL,
    test_date TIMESTAMP DEFAULT NOW(),
    success BOOLEAN,
    restore_time_seconds INTEGER,
    validation_results JSONB
);
```

## Data Retention and Archival

### Retention Policy Configuration
```sql
-- Data retention policies table
CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    retention_period INTERVAL NOT NULL,
    archive_after INTERVAL,
    anonymize_after INTERVAL,
    deletion_criteria JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert retention policies
INSERT INTO data_retention_policies (table_name, retention_period, archive_after, anonymize_after) VALUES
('audit_logs', '7 years', '2 years', NULL),
('orders', '7 years', '3 years', NULL),
('payments', '7 years', '3 years', NULL),
('user_sessions', '30 days', NULL, NULL),
('users', '7 years', '3 years', '2 years'); -- GDPR compliance

-- Automated data archival
CREATE OR REPLACE FUNCTION archive_old_data()
RETURNS VOID AS $$
DECLARE
    policy RECORD;
    archive_date TIMESTAMP;
    affected_rows INTEGER;
BEGIN
    -- Process each retention policy
    FOR policy IN SELECT * FROM data_retention_policies WHERE archive_after IS NOT NULL LOOP
        archive_date := NOW() - policy.archive_after;
        
        -- Move old data to archive tables
        EXECUTE format('
            WITH archived AS (
                DELETE FROM %I 
                WHERE created_at < %L 
                RETURNING *
            )
            INSERT INTO %I_archive SELECT * FROM archived',
            policy.table_name, archive_date, policy.table_name);
            
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        
        -- Log archival operation
        INSERT INTO audit_logs (table_name, action, new_values)
        VALUES (policy.table_name, 'archive', 
                json_build_object('archived_rows', affected_rows, 'archive_date', archive_date));
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly archival
SELECT cron.schedule('data-archival', '0 2 1 * *', 'SELECT archive_old_data();');
```

### GDPR Compliance and Data Anonymization
```sql
-- User data anonymization for GDPR compliance
CREATE OR REPLACE FUNCTION anonymize_user_data(user_uuid UUID, anonymization_reason TEXT DEFAULT 'gdpr_request')
RETURNS JSONB AS $$
DECLARE
    anonymization_map JSONB;
    affected_tables TEXT[] := ARRAY['users', 'orders', 'payments', 'audit_logs'];
    table_name TEXT;
    update_count INTEGER := 0;
BEGIN
    -- Generate anonymization mapping
    anonymization_map := json_build_object(
        'original_id', user_uuid,
        'anonymized_email', 'deleted_' || extract(epoch from now())::bigint || '@anonymized.local',
        'anonymized_name', 'DELETED USER',
        'anonymized_phone', NULL,
        'anonymization_date', NOW(),
        'reason', anonymization_reason
    );
    
    -- Anonymize user record
    UPDATE users SET 
        email = anonymization_map->>'anonymized_email',
        first_name = 'DELETED',
        last_name = 'USER',
        phone = NULL,
        status = 'inactive'
    WHERE id = user_uuid;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    -- Update anonymization map with affected rows
    anonymization_map := anonymization_map || json_build_object('users_updated', update_count);
    
    -- Log anonymization in audit trail
    INSERT INTO audit_logs (user_id, table_name, action, new_values)
    VALUES (user_uuid, 'users', 'anonymize', anonymization_map);
    
    -- Mark user as anonymized
    INSERT INTO anonymized_users (user_id, anonymization_date, anonymization_data)
    VALUES (user_uuid, NOW(), anonymization_map);
    
    RETURN anonymization_map;
END;
$$ LANGUAGE plpgsql;

-- Track anonymized users
CREATE TABLE anonymized_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    anonymization_date TIMESTAMP NOT NULL DEFAULT NOW(),
    anonymization_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Database Monitoring and Alerting

### Health Monitoring Dashboard
```sql
-- Database health metrics view
CREATE VIEW database_health_metrics AS
SELECT 
    'connection_utilization' as metric_name,
    (COUNT(*) * 100.0 / current_setting('max_connections')::numeric) as metric_value,
    CASE 
        WHEN (COUNT(*) * 100.0 / current_setting('max_connections')::numeric) > 80 THEN 'critical'
        WHEN (COUNT(*) * 100.0 / current_setting('max_connections')::numeric) > 60 THEN 'warning'
        ELSE 'ok'
    END as status,
    NOW() as measured_at
FROM pg_stat_activity
WHERE state = 'active'

UNION ALL

SELECT 
    'database_size_gb' as metric_name,
    pg_database_size(current_database()) / 1024.0^3 as metric_value,
    CASE 
        WHEN pg_database_size(current_database()) / 1024.0^3 > 500 THEN 'warning'
        ELSE 'ok'
    END as status,
    NOW() as measured_at

UNION ALL

SELECT 
    'replication_lag_seconds' as metric_name,
    COALESCE(EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp())), 0) as metric_value,
    CASE 
        WHEN EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp())) > 300 THEN 'critical'
        WHEN EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp())) > 60 THEN 'warning'
        ELSE 'ok'
    END as status,
    NOW() as measured_at;

-- Performance monitoring view
CREATE VIEW query_performance_summary AS
SELECT 
    LEFT(query, 100) as query_snippet,
    calls,
    total_time,
    mean_time,
    max_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS cache_hit_ratio
FROM pg_stat_statements 
WHERE calls > 100
ORDER BY mean_time DESC
LIMIT 20;
```

### Automated Alert System
```sql
-- Alert configuration table
CREATE TABLE monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_name VARCHAR(100) NOT NULL,
    metric_query TEXT NOT NULL,
    threshold_value NUMERIC NOT NULL,
    comparison_operator VARCHAR(10) NOT NULL, -- '>', '<', '=', '>=', '<='
    alert_level alert_level NOT NULL,
    notification_channels JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE alert_level AS ENUM ('info', 'warning', 'critical');

-- Alert processing function
CREATE OR REPLACE FUNCTION process_monitoring_alerts()
RETURNS VOID AS $$
DECLARE
    alert_config RECORD;
    metric_value NUMERIC;
    should_alert BOOLEAN := FALSE;
BEGIN
    FOR alert_config IN SELECT * FROM monitoring_alerts WHERE is_active = TRUE LOOP
        -- Execute metric query
        EXECUTE alert_config.metric_query INTO metric_value;
        
        -- Check threshold
        EXECUTE format('SELECT %s %s %s', 
                      metric_value, 
                      alert_config.comparison_operator, 
                      alert_config.threshold_value) 
        INTO should_alert;
        
        -- Send alert if threshold exceeded
        IF should_alert THEN
            PERFORM pg_notify('database_alert', 
                json_build_object(
                    'alert_name', alert_config.alert_name,
                    'level', alert_config.alert_level,
                    'metric_value', metric_value,
                    'threshold', alert_config.threshold_value,
                    'timestamp', NOW()
                )::text);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule alert checks every 5 minutes
SELECT cron.schedule('monitoring-alerts', '*/5 * * * *', 'SELECT process_monitoring_alerts();');

-- Insert common alerts
INSERT INTO monitoring_alerts (alert_name, metric_query, threshold_value, comparison_operator, alert_level) VALUES
('High Connection Usage', 'SELECT COUNT(*) * 100.0 / current_setting(''max_connections'')::numeric FROM pg_stat_activity WHERE state = ''active''', 80, '>', 'warning'),
('Replication Lag', 'SELECT COALESCE(EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp())), 0)', 300, '>', 'critical'),
('Slow Query Alert', 'SELECT COUNT(*) FROM pg_stat_statements WHERE mean_time > 5000 AND calls > 10', 5, '>', 'warning'),
('Database Size Alert', 'SELECT pg_database_size(current_database()) / 1024.0^3', 800, '>', 'warning');
```

## Database Maintenance Operations

### Automated Maintenance Tasks
```sql
-- Maintenance task scheduler
CREATE TABLE maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_name VARCHAR(100) NOT NULL,
    task_query TEXT NOT NULL,
    schedule_pattern VARCHAR(100) NOT NULL, -- Cron pattern
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    timeout_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance execution function
CREATE OR REPLACE FUNCTION execute_maintenance_task(task_id UUID)
RETURNS JSONB AS $$
DECLARE
    task RECORD;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    result JSONB;
BEGIN
    SELECT * INTO task FROM maintenance_tasks WHERE id = task_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Task not found');
    END IF;
    
    start_time := NOW();
    
    BEGIN
        -- Execute maintenance task with timeout
        SET statement_timeout = task.timeout_minutes * 60 * 1000;
        EXECUTE task.task_query;
        
        end_time := NOW();
        
        -- Update task record
        UPDATE maintenance_tasks 
        SET last_run = start_time,
            next_run = start_time + (schedule_pattern || ' seconds')::INTERVAL
        WHERE id = task_id;
        
        result := json_build_object(
            'success', true,
            'start_time', start_time,
            'end_time', end_time,
            'duration_seconds', EXTRACT(EPOCH FROM (end_time - start_time))
        );
        
    EXCEPTION WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'start_time', start_time,
            'end_time', NOW()
        );
    END;
    
    -- Log maintenance execution
    INSERT INTO maintenance_log (task_id, execution_result, executed_at)
    VALUES (task_id, result, start_time);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Maintenance execution log
CREATE TABLE maintenance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES maintenance_tasks(id),
    execution_result JSONB,
    executed_at TIMESTAMP DEFAULT NOW()
);

-- Insert common maintenance tasks
INSERT INTO maintenance_tasks (task_name, task_query, schedule_pattern) VALUES
('Vacuum Analyze', 'VACUUM ANALYZE;', '0 2 * * 0'), -- Weekly Sunday 2 AM
('Reindex Orders', 'REINDEX TABLE orders;', '0 3 1 * *'), -- Monthly 1st day 3 AM
('Update Statistics', 'ANALYZE;', '0 1 * * *'), -- Daily 1 AM
('Cleanup Old Sessions', 'DELETE FROM user_sessions WHERE expires_at < NOW();', '*/30 * * * *'); -- Every 30 minutes
```

### Database Migration Management
```sql
-- Migration tracking
CREATE TABLE schema_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    migration_sql TEXT NOT NULL,
    rollback_sql TEXT,
    applied_at TIMESTAMP DEFAULT NOW(),
    applied_by VARCHAR(100) DEFAULT current_user,
    execution_time_ms INTEGER
);

-- Migration execution function
CREATE OR REPLACE FUNCTION apply_migration(
    migration_version VARCHAR(50),
    migration_description TEXT,
    migration_sql TEXT,
    rollback_sql TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    execution_time INTEGER;
    result JSONB;
BEGIN
    -- Check if migration already applied
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = migration_version) THEN
        RETURN json_build_object('success', false, 'error', 'Migration already applied');
    END IF;
    
    start_time := clock_timestamp();
    
    BEGIN
        -- Execute migration in transaction
        EXECUTE migration_sql;
        
        end_time := clock_timestamp();
        execution_time := EXTRACT(MILLISECONDS FROM (end_time - start_time));
        
        -- Record successful migration
        INSERT INTO schema_migrations (version, description, migration_sql, rollback_sql, execution_time_ms)
        VALUES (migration_version, migration_description, migration_sql, rollback_sql, execution_time);
        
        result := json_build_object(
            'success', true,
            'version', migration_version,
            'execution_time_ms', execution_time
        );
        
    EXCEPTION WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'version', migration_version,
            'error', SQLERRM
        );
        
        -- Rollback is automatic due to transaction
        RAISE;
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
```