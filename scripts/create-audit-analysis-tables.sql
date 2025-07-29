-- Advanced Audit Analysis and Threat Detection Database Schema
-- Creates tables for intelligent security monitoring and compliance

-- Security threats table for storing detected threats
CREATE TABLE IF NOT EXISTS security_threats (
    id VARCHAR(100) PRIMARY KEY,
    tenant_id UUID NOT NULL,
    threat_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    user_id UUID,
    user_name VARCHAR(255),
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '[]',
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'investigating', 'resolved', 'false_positive'
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Analysis rules table for configurable threat detection
CREATE TABLE IF NOT EXISTS audit_analysis_rules (
    id VARCHAR(100) PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    threat_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    conditions JSONB NOT NULL DEFAULT '{}',
    threshold INTEGER DEFAULT 1,
    time_window INTEGER DEFAULT 60, -- minutes
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, name),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Compliance reports table
CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    report_type VARCHAR(20) NOT NULL, -- 'gdpr', 'pci_dss', 'sox', 'hipaa'
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_events INTEGER DEFAULT 0,
    risk_events INTEGER DEFAULT 0,
    compliance_score INTEGER DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100),
    findings JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    generated_by UUID NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Threat investigation log for tracking investigation progress
CREATE TABLE IF NOT EXISTS threat_investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    threat_id VARCHAR(100) NOT NULL,
    investigator_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'assigned', 'investigating', 'escalated', 'resolved'
    notes TEXT,
    evidence_collected JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    FOREIGN KEY (threat_id) REFERENCES security_threats(id) ON DELETE CASCADE,
    FOREIGN KEY (investigator_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Security metrics aggregation table for performance monitoring
CREATE TABLE IF NOT EXISTS security_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'threat_detection', 'compliance_score', 'response_time'
    metric_value DECIMAL(10,2) NOT NULL,
    aggregation_period VARCHAR(20) NOT NULL, -- 'hourly', 'daily', 'weekly', 'monthly'
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, metric_type, aggregation_period, period_start)
);

-- Automated alert configurations
CREATE TABLE IF NOT EXISTS security_alert_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_conditions JSONB NOT NULL,
    alert_channels JSONB DEFAULT '[]', -- email, slack, webhook, etc.
    enabled BOOLEAN DEFAULT true,
    severity_threshold VARCHAR(20) DEFAULT 'medium',
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, name),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Alert history table
CREATE TABLE IF NOT EXISTS security_alerts_sent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    alert_config_id UUID NOT NULL,
    threat_id VARCHAR(100),
    channel VARCHAR(50) NOT NULL, -- 'email', 'slack', 'webhook'
    recipient VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'bounced'
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    FOREIGN KEY (alert_config_id) REFERENCES security_alert_configs(id) ON DELETE CASCADE,
    FOREIGN KEY (threat_id) REFERENCES security_threats(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_threats_tenant_status ON security_threats(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_security_threats_detected_at ON security_threats(detected_at);
CREATE INDEX IF NOT EXISTS idx_security_threats_severity ON security_threats(severity);
CREATE INDEX IF NOT EXISTS idx_security_threats_threat_type ON security_threats(threat_type);
CREATE INDEX IF NOT EXISTS idx_security_threats_user_id ON security_threats(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_analysis_rules_tenant ON audit_analysis_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_analysis_rules_enabled ON audit_analysis_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_audit_analysis_rules_threat_type ON audit_analysis_rules(threat_type);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_tenant_type ON compliance_reports(tenant_id, report_type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_generated_at ON compliance_reports(generated_at);

CREATE INDEX IF NOT EXISTS idx_threat_investigations_threat ON threat_investigations(threat_id);
CREATE INDEX IF NOT EXISTS idx_threat_investigations_investigator ON threat_investigations(investigator_id);
CREATE INDEX IF NOT EXISTS idx_threat_investigations_created ON threat_investigations(created_at);

CREATE INDEX IF NOT EXISTS idx_security_metrics_tenant_type ON security_metrics(tenant_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_security_metrics_period ON security_metrics(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_security_alert_configs_tenant ON security_alert_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_alert_configs_enabled ON security_alert_configs(enabled);

CREATE INDEX IF NOT EXISTS idx_security_alerts_sent_config ON security_alerts_sent(alert_config_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_sent_threat ON security_alerts_sent(threat_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_sent_at ON security_alerts_sent(sent_at);

-- Row Level Security (RLS) policies
ALTER TABLE security_threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_analysis_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts_sent ENABLE ROW LEVEL SECURITY;

-- RLS policies for multi-tenant isolation
CREATE POLICY security_threats_tenant_isolation ON security_threats
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY audit_analysis_rules_tenant_isolation ON audit_analysis_rules
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY compliance_reports_tenant_isolation ON compliance_reports
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY threat_investigations_tenant_isolation ON threat_investigations
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY security_metrics_tenant_isolation ON security_metrics
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY security_alert_configs_tenant_isolation ON security_alert_configs
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY security_alerts_sent_tenant_isolation ON security_alerts_sent
    FOR ALL 
    USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON security_threats TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_analysis_rules TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON compliance_reports TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON threat_investigations TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON security_metrics TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON security_alert_configs TO menuca_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON security_alerts_sent TO menuca_app;

-- Insert default analysis rules
INSERT INTO audit_analysis_rules (id, tenant_id, name, description, threat_type, severity, conditions, threshold, time_window, created_by)
SELECT 
    'brute_force_detection' as id,
    '00000000-0000-0000-0000-000000000000'::UUID as tenant_id,
    'Brute Force Login Detection' as name,
    'Detects multiple failed login attempts from same IP' as description,
    'brute_force_login' as threat_type,
    'high' as severity,
    '{"event_type": "login_failed", "same_ip": true}'::JSONB as conditions,
    5 as threshold,
    15 as time_window,
    '00000000-0000-0000-0000-000000000000'::UUID as created_by
ON CONFLICT (tenant_id, name) DO NOTHING;

INSERT INTO audit_analysis_rules (id, tenant_id, name, description, threat_type, severity, conditions, threshold, time_window, created_by)
SELECT 
    'privilege_escalation' as id,
    '00000000-0000-0000-0000-000000000000'::UUID as tenant_id,
    'Privilege Escalation Attempt' as name,
    'Detects rapid permission grants to users' as description,
    'privilege_escalation' as threat_type,
    'critical' as severity,
    '{"permission_granted": true, "high_privilege": true}'::JSONB as conditions,
    3 as threshold,
    60 as time_window,
    '00000000-0000-0000-0000-000000000000'::UUID as created_by
ON CONFLICT (tenant_id, name) DO NOTHING;

INSERT INTO audit_analysis_rules (id, tenant_id, name, description, threat_type, severity, conditions, threshold, time_window, created_by)
SELECT 
    'off_hours_access' as id,
    '00000000-0000-0000-0000-000000000000'::UUID as tenant_id,
    'Off-Hours Access Detection' as name,
    'Detects access outside normal business hours' as description,
    'off_hours_access' as threat_type,
    'medium' as severity,
    '{"time_range": "off_hours", "admin_access": true}'::JSONB as conditions,
    1 as threshold,
    60 as time_window,
    '00000000-0000-0000-0000-000000000000'::UUID as created_by
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_security_threats_updated_at 
    BEFORE UPDATE ON security_threats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_analysis_rules_updated_at 
    BEFORE UPDATE ON audit_analysis_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_alert_configs_updated_at 
    BEFORE UPDATE ON security_alert_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();