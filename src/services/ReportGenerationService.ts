/**
 * Automated Report Generation Service
 * Generates scheduled reports, executive summaries, and automated insights
 */
import db from '@/database/connection';
import cache from '@/cache/memory';
import winston from 'winston';
import { Pool } from 'pg';
import { analyticsService, AnalyticsMetric, AnalyticsCategory } from './AnalyticsService';
import { kpiTrackingService, KPIScorecard } from './KPITrackingService';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

export interface ReportTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  frequency: ReportFrequency;
  schedule: ReportSchedule;
  recipients: string[];
  sections: ReportSection[];
  filters?: ReportFilters;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReportType {
  EXECUTIVE_SUMMARY = 'executive_summary',
  FINANCIAL_PERFORMANCE = 'financial_performance',
  OPERATIONAL_METRICS = 'operational_metrics',
  CAMPAIGN_ANALYSIS = 'campaign_analysis',
  CUSTOMER_INSIGHTS = 'customer_insights',
  KPI_SCORECARD = 'kpi_scorecard',
  COMPLIANCE_AUDIT = 'compliance_audit',
  CUSTOM = 'custom'
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  HTML = 'html',
  JSON = 'json'
}

export enum ReportFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  ON_DEMAND = 'on_demand'
}

export interface ReportSchedule {
  frequency: ReportFrequency;
  dayOfWeek?: number; // 0-6, Sunday=0
  dayOfMonth?: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  timezone: string;
}

export interface ReportSection {
  id: string;
  title: string;
  type: SectionType;
  order: number;
  config: SectionConfig;
  isVisible: boolean;
}

export enum SectionType {
  EXECUTIVE_SUMMARY = 'executive_summary',
  METRICS_OVERVIEW = 'metrics_overview',
  TREND_ANALYSIS = 'trend_analysis',
  KPI_PERFORMANCE = 'kpi_performance',
  CAMPAIGN_RESULTS = 'campaign_results',
  FINANCIAL_BREAKDOWN = 'financial_breakdown',
  OPERATIONAL_STATUS = 'operational_status',
  CUSTOMER_ANALYTICS = 'customer_analytics',
  INSIGHTS_RECOMMENDATIONS = 'insights_recommendations',
  CUSTOM_CHART = 'custom_chart',
  DATA_TABLE = 'data_table',
  TEXT_BLOCK = 'text_block'
}

export interface SectionConfig {
  metrics?: string[];
  timeRange?: { start: Date; end: Date };
  visualization?: 'chart' | 'table' | 'cards' | 'gauge';
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  filters?: any;
  customQuery?: string;
  textContent?: string;
}

export interface ReportFilters {
  dateRange?: { start: Date; end: Date };
  categories?: AnalyticsCategory[];
  kpiIds?: string[];
  campaigns?: string[];
  departments?: string[];
  regions?: string[];
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  tenantId: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  content: ReportContent;
  metadata: ReportMetadata;
  generatedAt: Date;
  deliveredAt?: Date;
  error?: string;
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
  FAILED = 'failed'
}

export interface ReportContent {
  title: string;
  summary: string;
  sections: GeneratedSection[];
  attachments?: string[];
}

export interface GeneratedSection {
  id: string;
  title: string;
  type: SectionType;
  content: any;
  insights?: string[];
  recommendations?: string[];
}

export interface ReportMetadata {
  generationTime: number; // milliseconds
  dataPoints: number;
  period: { start: Date; end: Date };
  recipients: string[];
  fileSize?: number;
  filePath?: string;
}

export interface ExecutiveSummary {
  period: { start: Date; end: Date };
  keyMetrics: {
    revenue: { current: number; change: number; trend: string };
    customers: { current: number; change: number; trend: string };
    orders: { current: number; change: number; trend: string };
    efficiency: { current: number; change: number; trend: string };
  };
  highlights: string[];
  concerns: string[];
  recommendations: string[];
  kpiScorecard: KPIScorecard;
  nextSteps: string[];
}

export class ReportGenerationService {
  private pool: Pool;
  private readonly CACHE_PREFIX = 'report:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor() {
    this.pool = db.getPool();
  }

  /**
   * Create a new report template
   */
  async createReportTemplate(
    tenantId: string,
    templateData: Partial<ReportTemplate>,
    createdBy: string
  ): Promise<ReportTemplate> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const templateId = `report_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await client.query(`
        INSERT INTO report_templates (
          id, tenant_id, name, description, type, format, frequency, 
          schedule, recipients, sections, filters, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        templateId,
        tenantId,
        templateData.name,
        templateData.description,
        templateData.type,
        templateData.format,
        templateData.frequency,
        JSON.stringify(templateData.schedule),
        JSON.stringify(templateData.recipients),
        JSON.stringify(templateData.sections),
        JSON.stringify(templateData.filters),
        templateData.isActive ?? true,
        createdBy
      ]);
      
      const template = this.mapRowToTemplate(result.rows[0]);
      
      logger.info(`Created report template ${templateId} for tenant ${tenantId}`);
      
      return template;
      
    } finally {
      client.release();
    }
  }

  /**
   * Generate report on demand
   */
  async generateReport(
    templateId: string,
    tenantId: string,
    overrides?: Partial<ReportFilters>
  ): Promise<GeneratedReport> {
    const startTime = Date.now();
    
    try {
      // Get template
      const template = await this.getReportTemplate(templateId, tenantId);
      if (!template) {
        throw new Error(`Report template ${templateId} not found`);
      }

      // Create report record
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await this.createReportRecord(reportId, template, ReportStatus.GENERATING);

      // Generate content based on template type
      let content: ReportContent;
      
      switch (template.type) {
        case ReportType.EXECUTIVE_SUMMARY:
          content = await this.generateExecutiveSummaryReport(tenantId, template, overrides);
          break;
        case ReportType.FINANCIAL_PERFORMANCE:
          content = await this.generateFinancialReport(tenantId, template, overrides);
          break;
        case ReportType.OPERATIONAL_METRICS:
          content = await this.generateOperationalReport(tenantId, template, overrides);
          break;
        case ReportType.CAMPAIGN_ANALYSIS:
          content = await this.generateCampaignReport(tenantId, template, overrides);
          break;
        case ReportType.KPI_SCORECARD:
          content = await this.generateKPIScorecardReport(tenantId, template, overrides);
          break;
        default:
          content = await this.generateCustomReport(tenantId, template, overrides);
      }

      const generationTime = Date.now() - startTime;
      
      // Create final report
      const report: GeneratedReport = {
        id: reportId,
        templateId: template.id,
        tenantId,
        name: `${template.name} - ${new Date().toISOString().split('T')[0]}`,
        type: template.type,
        format: template.format,
        status: ReportStatus.COMPLETED,
        content,
        metadata: {
          generationTime,
          dataPoints: this.calculateDataPoints(content),
          period: this.getReportPeriod(template, overrides),
          recipients: template.recipients
        },
        generatedAt: new Date()
      };

      // Update report record
      await this.updateReportRecord(reportId, report);

      // Format and deliver if needed
      if (template.recipients.length > 0) {
        await this.deliverReport(report);
      }

      logger.info(`Generated report ${reportId} in ${generationTime}ms`);
      
      return report;
      
    } catch (error) {
      logger.error(`Error generating report ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Generate executive summary report
   */
  private async generateExecutiveSummaryReport(
    tenantId: string,
    template: ReportTemplate,
    overrides?: Partial<ReportFilters>
  ): Promise<ReportContent> {
    const period = this.getReportPeriod(template, overrides);
    
    // Get comprehensive analytics data
    const [
      currentMetrics,
      kpiScorecard,
      insights
    ] = await Promise.all([
      analyticsService.getAdvancedAnalyticsMetrics(tenantId, undefined, period),
      kpiTrackingService.generateKPIScorecard(tenantId),
      analyticsService.generateAdvancedInsights(tenantId)
    ]);

    // Extract key metrics
    const revenueMetric = currentMetrics.find(m => m.id === 'total_revenue_advanced');
    const customersMetric = currentMetrics.find(m => m.id === 'customer_retention_rate');
    const ordersMetric = currentMetrics.find(m => m.id === 'order_completion_rate_advanced');
    const performanceMetric = currentMetrics.find(m => m.id === 'system_performance_score');

    const executiveSummary: ExecutiveSummary = {
      period,
      keyMetrics: {
        revenue: {
          current: revenueMetric?.value || 0,
          change: revenueMetric?.changePercent || 0,
          trend: revenueMetric?.trend || 'stable'
        },
        customers: {
          current: customersMetric?.value || 0,
          change: customersMetric?.changePercent || 0,
          trend: customersMetric?.trend || 'stable'
        },
        orders: {
          current: ordersMetric?.value || 0,
          change: ordersMetric?.changePercent || 0,
          trend: ordersMetric?.trend || 'stable'
        },
        efficiency: {
          current: performanceMetric?.value || 0,
          change: performanceMetric?.changePercent || 0,
          trend: performanceMetric?.trend || 'stable'
        }
      },
      highlights: this.generateHighlights(currentMetrics, insights),
      concerns: this.generateConcerns(currentMetrics, insights),
      recommendations: this.generateRecommendations(insights),
      kpiScorecard,
      nextSteps: this.generateNextSteps(currentMetrics, insights)
    };

    const sections: GeneratedSection[] = [
      {
        id: 'executive_overview',
        title: 'Executive Overview',
        type: SectionType.EXECUTIVE_SUMMARY,
        content: executiveSummary,
        insights: insights.slice(0, 3).map(i => i.description),
        recommendations: insights.slice(0, 3).flatMap(i => i.recommendations)
      },
      {
        id: 'key_metrics',
        title: 'Key Performance Metrics',
        type: SectionType.METRICS_OVERVIEW,
        content: currentMetrics.slice(0, 8),
        insights: [`Overall performance score: ${kpiScorecard.overallScore}/100`]
      },
      {
        id: 'kpi_scorecard',
        title: 'KPI Scorecard',
        type: SectionType.KPI_PERFORMANCE,
        content: kpiScorecard,
        insights: [`${kpiScorecard.kpiResults.filter(k => k.status === 'exceeded').length} KPIs exceeded targets`]
      }
    ];

    return {
      title: `Executive Summary - ${period.start.toLocaleDateString()} to ${period.end.toLocaleDateString()}`,
      summary: this.generateReportSummary(executiveSummary),
      sections
    };
  }

  /**
   * Generate financial performance report
   */
  private async generateFinancialReport(
    tenantId: string,
    template: ReportTemplate,
    overrides?: Partial<ReportFilters>
  ): Promise<ReportContent> {
    const period = this.getReportPeriod(template, overrides);
    
    const [
      financialInsights,
      revenueMetrics
    ] = await Promise.all([
      analyticsService.getFinancialInsights(tenantId, { 
        startDate: period.start, 
        endDate: period.end 
      }),
      analyticsService.getAdvancedAnalyticsMetrics(tenantId, AnalyticsCategory.REVENUE, period)
    ]);

    const sections: GeneratedSection[] = [
      {
        id: 'financial_overview',
        title: 'Financial Overview',
        type: SectionType.FINANCIAL_BREAKDOWN,
        content: {
          totalRevenue: financialInsights.total_gross_revenue,
          totalCommission: financialInsights.total_commission_earned,
          totalOrders: financialInsights.total_orders,
          averageOrderValue: financialInsights.average_order_value,
          revenueByDay: financialInsights.revenue_by_day,
          commissionBreakdown: financialInsights.commission_breakdown
        },
        insights: [
          `Total revenue: ${this.formatCurrency(financialInsights.total_gross_revenue)}`,
          `Commission earned: ${this.formatCurrency(financialInsights.total_commission_earned)}`,
          `Average order value: ${this.formatCurrency(financialInsights.average_order_value)}`
        ]
      },
      {
        id: 'revenue_metrics',
        title: 'Revenue Metrics',
        type: SectionType.METRICS_OVERVIEW,
        content: revenueMetrics,
        insights: revenueMetrics.map(m => `${m.name}: ${this.formatMetricValue(m)}`)
      }
    ];

    return {
      title: `Financial Performance Report - ${period.start.toLocaleDateString()} to ${period.end.toLocaleDateString()}`,
      summary: `Financial performance analysis showing total revenue of ${this.formatCurrency(financialInsights.total_gross_revenue)} across ${financialInsights.total_orders} orders.`,
      sections
    };
  }

  /**
   * Generate operational metrics report
   */
  private async generateOperationalReport(
    tenantId: string,
    template: ReportTemplate,
    overrides?: Partial<ReportFilters>
  ): Promise<ReportContent> {
    const period = this.getReportPeriod(template, overrides);
    
    const operationalMetrics = await analyticsService.getAdvancedAnalyticsMetrics(
      tenantId, 
      AnalyticsCategory.ORDERS, 
      period
    );

    const sections: GeneratedSection[] = [
      {
        id: 'operational_overview',
        title: 'Operational Overview',
        type: SectionType.OPERATIONAL_STATUS,
        content: operationalMetrics,
        insights: operationalMetrics.map(m => `${m.name}: ${this.formatMetricValue(m)}`)
      }
    ];

    return {
      title: `Operational Metrics Report - ${period.start.toLocaleDateString()} to ${period.end.toLocaleDateString()}`,
      summary: `Operational performance analysis for the specified period.`,
      sections
    };
  }

  /**
   * Generate campaign analysis report
   */
  private async generateCampaignReport(
    tenantId: string,
    template: ReportTemplate,
    overrides?: Partial<ReportFilters>
  ): Promise<ReportContent> {
    const period = this.getReportPeriod(template, overrides);
    
    const [
      campaignMetrics,
      campaignAnalytics
    ] = await Promise.all([
      analyticsService.getAdvancedAnalyticsMetrics(tenantId, AnalyticsCategory.CAMPAIGNS, period),
      analyticsService.getAdvancedCampaignAnalytics(tenantId)
    ]);

    const sections: GeneratedSection[] = [
      {
        id: 'campaign_overview',
        title: 'Campaign Overview',
        type: SectionType.CAMPAIGN_RESULTS,
        content: {
          metrics: campaignMetrics,
          campaigns: campaignAnalytics
        },
        insights: campaignAnalytics.map(c => 
          `${c.campaignName}: ${c.metrics.roi.toFixed(1)}% ROI, ${c.metrics.ctr.toFixed(2)}% CTR`
        )
      }
    ];

    return {
      title: `Campaign Analysis Report - ${period.start.toLocaleDateString()} to ${period.end.toLocaleDateString()}`,
      summary: `Campaign performance analysis across ${campaignAnalytics.length} active campaigns.`,
      sections
    };
  }

  /**
   * Generate KPI scorecard report
   */
  private async generateKPIScorecardReport(
    tenantId: string,
    template: ReportTemplate,
    overrides?: Partial<ReportFilters>
  ): Promise<ReportContent> {
    const scorecard = await kpiTrackingService.generateKPIScorecard(tenantId);

    const sections: GeneratedSection[] = [
      {
        id: 'kpi_scorecard',
        title: 'KPI Performance Scorecard',
        type: SectionType.KPI_PERFORMANCE,
        content: scorecard,
        insights: [
          `Overall score: ${scorecard.overallScore}/100`,
          `${scorecard.kpiResults.filter(k => k.status === 'exceeded').length} KPIs exceeded targets`,
          `${scorecard.kpiResults.filter(k => k.status === 'behind').length} KPIs behind target`
        ]
      }
    ];

    const period = this.getReportPeriod(template, overrides);

    return {
      title: `KPI Scorecard Report - ${period.start.toLocaleDateString()} to ${period.end.toLocaleDateString()}`,
      summary: `KPI performance scorecard with overall score of ${scorecard.overallScore}/100.`,
      sections
    };
  }

  /**
   * Generate custom report
   */
  private async generateCustomReport(
    tenantId: string,
    template: ReportTemplate,
    overrides?: Partial<ReportFilters>
  ): Promise<ReportContent> {
    const sections: GeneratedSection[] = [];
    
    for (const sectionTemplate of template.sections) {
      if (!sectionTemplate.isVisible) continue;
      
      const section = await this.generateReportSection(tenantId, sectionTemplate, template, overrides);
      sections.push(section);
    }

    const period = this.getReportPeriod(template, overrides);

    return {
      title: `${template.name} - ${period.start.toLocaleDateString()} to ${period.end.toLocaleDateString()}`,
      summary: `Custom report generated with ${sections.length} sections.`,
      sections
    };
  }

  /**
   * Generate individual report section
   */
  private async generateReportSection(
    tenantId: string,
    sectionTemplate: ReportSection,
    reportTemplate: ReportTemplate,
    overrides?: Partial<ReportFilters>
  ): Promise<GeneratedSection> {
    const period = this.getReportPeriod(reportTemplate, overrides);
    
    let content: any;
    let insights: string[] = [];

    switch (sectionTemplate.type) {
      case SectionType.METRICS_OVERVIEW:
        const metrics = await analyticsService.getAdvancedAnalyticsMetrics(tenantId, undefined, period);
        content = sectionTemplate.config.metrics 
          ? metrics.filter(m => sectionTemplate.config.metrics!.includes(m.id))
          : metrics;
        insights = content.map((m: any) => `${m.name}: ${this.formatMetricValue(m)}`);
        break;
        
      case SectionType.TREND_ANALYSIS:
        // Implementation would depend on specific requirements
        content = { placeholder: 'Trend analysis data' };
        break;
        
      default:
        content = { placeholder: `Content for ${sectionTemplate.type}` };
    }

    return {
      id: sectionTemplate.id,
      title: sectionTemplate.title,
      type: sectionTemplate.type,
      content,
      insights
    };
  }

  /**
   * Schedule automated report generation
   */
  async scheduleReports(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Get all active report templates with schedules
      const result = await client.query(`
        SELECT * FROM report_templates 
        WHERE is_active = true 
          AND frequency != 'on_demand'
      `);
      
      for (const row of result.rows) {
        const template = this.mapRowToTemplate(row);
        
        if (this.shouldGenerateReport(template)) {
          try {
            await this.generateReport(template.id, template.tenantId);
            logger.info(`Generated scheduled report ${template.id}`);
          } catch (error) {
            logger.error(`Failed to generate scheduled report ${template.id}:`, error);
          }
        }
      }
      
    } finally {
      client.release();
    }
  }

  /**
   * Deliver report to recipients
   */
  private async deliverReport(report: GeneratedReport): Promise<void> {
    // Implementation would depend on delivery method (email, webhook, etc.)
    // For now, just log the delivery
    logger.info(`Would deliver report ${report.id} to ${report.metadata.recipients.join(', ')}`);
    
    // Update report status
    await this.updateReportStatus(report.id, ReportStatus.DELIVERED);
  }

  // Helper methods
  private mapRowToTemplate(row: any): ReportTemplate {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      type: row.type,
      format: row.format,
      frequency: row.frequency,
      schedule: JSON.parse(row.schedule),
      recipients: JSON.parse(row.recipients),
      sections: JSON.parse(row.sections),
      filters: row.filters ? JSON.parse(row.filters) : undefined,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private async getReportTemplate(templateId: string, tenantId: string): Promise<ReportTemplate | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const result = await client.query(`
        SELECT * FROM report_templates 
        WHERE id = $1 AND tenant_id = $2
      `, [templateId, tenantId]);
      
      return result.rows.length > 0 ? this.mapRowToTemplate(result.rows[0]) : null;
      
    } finally {
      client.release();
    }
  }

  private async createReportRecord(
    reportId: string,
    template: ReportTemplate,
    status: ReportStatus
  ): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [template.tenantId]);
      
      await client.query(`
        INSERT INTO generated_reports (
          id, template_id, tenant_id, name, type, format, status, generated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        reportId,
        template.id,
        template.tenantId,
        template.name,
        template.type,
        template.format,
        status,
        new Date()
      ]);
      
    } finally {
      client.release();
    }
  }

  private async updateReportRecord(reportId: string, report: GeneratedReport): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [report.tenantId]);
      
      await client.query(`
        UPDATE generated_reports SET
          status = $2,
          content = $3,
          metadata = $4,
          generated_at = $5
        WHERE id = $1
      `, [
        reportId,
        report.status,
        JSON.stringify(report.content),
        JSON.stringify(report.metadata),
        report.generatedAt
      ]);
      
    } finally {
      client.release();
    }
  }

  private async updateReportStatus(reportId: string, status: ReportStatus): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        UPDATE generated_reports SET
          status = $2,
          delivered_at = CASE WHEN $2 = 'delivered' THEN NOW() ELSE delivered_at END
        WHERE id = $1
      `, [reportId, status]);
      
    } finally {
      client.release();
    }
  }

  private getReportPeriod(
    template: ReportTemplate,
    overrides?: Partial<ReportFilters>
  ): { start: Date; end: Date } {
    if (overrides?.dateRange) {
      return overrides.dateRange;
    }
    
    if (template.filters?.dateRange) {
      return template.filters.dateRange;
    }
    
    // Default period based on frequency
    const end = new Date();
    const start = new Date();
    
    switch (template.frequency) {
      case ReportFrequency.DAILY:
        start.setDate(start.getDate() - 1);
        break;
      case ReportFrequency.WEEKLY:
        start.setDate(start.getDate() - 7);
        break;
      case ReportFrequency.MONTHLY:
        start.setMonth(start.getMonth() - 1);
        break;
      case ReportFrequency.QUARTERLY:
        start.setMonth(start.getMonth() - 3);
        break;
      case ReportFrequency.ANNUALLY:
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }
    
    return { start, end };
  }

  private shouldGenerateReport(template: ReportTemplate): boolean {
    const now = new Date();
    const schedule = template.schedule;
    
    // Simplified scheduling logic - in production would use proper job scheduler
    switch (schedule.frequency) {
      case ReportFrequency.DAILY:
        return now.getHours() === schedule.hour && now.getMinutes() === schedule.minute;
      case ReportFrequency.WEEKLY:
        return now.getDay() === schedule.dayOfWeek && 
               now.getHours() === schedule.hour && 
               now.getMinutes() === schedule.minute;
      case ReportFrequency.MONTHLY:
        return now.getDate() === schedule.dayOfMonth && 
               now.getHours() === schedule.hour && 
               now.getMinutes() === schedule.minute;
      default:
        return false;
    }
  }

  private calculateDataPoints(content: ReportContent): number {
    return content.sections.reduce((total, section) => {
      if (Array.isArray(section.content)) {
        return total + section.content.length;
      }
      return total + 1;
    }, 0);
  }

  private generateHighlights(metrics: AnalyticsMetric[], insights: any[]): string[] {
    const highlights: string[] = [];
    
    // Revenue highlights
    const revenueMetric = metrics.find(m => m.id === 'total_revenue_advanced');
    if (revenueMetric && revenueMetric.changePercent && revenueMetric.changePercent > 10) {
      highlights.push(`Revenue increased by ${revenueMetric.changePercent.toFixed(1)}%`);
    }
    
    // Growth opportunities from insights
    const opportunities = insights.filter(i => i.type === 'opportunity');
    highlights.push(...opportunities.slice(0, 2).map(o => o.title));
    
    return highlights;
  }

  private generateConcerns(metrics: AnalyticsMetric[], insights: any[]): string[] {
    const concerns: string[] = [];
    
    // Risk insights
    const risks = insights.filter(i => i.type === 'risk' || i.severity === 'critical');
    concerns.push(...risks.slice(0, 3).map(r => r.title));
    
    return concerns;
  }

  private generateRecommendations(insights: any[]): string[] {
    return insights
      .filter(i => i.actionable)
      .slice(0, 5)
      .flatMap(i => i.recommendations.slice(0, 1));
  }

  private generateNextSteps(metrics: AnalyticsMetric[], insights: any[]): string[] {
    const nextSteps: string[] = [];
    
    // Add strategic next steps based on insights
    const highImpactInsights = insights.filter(i => i.impact === 'high');
    nextSteps.push(...highImpactInsights.slice(0, 3).map(i => 
      `Address ${i.title.toLowerCase()}`
    ));
    
    return nextSteps;
  }

  private generateReportSummary(executiveSummary: ExecutiveSummary): string {
    const { keyMetrics } = executiveSummary;
    
    return `Executive summary for ${executiveSummary.period.start.toLocaleDateString()} to ${executiveSummary.period.end.toLocaleDateString()}. ` +
           `Revenue: ${this.formatCurrency(keyMetrics.revenue.current)} (${keyMetrics.revenue.change > 0 ? '+' : ''}${keyMetrics.revenue.change.toFixed(1)}%). ` +
           `Overall KPI score: ${executiveSummary.kpiScorecard.overallScore}/100. ` +
           `${executiveSummary.highlights.length} key highlights and ${executiveSummary.concerns.length} concerns identified.`;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  private formatMetricValue(metric: AnalyticsMetric): string {
    switch (metric.category) {
      case 'revenue':
        return this.formatCurrency(metric.value);
      default:
        return metric.value.toLocaleString();
    }
  }
}

export const reportGenerationService = new ReportGenerationService();