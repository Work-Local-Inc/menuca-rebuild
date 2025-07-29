/**
 * Advanced Audit Trail Analysis Service
 * Provides intelligent threat detection and compliance monitoring
 */
import db from '@/database/connection';
import redis from '@/cache/redis';
import winston from 'winston';
import { Pool } from 'pg';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

export interface SecurityThreat {
  id: string;
  tenantId: string;
  threatType: ThreatType;
  severity: ThreatSeverity;
  userId?: string;
  userName?: string;
  description: string;
  evidence: any[];
  riskScore: number;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  detectedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  notes?: string;
}

export enum ThreatType {
  BRUTE_FORCE_LOGIN = 'brute_force_login',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  UNUSUAL_ACCESS_PATTERN = 'unusual_access_pattern',
  SUSPICIOUS_PERMISSION_CHANGE = 'suspicious_permission_change',
  MASS_DATA_ACCESS = 'mass_data_access',
  OFF_HOURS_ACCESS = 'off_hours_access',
  GEOGRAPHIC_ANOMALY = 'geographic_anomaly',
  RAPID_PERMISSION_REQUESTS = 'rapid_permission_requests',
  FAILED_AUTHORIZATION_SPIKE = 'failed_authorization_spike',
  ADMIN_IMPERSONATION = 'admin_impersonation'
}

export enum ThreatSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AuditAnalysisRule {
  id: string;
  name: string;
  description: string;
  threatType: ThreatType;
  severity: ThreatSeverity;
  enabled: boolean;
  conditions: any;
  threshold: number;
  timeWindow: number; // minutes
}

export interface ComplianceReport {
  tenantId: string;
  reportType: 'gdpr' | 'pci_dss' | 'sox' | 'hipaa';
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  totalEvents: number;
  riskEvents: number;
  complianceScore: number;
  findings: ComplianceFinding[];
  recommendations: string[];
}

export interface ComplianceFinding {
  category: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  count: number;
  examples: string[];
  recommendation: string;
}

export class AuditAnalysisService {
  private pool: Pool;
  private readonly CACHE_PREFIX = 'audit_analysis:';
  private readonly CACHE_TTL = 300; // 5 minutes

  // Default analysis rules
  private readonly DEFAULT_RULES: AuditAnalysisRule[] = [
    {
      id: 'brute_force_detection',
      name: 'Brute Force Login Detection',
      description: 'Detects multiple failed login attempts from same IP',
      threatType: ThreatType.BRUTE_FORCE_LOGIN,
      severity: ThreatSeverity.HIGH,
      enabled: true,
      conditions: { event_type: 'login_failed', same_ip: true },
      threshold: 5,
      timeWindow: 15
    },
    {
      id: 'privilege_escalation',
      name: 'Privilege Escalation Attempt',
      description: 'Detects rapid permission grants to users',
      threatType: ThreatType.PRIVILEGE_ESCALATION,
      severity: ThreatSeverity.CRITICAL,
      enabled: true,
      conditions: { permission_granted: true, high_privilege: true },
      threshold: 3,
      timeWindow: 60
    },
    {
      id: 'mass_data_access',
      name: 'Mass Data Access Pattern',
      description: 'Detects unusually high data access volume',
      threatType: ThreatType.MASS_DATA_ACCESS,
      severity: ThreatSeverity.MEDIUM,
      enabled: true,
      conditions: { resource_access: true, high_volume: true },
      threshold: 100,
      timeWindow: 60
    },
    {
      id: 'off_hours_access',
      name: 'Off-Hours Access Detection',
      description: 'Detects access outside normal business hours',
      threatType: ThreatType.OFF_HOURS_ACCESS,
      severity: ThreatSeverity.MEDIUM,
      enabled: true,
      conditions: { time_range: 'off_hours', admin_access: true },
      threshold: 1,
      timeWindow: 60
    },
    {
      id: 'rapid_permission_requests',
      name: 'Rapid Permission Request Pattern',
      description: 'Detects rapid succession of permission requests',
      threatType: ThreatType.RAPID_PERMISSION_REQUESTS,
      severity: ThreatSeverity.MEDIUM,
      enabled: true,
      conditions: { permission_check: 'denied', rapid_succession: true },
      threshold: 10,
      timeWindow: 5
    }
  ];

  constructor() {
    this.pool = db.getPool();
  }

  /**
   * Analyze security events for potential threats
   */
  async analyzeSecurityEvents(tenantId: string, timeWindow: number = 60): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];
    
    for (const rule of this.DEFAULT_RULES) {
      if (!rule.enabled) continue;
      
      const ruleThreats = await this.applyAnalysisRule(tenantId, rule, timeWindow);
      threats.push(...ruleThreats);
    }
    
    // Store detected threats
    for (const threat of threats) {
      await this.storeThreat(threat);
    }
    
    return threats;
  }

  /**
   * Apply a specific analysis rule
   */
  private async applyAnalysisRule(
    tenantId: string, 
    rule: AuditAnalysisRule,
    timeWindow: number
  ): Promise<SecurityThreat[]> {
    const client = await this.pool.connect();
    const threats: SecurityThreat[] = [];
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const startTime = new Date(Date.now() - timeWindow * 60 * 1000);
      
      switch (rule.threatType) {
        case ThreatType.BRUTE_FORCE_LOGIN:
          const bruteForceThreats = await this.detectBruteForce(client, tenantId, rule, startTime);
          threats.push(...bruteForceThreats);
          break;
          
        case ThreatType.PRIVILEGE_ESCALATION:
          const escalationThreats = await this.detectPrivilegeEscalation(client, tenantId, rule, startTime);
          threats.push(...escalationThreats);
          break;
          
        case ThreatType.MASS_DATA_ACCESS:
          const massAccessThreats = await this.detectMassDataAccess(client, tenantId, rule, startTime);
          threats.push(...massAccessThreats);
          break;
          
        case ThreatType.OFF_HOURS_ACCESS:
          const offHoursThreats = await this.detectOffHoursAccess(client, tenantId, rule, startTime);
          threats.push(...offHoursThreats);
          break;
          
        case ThreatType.RAPID_PERMISSION_REQUESTS:
          const rapidRequestThreats = await this.detectRapidPermissionRequests(client, tenantId, rule, startTime);
          threats.push(...rapidRequestThreats);
          break;
      }
      
    } finally {
      client.release();
    }
    
    return threats;
  }

  /**
   * Detect brute force login attempts
   */
  private async detectBruteForce(
    client: any,
    tenantId: string,
    rule: AuditAnalysisRule,
    startTime: Date
  ): Promise<SecurityThreat[]> {
    const result = await client.query(`
      SELECT ip_address, COUNT(*) as attempt_count, array_agg(user_id) as user_ids
      FROM security_events 
      WHERE tenant_id = $1 
        AND event_type = 'login_failed'
        AND created_at >= $2
        AND ip_address IS NOT NULL
      GROUP BY ip_address
      HAVING COUNT(*) >= $3
    `, [tenantId, startTime, rule.threshold]);

    const threats: SecurityThreat[] = [];
    
    for (const row of result.rows) {
      threats.push({
        id: `bf_${tenantId}_${row.ip_address}_${Date.now()}`,
        tenantId,
        threatType: ThreatType.BRUTE_FORCE_LOGIN,
        severity: rule.severity,
        description: `Brute force login detected from IP ${row.ip_address} with ${row.attempt_count} failed attempts`,
        evidence: [
          { type: 'ip_address', value: row.ip_address },
          { type: 'attempt_count', value: row.attempt_count },
          { type: 'user_ids', value: row.user_ids }
        ],
        riskScore: this.calculateRiskScore(rule.severity, row.attempt_count / rule.threshold),
        status: 'active',
        detectedAt: new Date()
      });
    }
    
    return threats;
  }

  /**
   * Detect privilege escalation attempts
   */
  private async detectPrivilegeEscalation(
    client: any,
    tenantId: string,
    rule: AuditAnalysisRule,
    startTime: Date
  ): Promise<SecurityThreat[]> {
    const result = await client.query(`
      SELECT user_id, COUNT(*) as grant_count, array_agg(permission) as permissions
      FROM permission_audit_log 
      WHERE tenant_id = $1 
        AND action = 'granted'
        AND created_at >= $2
        AND permission LIKE ANY(ARRAY['%admin%', '%manage%', '%delete%', '%security%'])
      GROUP BY user_id
      HAVING COUNT(*) >= $3
    `, [tenantId, startTime, rule.threshold]);

    const threats: SecurityThreat[] = [];
    
    for (const row of result.rows) {
      // Get user name
      const userResult = await client.query(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [row.user_id]
      );
      
      const userName = userResult.rows[0] ? 
        `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}` : 
        'Unknown User';

      threats.push({
        id: `pe_${tenantId}_${row.user_id}_${Date.now()}`,
        tenantId,
        threatType: ThreatType.PRIVILEGE_ESCALATION,
        severity: rule.severity,
        userId: row.user_id,
        userName,
        description: `Potential privilege escalation detected for user ${userName} with ${row.grant_count} high-privilege permissions granted`,
        evidence: [
          { type: 'user_id', value: row.user_id },
          { type: 'grant_count', value: row.grant_count },
          { type: 'permissions', value: row.permissions }
        ],
        riskScore: this.calculateRiskScore(rule.severity, row.grant_count / rule.threshold),
        status: 'active',
        detectedAt: new Date()
      });
    }
    
    return threats;
  }

  /**
   * Detect mass data access patterns
   */
  private async detectMassDataAccess(
    client: any,
    tenantId: string,
    rule: AuditAnalysisRule,
    startTime: Date
  ): Promise<SecurityThreat[]> {
    const result = await client.query(`
      SELECT user_id, COUNT(*) as access_count, array_agg(DISTINCT resource) as resources
      FROM security_events 
      WHERE tenant_id = $1 
        AND event_type = 'resource_access'
        AND result = 'allowed'
        AND created_at >= $2
      GROUP BY user_id
      HAVING COUNT(*) >= $3
    `, [tenantId, startTime, rule.threshold]);

    const threats: SecurityThreat[] = [];
    
    for (const row of result.rows) {
      // Get user name
      const userResult = await client.query(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [row.user_id]
      );
      
      const userName = userResult.rows[0] ? 
        `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}` : 
        'Unknown User';

      threats.push({
        id: `mda_${tenantId}_${row.user_id}_${Date.now()}`,
        tenantId,
        threatType: ThreatType.MASS_DATA_ACCESS,
        severity: rule.severity,
        userId: row.user_id,
        userName,
        description: `Mass data access detected for user ${userName} with ${row.access_count} resource accesses`,
        evidence: [
          { type: 'user_id', value: row.user_id },
          { type: 'access_count', value: row.access_count },
          { type: 'resources', value: row.resources }
        ],
        riskScore: this.calculateRiskScore(rule.severity, row.access_count / rule.threshold),
        status: 'active',
        detectedAt: new Date()
      });
    }
    
    return threats;
  }

  /**
   * Detect off-hours access
   */
  private async detectOffHoursAccess(
    client: any,
    tenantId: string,
    rule: AuditAnalysisRule,
    startTime: Date
  ): Promise<SecurityThreat[]> {
    const result = await client.query(`
      SELECT user_id, COUNT(*) as access_count, array_agg(resource) as resources
      FROM security_events 
      WHERE tenant_id = $1 
        AND created_at >= $2
        AND (
          EXTRACT(hour FROM created_at) < 6 OR 
          EXTRACT(hour FROM created_at) > 22 OR
          EXTRACT(dow FROM created_at) IN (0, 6)  -- Weekend
        )
        AND (permission LIKE '%admin%' OR permission LIKE '%manage%')
      GROUP BY user_id
      HAVING COUNT(*) >= $3
    `, [tenantId, startTime, rule.threshold]);

    const threats: SecurityThreat[] = [];
    
    for (const row of result.rows) {
      // Get user name
      const userResult = await client.query(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [row.user_id]
      );
      
      const userName = userResult.rows[0] ? 
        `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}` : 
        'Unknown User';

      threats.push({
        id: `oha_${tenantId}_${row.user_id}_${Date.now()}`,
        tenantId,
        threatType: ThreatType.OFF_HOURS_ACCESS,
        severity: rule.severity,
        userId: row.user_id,
        userName,
        description: `Off-hours administrative access detected for user ${userName}`,
        evidence: [
          { type: 'user_id', value: row.user_id },
          { type: 'access_count', value: row.access_count },
          { type: 'resources', value: row.resources },
          { type: 'time_pattern', value: 'off_hours' }
        ],
        riskScore: this.calculateRiskScore(rule.severity, 1),
        status: 'active',
        detectedAt: new Date()
      });
    }
    
    return threats;
  }

  /**
   * Detect rapid permission requests
   */
  private async detectRapidPermissionRequests(
    client: any,
    tenantId: string,
    rule: AuditAnalysisRule,
    startTime: Date
  ): Promise<SecurityThreat[]> {
    const result = await client.query(`
      SELECT user_id, COUNT(*) as request_count, array_agg(permission) as permissions
      FROM security_events 
      WHERE tenant_id = $1 
        AND event_type = 'permission_check'
        AND result = 'denied'
        AND created_at >= $2
      GROUP BY user_id
      HAVING COUNT(*) >= $3
    `, [tenantId, startTime, rule.threshold]);

    const threats: SecurityThreat[] = [];
    
    for (const row of result.rows) {
      // Get user name
      const userResult = await client.query(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [row.user_id]
      );
      
      const userName = userResult.rows[0] ? 
        `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}` : 
        'Unknown User';

      threats.push({
        id: `rpr_${tenantId}_${row.user_id}_${Date.now()}`,
        tenantId,
        threatType: ThreatType.RAPID_PERMISSION_REQUESTS,
        severity: rule.severity,
        userId: row.user_id,
        userName,
        description: `Rapid permission requests detected for user ${userName} with ${row.request_count} denied requests`,
        evidence: [
          { type: 'user_id', value: row.user_id },
          { type: 'request_count', value: row.request_count },
          { type: 'permissions', value: row.permissions }
        ],
        riskScore: this.calculateRiskScore(rule.severity, row.request_count / rule.threshold),
        status: 'active',
        detectedAt: new Date()
      });
    }
    
    return threats;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    tenantId: string,
    reportType: 'gdpr' | 'pci_dss' | 'sox' | 'hipaa',
    periodStart: Date,
    periodEnd: Date
  ): Promise<ComplianceReport> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      // Get total events
      const totalEventsResult = await client.query(`
        SELECT COUNT(*) as count FROM security_events 
        WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3
      `, [tenantId, periodStart, periodEnd]);
      
      const totalEvents = parseInt(totalEventsResult.rows[0].count);
      
      // Get risk events (denied access, permission changes, etc.)
      const riskEventsResult = await client.query(`
        SELECT COUNT(*) as count FROM security_events 
        WHERE tenant_id = $1 
          AND created_at BETWEEN $2 AND $3
          AND (result = 'denied' OR event_type IN ('permission_granted', 'permission_revoked'))
      `, [tenantId, periodStart, periodEnd]);
      
      const riskEvents = parseInt(riskEventsResult.rows[0].count);
      
      // Calculate compliance score (simplified)
      const complianceScore = Math.max(0, 100 - (riskEvents / totalEvents) * 100);
      
      const findings = await this.generateComplianceFindings(
        client, 
        tenantId, 
        reportType, 
        periodStart, 
        periodEnd
      );
      
      const recommendations = this.generateComplianceRecommendations(reportType, findings);
      
      return {
        tenantId,
        reportType,
        generatedAt: new Date(),
        periodStart,
        periodEnd,
        totalEvents,
        riskEvents,
        complianceScore: Math.round(complianceScore),
        findings,
        recommendations
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Store detected threat
   */
  private async storeThreat(threat: SecurityThreat): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [threat.tenantId]);
      
      await client.query(`
        INSERT INTO security_threats 
        (id, tenant_id, threat_type, severity, user_id, description, evidence, risk_score, status, detected_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [
        threat.id,
        threat.tenantId,
        threat.threatType,
        threat.severity,
        threat.userId,
        threat.description,
        JSON.stringify(threat.evidence),
        threat.riskScore,
        threat.status,
        threat.detectedAt
      ]);
      
    } finally {
      client.release();
    }
  }

  /**
   * Calculate risk score based on severity and multiplier
   */
  private calculateRiskScore(severity: ThreatSeverity, multiplier: number): number {
    const baseScores = {
      [ThreatSeverity.LOW]: 25,
      [ThreatSeverity.MEDIUM]: 50,
      [ThreatSeverity.HIGH]: 75,
      [ThreatSeverity.CRITICAL]: 100
    };
    
    return Math.min(100, Math.round(baseScores[severity] * multiplier));
  }

  /**
   * Generate compliance findings
   */
  private async generateComplianceFindings(
    client: any,
    tenantId: string,
    reportType: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];
    
    // Example findings - would be expanded based on specific compliance requirements
    const unauthorizedAccessResult = await client.query(`
      SELECT COUNT(*) as count FROM security_events 
      WHERE tenant_id = $1 
        AND created_at BETWEEN $2 AND $3
        AND result = 'denied'
        AND event_type = 'resource_access'
    `, [tenantId, periodStart, periodEnd]);
    
    if (parseInt(unauthorizedAccessResult.rows[0].count) > 0) {
      findings.push({
        category: 'Access Control',
        severity: 'warning',
        description: 'Unauthorized access attempts detected',
        count: parseInt(unauthorizedAccessResult.rows[0].count),
        examples: ['Multiple denied resource access attempts'],
        recommendation: 'Review user permissions and implement additional access controls'
      });
    }
    
    return findings;
  }

  /**
   * Generate compliance recommendations
   */
  private generateComplianceRecommendations(
    reportType: string,
    findings: ComplianceFinding[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Base recommendations by compliance type
    switch (reportType) {
      case 'gdpr':
        recommendations.push('Implement data retention policies');
        recommendations.push('Ensure user consent mechanisms are in place');
        break;
      case 'pci_dss':
        recommendations.push('Implement strong payment data encryption');
        recommendations.push('Regular security assessments of payment systems');
        break;
      case 'sox':
        recommendations.push('Implement segregation of duties');
        recommendations.push('Maintain audit trails for financial data access');
        break;
      case 'hipaa':
        recommendations.push('Implement healthcare data encryption');
        recommendations.push('Regular access reviews for healthcare data');
        break;
    }
    
    // Add specific recommendations based on findings
    for (const finding of findings) {
      if (finding.severity === 'critical') {
        recommendations.push(`Immediate action required: ${finding.recommendation}`);
      }
    }
    
    return recommendations;
  }
}

export const auditAnalysisService = new AuditAnalysisService();