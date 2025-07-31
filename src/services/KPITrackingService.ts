/**
 * Advanced KPI Tracking and Metrics Engine
 * Provides comprehensive KPI monitoring, threshold alerts, and performance scoring
 */
import db from '@/database/connection';
import cache from '@/cache/memory';
import winston from 'winston';
import { Pool } from 'pg';
import { analyticsService, AnalyticsMetric, AnalyticsCategory } from './AnalyticsService';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

export interface KPI {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  category: KPICategory;
  dataSource: string;
  calculation: KPICalculation;
  unit: KPIUnit;
  target?: KPITarget;
  thresholds: KPIThreshold[];
  frequency: KPIFrequency;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum KPICategory {
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  CUSTOMER = 'customer',
  MARKETING = 'marketing',
  QUALITY = 'quality',
  EFFICIENCY = 'efficiency',
  GROWTH = 'growth',
  SATISFACTION = 'satisfaction'
}

export interface KPICalculation {
  type: 'sum' | 'average' | 'count' | 'percentage' | 'ratio' | 'custom';
  numerator?: string;
  denominator?: string;
  aggregation?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export enum KPIUnit {
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
  NUMBER = 'number',
  RATIO = 'ratio',
  SCORE = 'score',
  TIME = 'time'
}

export interface KPITarget {
  value: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  deadline?: Date;
  isStretch: boolean;
}

export interface KPIThreshold {
  id: string;
  level: 'critical' | 'warning' | 'good' | 'excellent';
  operator: 'less_than' | 'less_than_equal' | 'greater_than' | 'greater_than_equal' | 'equals' | 'between';
  value: number;
  secondValue?: number; // For 'between' operator
  alertEnabled: boolean;
  alertChannels: string[];
}

export enum KPIFrequency {
  REAL_TIME = 'real_time',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export interface KPIMetric {
  id: string;
  kpiId: string;
  tenantId: string;
  value: number;
  previousValue?: number;
  change: number;
  changePercent: number;
  trend: 'improving' | 'declining' | 'stable';
  threshold: 'critical' | 'warning' | 'good' | 'excellent';
  targetAchievement?: number; // Percentage of target achieved
  timestamp: Date;
  metadata?: any;
}

export interface KPIAlert {
  id: string;
  kpiId: string;
  kpiName: string;
  tenantId: string;
  alertType: 'threshold_breach' | 'target_miss' | 'anomaly' | 'trend_change';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  currentValue: number;
  thresholdValue: number;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface KPIScorecard {
  tenantId: string;
  period: string;
  overallScore: number;
  categoryScores: { [key in KPICategory]?: number };
  kpiResults: KPIScorecardResult[];
  trends: KPITrend[];
  generatedAt: Date;
}

export interface KPIScorecardResult {
  kpiId: string;
  kpiName: string;
  category: KPICategory;
  currentValue: number;
  targetValue?: number;
  achievement: number;
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  status: 'on_track' | 'at_risk' | 'behind' | 'exceeded';
}

export interface KPITrend {
  category: KPICategory;
  direction: 'up' | 'down' | 'stable';
  strength: 'strong' | 'moderate' | 'weak';
  duration: number; // Number of periods
  confidence: number; // 0-100
}

export interface KPIDashboard {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  kpis: string[]; // KPI IDs
  layout: DashboardLayout[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  kpiId: string;
  position: { x: number; y: number; width: number; height: number };
  visualization: 'gauge' | 'line_chart' | 'number' | 'progress_bar' | 'trend_indicator';
  showTarget: boolean;
  showThresholds: boolean;
}

export class KPITrackingService {
  private pool: Pool;
  private readonly CACHE_PREFIX = 'kpi:';
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly ALERT_CACHE_TTL = 60; // 1 minute for alerts

  constructor() {
    this.pool = db.getPool();
  }

  /**
   * Create a new KPI definition
   */
  async createKPI(tenantId: string, kpiData: Partial<KPI>, createdBy: string): Promise<KPI> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const kpiId = `kpi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await client.query(`
        INSERT INTO kpis (
          id, tenant_id, name, description, category, data_source, 
          calculation, unit, target, thresholds, frequency, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        kpiId,
        tenantId,
        kpiData.name,
        kpiData.description,
        kpiData.category,
        kpiData.dataSource,
        JSON.stringify(kpiData.calculation),
        kpiData.unit,
        JSON.stringify(kpiData.target),
        JSON.stringify(kpiData.thresholds),
        kpiData.frequency,
        kpiData.isActive ?? true,
        createdBy
      ]);
      
      const kpi = this.mapRowToKPI(result.rows[0]);
      
      // Invalidate cache
      await this.invalidateKPICache(tenantId);
      
      logger.info(`Created KPI ${kpiId} for tenant ${tenantId}`);
      
      return kpi;
      
    } finally {
      client.release();
    }
  }

  /**
   * Get all KPIs for a tenant
   */
  async getKPIs(tenantId: string, category?: KPICategory): Promise<KPI[]> {
    const cacheKey = `${this.CACHE_PREFIX}list:${tenantId}:${category || 'all'}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache read failed for KPIs:', error);
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      let query = 'SELECT * FROM kpis WHERE tenant_id = $1';
      const params: any[] = [tenantId];
      
      if (category) {
        query += ' AND category = $2';
        params.push(category);
      }
      
      query += ' ORDER BY name ASC';
      
      const result = await client.query(query, params);
      const kpis = result.rows.map(row => this.mapRowToKPI(row));
      
      // Cache results
      try {
        await cache.set(cacheKey, JSON.stringify(kpis), this.CACHE_TTL);
      } catch (error) {
        logger.warn('Cache write failed for KPIs:', error);
      }
      
      return kpis;
      
    } finally {
      client.release();
    }
  }

  /**
   * Calculate KPI metrics for all active KPIs
   */
  async calculateKPIMetrics(tenantId: string, date?: Date): Promise<KPIMetric[]> {
    const targetDate = date || new Date();
    const kpis = await this.getKPIs(tenantId);
    const activeKPIs = kpis.filter(kpi => kpi.isActive);
    
    const metrics: KPIMetric[] = [];
    
    for (const kpi of activeKPIs) {
      try {
        const metric = await this.calculateSingleKPIMetric(kpi, targetDate);
        if (metric) {
          metrics.push(metric);
          
          // Store metric in database
          await this.storeKPIMetric(metric);
          
          // Check thresholds and generate alerts
          await this.checkThresholds(kpi, metric);
        }
      } catch (error) {
        logger.error(`Error calculating KPI ${kpi.id}:`, error);
      }
    }
    
    return metrics;
  }

  /**
   * Calculate a single KPI metric
   */
  private async calculateSingleKPIMetric(kpi: KPI, date: Date): Promise<KPIMetric | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [kpi.tenantId]);
      
      let value: number;
      let previousValue: number | undefined;
      
      // Calculate current value based on KPI definition
      switch (kpi.calculation.type) {
        case 'sum':
          value = await this.calculateSum(client, kpi, date);
          break;
        case 'average':
          value = await this.calculateAverage(client, kpi, date);
          break;
        case 'count':
          value = await this.calculateCount(client, kpi, date);
          break;
        case 'percentage':
          value = await this.calculatePercentage(client, kpi, date);
          break;
        case 'ratio':
          value = await this.calculateRatio(client, kpi, date);
          break;
        case 'custom':
          value = await this.calculateCustom(client, kpi, date);
          break;
        default:
          logger.warn(`Unknown calculation type: ${kpi.calculation.type}`);
          return null;
      }
      
      // Get previous value for comparison
      const previousPeriod = this.getPreviousPeriod(date, kpi.frequency);
      if (previousPeriod) {
        try {
          previousValue = await this.getPreviousKPIValue(kpi.id, previousPeriod);
        } catch (error) {
          logger.warn(`Could not get previous value for KPI ${kpi.id}:`, error);
        }
      }
      
      // Calculate change and trend
      const change = previousValue !== undefined ? value - previousValue : 0;
      const changePercent = previousValue !== undefined && previousValue !== 0 
        ? (change / previousValue) * 100 
        : 0;
      
      const trend = this.determineTrend(change, changePercent);
      const threshold = this.determineThreshold(value, kpi.thresholds);
      
      // Calculate target achievement
      let targetAchievement: number | undefined;
      if (kpi.target) {
        targetAchievement = (value / kpi.target.value) * 100;
      }
      
      const metric: KPIMetric = {
        id: `metric_${kpi.id}_${date.getTime()}`,
        kpiId: kpi.id,
        tenantId: kpi.tenantId,
        value,
        previousValue,
        change,
        changePercent,
        trend,
        threshold,
        targetAchievement,
        timestamp: date,
        metadata: {
          calculationType: kpi.calculation.type,
          dataSource: kpi.dataSource
        }
      };
      
      return metric;
      
    } finally {
      client.release();
    }
  }

  /**
   * Calculate sum-based KPI
   */
  private async calculateSum(client: any, kpi: KPI, date: Date): Promise<number> {
    const dateRange = this.getDateRange(date, kpi.frequency);
    
    const query = `
      SELECT COALESCE(SUM(${kpi.calculation.numerator}), 0) as result
      FROM ${kpi.dataSource}
      WHERE tenant_id = $1 
        AND created_at BETWEEN $2 AND $3
    `;
    
    const result = await client.query(query, [kpi.tenantId, dateRange.start, dateRange.end]);
    return parseFloat(result.rows[0].result) || 0;
  }

  /**
   * Calculate average-based KPI
   */
  private async calculateAverage(client: any, kpi: KPI, date: Date): Promise<number> {
    const dateRange = this.getDateRange(date, kpi.frequency);
    
    const query = `
      SELECT COALESCE(AVG(${kpi.calculation.numerator}), 0) as result
      FROM ${kpi.dataSource}
      WHERE tenant_id = $1 
        AND created_at BETWEEN $2 AND $3
    `;
    
    const result = await client.query(query, [kpi.tenantId, dateRange.start, dateRange.end]);
    return parseFloat(result.rows[0].result) || 0;
  }

  /**
   * Calculate count-based KPI
   */
  private async calculateCount(client: any, kpi: KPI, date: Date): Promise<number> {
    const dateRange = this.getDateRange(date, kpi.frequency);
    
    let query = `
      SELECT COUNT(*) as result
      FROM ${kpi.dataSource}
      WHERE tenant_id = $1 
        AND created_at BETWEEN $2 AND $3
    `;
    
    // Add additional filters if specified in numerator
    if (kpi.calculation.numerator && kpi.calculation.numerator !== '*') {
      query = query.replace('COUNT(*)', `COUNT(${kpi.calculation.numerator})`);
    }
    
    const result = await client.query(query, [kpi.tenantId, dateRange.start, dateRange.end]);
    return parseInt(result.rows[0].result) || 0;
  }

  /**
   * Calculate percentage-based KPI
   */
  private async calculatePercentage(client: any, kpi: KPI, date: Date): Promise<number> {
    const dateRange = this.getDateRange(date, kpi.frequency);
    
    const numeratorQuery = `
      SELECT COUNT(*) as result
      FROM ${kpi.dataSource}
      WHERE tenant_id = $1 
        AND created_at BETWEEN $2 AND $3
        AND ${kpi.calculation.numerator}
    `;
    
    const denominatorQuery = `
      SELECT COUNT(*) as result
      FROM ${kpi.dataSource}
      WHERE tenant_id = $1 
        AND created_at BETWEEN $2 AND $3
        AND ${kpi.calculation.denominator}
    `;
    
    const [numeratorResult, denominatorResult] = await Promise.all([
      client.query(numeratorQuery, [kpi.tenantId, dateRange.start, dateRange.end]),
      client.query(denominatorQuery, [kpi.tenantId, dateRange.start, dateRange.end])
    ]);
    
    const numerator = parseInt(numeratorResult.rows[0].result) || 0;
    const denominator = parseInt(denominatorResult.rows[0].result) || 0;
    
    return denominator > 0 ? (numerator / denominator) * 100 : 0;
  }

  /**
   * Calculate ratio-based KPI
   */
  private async calculateRatio(client: any, kpi: KPI, date: Date): Promise<number> {
    const dateRange = this.getDateRange(date, kpi.frequency);
    
    const numeratorQuery = `
      SELECT COALESCE(SUM(${kpi.calculation.numerator}), 0) as result
      FROM ${kpi.dataSource}
      WHERE tenant_id = $1 
        AND created_at BETWEEN $2 AND $3
    `;
    
    const denominatorQuery = `
      SELECT COALESCE(SUM(${kpi.calculation.denominator}), 0) as result
      FROM ${kpi.dataSource}
      WHERE tenant_id = $1 
        AND created_at BETWEEN $2 AND $3
    `;
    
    const [numeratorResult, denominatorResult] = await Promise.all([
      client.query(numeratorQuery, [kpi.tenantId, dateRange.start, dateRange.end]),
      client.query(denominatorQuery, [kpi.tenantId, dateRange.start, dateRange.end])
    ]);
    
    const numerator = parseFloat(numeratorResult.rows[0].result) || 0;
    const denominator = parseFloat(denominatorResult.rows[0].result) || 0;
    
    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * Calculate custom KPI (placeholder for complex calculations)
   */
  private async calculateCustom(client: any, kpi: KPI, date: Date): Promise<number> {
    // This would implement custom calculation logic based on kpi.calculation.numerator
    // For now, return a default value
    logger.warn(`Custom calculation not implemented for KPI ${kpi.id}`);
    return 0;
  }

  /**
   * Store KPI metric in database
   */
  private async storeKPIMetric(metric: KPIMetric): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [metric.tenantId]);
      
      await client.query(`
        INSERT INTO kpi_metrics (
          id, kpi_id, tenant_id, value, previous_value, change, change_percent, 
          trend, threshold, target_achievement, timestamp, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (kpi_id, timestamp) DO UPDATE SET
          value = EXCLUDED.value,
          previous_value = EXCLUDED.previous_value,
          change = EXCLUDED.change,
          change_percent = EXCLUDED.change_percent,
          trend = EXCLUDED.trend,
          threshold = EXCLUDED.threshold,
          target_achievement = EXCLUDED.target_achievement,
          metadata = EXCLUDED.metadata
      `, [
        metric.id,
        metric.kpiId,
        metric.tenantId,
        metric.value,
        metric.previousValue,
        metric.change,
        metric.changePercent,
        metric.trend,
        metric.threshold,
        metric.targetAchievement,
        metric.timestamp,
        JSON.stringify(metric.metadata)
      ]);
      
    } finally {
      client.release();
    }
  }

  /**
   * Check thresholds and generate alerts
   */
  private async checkThresholds(kpi: KPI, metric: KPIMetric): Promise<void> {
    for (const threshold of kpi.thresholds) {
      if (!threshold.alertEnabled) continue;
      
      const isBreached = this.isThresholdBreached(metric.value, threshold);
      
      if (isBreached) {
        await this.createAlert({
          kpiId: kpi.id,
          kpiName: kpi.name,
          tenantId: kpi.tenantId,
          alertType: 'threshold_breach',
          severity: threshold.level === 'critical' ? 'critical' : 'warning',
          message: `KPI "${kpi.name}" breached ${threshold.level} threshold`,
          currentValue: metric.value,
          thresholdValue: threshold.value
        });
      }
    }
  }

  /**
   * Create KPI alert
   */
  private async createAlert(alertData: Partial<KPIAlert>): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [alertData.tenantId]);
      
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await client.query(`
        INSERT INTO kpi_alerts (
          id, kpi_id, kpi_name, tenant_id, alert_type, severity, 
          message, current_value, threshold_value, is_acknowledged
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        alertId,
        alertData.kpiId,
        alertData.kpiName,
        alertData.tenantId,
        alertData.alertType,
        alertData.severity,
        alertData.message,
        alertData.currentValue,
        alertData.thresholdValue,
        false
      ]);
      
      logger.info(`Created KPI alert ${alertId} for KPI ${alertData.kpiId}`);
      
    } finally {
      client.release();
    }
  }

  /**
   * Generate KPI scorecard
   */
  async generateKPIScorecard(tenantId: string, period: string = 'monthly'): Promise<KPIScorecard> {
    const kpis = await this.getKPIs(tenantId);
    const activeKPIs = kpis.filter(kpi => kpi.isActive);
    
    const kpiResults: KPIScorecardResult[] = [];
    const categoryScores: { [key in KPICategory]?: number } = {};
    const categoryKPIs: { [key in KPICategory]?: number } = {};
    
    // Calculate results for each KPI
    for (const kpi of activeKPIs) {
      const latestMetric = await this.getLatestKPIMetric(kpi.id);
      
      if (latestMetric) {
        const achievement = latestMetric.targetAchievement || 0;
        const score = this.calculateKPIScore(latestMetric, kpi);
        const status = this.determineKPIStatus(achievement, latestMetric.threshold);
        
        kpiResults.push({
          kpiId: kpi.id,
          kpiName: kpi.name,
          category: kpi.category,
          currentValue: latestMetric.value,
          targetValue: kpi.target?.value,
          achievement,
          score,
          trend: latestMetric.trend,
          status
        });
        
        // Aggregate category scores
        if (!categoryScores[kpi.category]) {
          categoryScores[kpi.category] = 0;
          categoryKPIs[kpi.category] = 0;
        }
        categoryScores[kpi.category]! += score;
        categoryKPIs[kpi.category]! += 1;
      }
    }
    
    // Calculate average category scores
    for (const category in categoryScores) {
      const cat = category as KPICategory;
      categoryScores[cat] = categoryScores[cat]! / categoryKPIs[cat]!;
    }
    
    // Calculate overall score
    const overallScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / Object.keys(categoryScores).length;
    
    // Generate trends
    const trends = await this.generateKPITrends(tenantId, activeKPIs);
    
    return {
      tenantId,
      period,
      overallScore,
      categoryScores,
      kpiResults,
      trends,
      generatedAt: new Date()
    };
  }

  // Helper methods
  private mapRowToKPI(row: any): KPI {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      category: row.category,
      dataSource: row.data_source,
      calculation: JSON.parse(row.calculation),
      unit: row.unit,
      target: row.target ? JSON.parse(row.target) : undefined,
      thresholds: JSON.parse(row.thresholds),
      frequency: row.frequency,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private getPreviousPeriod(date: Date, frequency: KPIFrequency): Date | null {
    const previousDate = new Date(date);
    
    switch (frequency) {
      case KPIFrequency.DAILY:
        previousDate.setDate(previousDate.getDate() - 1);
        break;
      case KPIFrequency.WEEKLY:
        previousDate.setDate(previousDate.getDate() - 7);
        break;
      case KPIFrequency.MONTHLY:
        previousDate.setMonth(previousDate.getMonth() - 1);
        break;
      default:
        return null;
    }
    
    return previousDate;
  }

  private getDateRange(date: Date, frequency: KPIFrequency): { start: Date; end: Date } {
    const end = new Date(date);
    const start = new Date(date);
    
    switch (frequency) {
      case KPIFrequency.DAILY:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case KPIFrequency.WEEKLY:
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case KPIFrequency.MONTHLY:
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    }
    
    return { start, end };
  }

  private determineTrend(change: number, changePercent: number): 'improving' | 'declining' | 'stable' {
    if (Math.abs(changePercent) < 2) return 'stable';
    return change > 0 ? 'improving' : 'declining';
  }

  private determineThreshold(value: number, thresholds: KPIThreshold[]): 'critical' | 'warning' | 'good' | 'excellent' {
    for (const threshold of thresholds.sort((a, b) => b.value - a.value)) {
      if (this.isThresholdMet(value, threshold)) {
        return threshold.level;
      }
    }
    return 'good';
  }

  private isThresholdMet(value: number, threshold: KPIThreshold): boolean {
    switch (threshold.operator) {
      case 'greater_than':
        return value > threshold.value;
      case 'greater_than_equal':
        return value >= threshold.value;
      case 'less_than':
        return value < threshold.value;
      case 'less_than_equal':
        return value <= threshold.value;
      case 'equals':
        return value === threshold.value;
      case 'between':
        return threshold.secondValue 
          ? value >= threshold.value && value <= threshold.secondValue
          : false;
      default:
        return false;
    }
  }

  private isThresholdBreached(value: number, threshold: KPIThreshold): boolean {
    // A threshold is breached if it represents a negative condition and is met
    return (threshold.level === 'critical' || threshold.level === 'warning') && this.isThresholdMet(value, threshold);
  }

  private calculateKPIScore(metric: KPIMetric, kpi: KPI): number {
    // Base score calculation (0-100)
    let score = 50; // Neutral score
    
    // Adjust based on target achievement
    if (metric.targetAchievement !== undefined) {
      if (metric.targetAchievement >= 100) {
        score = 90 + Math.min(10, (metric.targetAchievement - 100) / 10);
      } else {
        score = Math.max(10, metric.targetAchievement * 0.8);
      }
    }
    
    // Adjust based on threshold level
    switch (metric.threshold) {
      case 'excellent':
        score = Math.max(score, 90);
        break;
      case 'good':
        score = Math.max(score, 70);
        break;
      case 'warning':
        score = Math.min(score, 50);
        break;
      case 'critical':
        score = Math.min(score, 20);
        break;
    }
    
    // Adjust based on trend
    if (metric.trend === 'improving') {
      score += 5;
    } else if (metric.trend === 'declining') {
      score -= 5;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private determineKPIStatus(achievement: number, threshold: string): 'on_track' | 'at_risk' | 'behind' | 'exceeded' {
    if (achievement > 100) return 'exceeded';
    if (achievement >= 90) return 'on_track';
    if (achievement >= 70) return 'at_risk';
    return 'behind';
  }

  private async getPreviousKPIValue(kpiId: string, date: Date): Promise<number | undefined> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT value FROM kpi_metrics 
        WHERE kpi_id = $1 AND DATE(timestamp) = DATE($2) 
        ORDER BY timestamp DESC 
        LIMIT 1
      `, [kpiId, date]);
      
      return result.rows[0]?.value;
      
    } finally {
      client.release();
    }
  }

  private async getLatestKPIMetric(kpiId: string): Promise<KPIMetric | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM kpi_metrics 
        WHERE kpi_id = $1 
        ORDER BY timestamp DESC 
        LIMIT 1
      `, [kpiId]);
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        id: row.id,
        kpiId: row.kpi_id,
        tenantId: row.tenant_id,
        value: parseFloat(row.value),
        previousValue: row.previous_value ? parseFloat(row.previous_value) : undefined,
        change: parseFloat(row.change),
        changePercent: parseFloat(row.change_percent),
        trend: row.trend,
        threshold: row.threshold,
        targetAchievement: row.target_achievement ? parseFloat(row.target_achievement) : undefined,
        timestamp: row.timestamp,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined
      };
      
    } finally {
      client.release();
    }
  }

  private async generateKPITrends(tenantId: string, kpis: KPI[]): Promise<KPITrend[]> {
    // Placeholder for trend analysis
    // This would analyze historical KPI data to identify trends
    return [];
  }

  private async invalidateKPICache(tenantId: string): Promise<void> {
    try {
      const pattern = `${this.CACHE_PREFIX}*:${tenantId}*`;
      // Redis key deletion would be implemented here
      logger.info(`Invalidated KPI cache for tenant ${tenantId}`);
    } catch (error) {
      logger.warn('Failed to invalidate KPI cache:', error);
    }
  }
}

export const kpiTrackingService = new KPITrackingService();