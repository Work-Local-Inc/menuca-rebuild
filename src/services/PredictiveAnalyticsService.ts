/**
 * Predictive Analytics and Machine Learning Insights Service
 * Provides forecasting, trend analysis, and predictive insights for business metrics
 */
import db from '@/database/connection';
import redis from '@/cache/redis';
import winston from 'winston';
import { Pool } from 'pg';
import { analyticsService, AnalyticsMetric } from './AnalyticsService';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

export interface Prediction {
  id: string;
  tenantId: string;
  metric: string;
  algorithm: PredictionAlgorithm;
  prediction: number;
  confidence: number;
  timeHorizon: number; // days
  generatedAt: Date;
  actualValue?: number;
  accuracy?: number;
}

export enum PredictionAlgorithm {
  LINEAR_REGRESSION = 'linear_regression',
  EXPONENTIAL_SMOOTHING = 'exponential_smoothing',
  MOVING_AVERAGE = 'moving_average',
  ARIMA = 'arima',
  SEASONAL_DECOMPOSITION = 'seasonal_decomposition',
  ENSEMBLE = 'ensemble'
}

export interface ForecastResult {
  metric: string;
  predictions: Array<{
    date: Date;
    value: number;
    confidence: number;
    upperBound: number;
    lowerBound: number;
  }>;
  algorithm: PredictionAlgorithm;
  accuracy: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality?: SeasonalPattern;
}

export interface SeasonalPattern {
  detected: boolean;
  period: number; // days
  strength: number; // 0-1
  peaks: number[];
  valleys: number[];
}

export interface AnomalyDetection {
  id: string;
  tenantId: string;
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  anomalyScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: AnomalyType;
  detectedAt: Date;
  context?: any;
}

export enum AnomalyType {
  POINT_ANOMALY = 'point_anomaly',
  CONTEXTUAL_ANOMALY = 'contextual_anomaly',
  COLLECTIVE_ANOMALY = 'collective_anomaly',
  TREND_CHANGE = 'trend_change',
  SEASONAL_DEVIATION = 'seasonal_deviation'
}

export interface BusinessInsight {
  id: string;
  tenantId: string;
  type: InsightType;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  recommendations: string[];
  metrics: string[];
  data: any;
  generatedAt: Date;
  expiresAt?: Date;
}

export enum InsightType {
  REVENUE_FORECAST = 'revenue_forecast',
  CUSTOMER_CHURN_RISK = 'customer_churn_risk',
  DEMAND_PREDICTION = 'demand_prediction',
  MARKET_OPPORTUNITY = 'market_opportunity',
  OPERATIONAL_EFFICIENCY = 'operational_efficiency',
  COST_OPTIMIZATION = 'cost_optimization',
  GROWTH_ACCELERATION = 'growth_acceleration'
}

export interface ModelPerformance {
  algorithm: PredictionAlgorithm;
  metric: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  meanAbsoluteError: number;
  rootMeanSquareError: number;
  trainingDataPoints: number;
  lastTrained: Date;
  nextTraining: Date;
}

export class PredictiveAnalyticsService {
  private pool: Pool;
  private readonly CACHE_PREFIX = 'prediction:';
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly MODEL_CACHE_TTL = 86400; // 24 hours

  constructor() {
    this.pool = db.getPool();
  }

  /**
   * Generate forecasts for multiple metrics
   */
  async generateForecasts(
    tenantId: string,
    metrics: string[],
    timeHorizon: number = 30,
    algorithm?: PredictionAlgorithm
  ): Promise<ForecastResult[]> {
    const results: ForecastResult[] = [];

    for (const metric of metrics) {
      try {
        const forecast = await this.generateSingleForecast(tenantId, metric, timeHorizon, algorithm);
        if (forecast) {
          results.push(forecast);
        }
      } catch (error) {
        logger.error(`Error generating forecast for metric ${metric}:`, error);
      }
    }

    return results;
  }

  /**
   * Generate forecast for a single metric
   */
  private async generateSingleForecast(
    tenantId: string,
    metric: string,
    timeHorizon: number,
    algorithm?: PredictionAlgorithm
  ): Promise<ForecastResult | null> {
    // Get historical data
    const historicalData = await this.getHistoricalData(tenantId, metric, 90); // 90 days of history
    
    if (historicalData.length < 7) {
      logger.warn(`Insufficient data for forecasting metric ${metric}`);
      return null;
    }

    // Select algorithm if not specified
    const selectedAlgorithm = algorithm || await this.selectBestAlgorithm(tenantId, metric, historicalData);

    // Generate predictions
    const predictions = await this.runPredictionAlgorithm(
      selectedAlgorithm,
      historicalData,
      timeHorizon
    );

    // Detect seasonality
    const seasonality = this.detectSeasonality(historicalData);

    // Calculate accuracy from historical performance
    const accuracy = await this.getModelAccuracy(tenantId, metric, selectedAlgorithm);

    // Determine trend
    const trend = this.analyzeTrend(historicalData);

    return {
      metric,
      predictions,
      algorithm: selectedAlgorithm,
      accuracy,
      trend,
      seasonality
    };
  }

  /**
   * Detect anomalies in real-time data
   */
  async detectAnomalies(
    tenantId: string,
    metric: string,
    value: number,
    timestamp: Date
  ): Promise<AnomalyDetection | null> {
    // Get expected value based on prediction model
    const expectedValue = await this.getExpectedValue(tenantId, metric, timestamp);
    
    if (expectedValue === null) return null;

    // Calculate deviation
    const deviation = Math.abs(value - expectedValue);
    const relativeDeviation = deviation / Math.max(Math.abs(expectedValue), 1);

    // Calculate anomaly score (0-1)
    const anomalyScore = Math.min(relativeDeviation * 2, 1);

    // Determine severity
    let severity: 'low' | 'medium' | 'high' | 'critical';
    if (anomalyScore > 0.8) severity = 'critical';
    else if (anomalyScore > 0.6) severity = 'high';
    else if (anomalyScore > 0.4) severity = 'medium';
    else severity = 'low';

    // Only report significant anomalies
    if (anomalyScore < 0.3) return null;

    // Determine anomaly type
    const historicalData = await this.getHistoricalData(tenantId, metric, 30);
    const type = await this.classifyAnomalyType(tenantId, metric, value, historicalData);

    const anomaly: AnomalyDetection = {
      id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      metric,
      value,
      expectedValue,
      deviation,
      anomalyScore,
      severity,
      type,
      detectedAt: timestamp,
      context: await this.getAnomalyContext(tenantId, metric, timestamp)
    };

    // Store anomaly
    await this.storeAnomaly(anomaly);

    logger.info(`Detected ${severity} anomaly for metric ${metric}: ${value} (expected: ${expectedValue})`);

    return anomaly;
  }

  /**
   * Generate business insights using ML analysis
   */
  async generateBusinessInsights(tenantId: string): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];

    try {
      // Revenue forecasting insights
      const revenueInsight = await this.generateRevenueInsights(tenantId);
      if (revenueInsight) insights.push(revenueInsight);

      // Customer churn risk insights
      const churnInsight = await this.generateChurnInsights(tenantId);
      if (churnInsight) insights.push(churnInsight);

      // Demand prediction insights
      const demandInsight = await this.generateDemandInsights(tenantId);
      if (demandInsight) insights.push(demandInsight);

      // Operational efficiency insights
      const efficiencyInsight = await this.generateEfficiencyInsights(tenantId);
      if (efficiencyInsight) insights.push(efficiencyInsight);

    } catch (error) {
      logger.error('Error generating business insights:', error);
    }

    return insights;
  }

  /**
   * Run prediction algorithm
   */
  private async runPredictionAlgorithm(
    algorithm: PredictionAlgorithm,
    historicalData: Array<{ date: Date; value: number }>,
    timeHorizon: number
  ): Promise<Array<{ date: Date; value: number; confidence: number; upperBound: number; lowerBound: number }>> {
    switch (algorithm) {
      case PredictionAlgorithm.LINEAR_REGRESSION:
        return this.linearRegression(historicalData, timeHorizon);
      case PredictionAlgorithm.EXPONENTIAL_SMOOTHING:
        return this.exponentialSmoothing(historicalData, timeHorizon);
      case PredictionAlgorithm.MOVING_AVERAGE:
        return this.movingAverage(historicalData, timeHorizon);
      case PredictionAlgorithm.SEASONAL_DECOMPOSITION:
        return this.seasonalDecomposition(historicalData, timeHorizon);
      case PredictionAlgorithm.ENSEMBLE:
        return this.ensemblePrediction(historicalData, timeHorizon);
      default:
        return this.linearRegression(historicalData, timeHorizon);
    }
  }

  /**
   * Linear regression forecasting
   */
  private linearRegression(
    data: Array<{ date: Date; value: number }>,
    timeHorizon: number
  ): Array<{ date: Date; value: number; confidence: number; upperBound: number; lowerBound: number }> {
    const n = data.length;
    const x = data.map((_, i) => i);
    const y = data.map(d => d.value);

    // Calculate linear regression coefficients
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const residualSumSquares = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const rSquared = 1 - (residualSumSquares / totalSumSquares);

    // Generate predictions
    const predictions = [];
    const lastDate = data[data.length - 1].date;
    
    for (let i = 1; i <= timeHorizon; i++) {
      const futureX = n + i - 1;
      const predictedValue = slope * futureX + intercept;
      
      // Confidence decreases with distance from training data
      const confidence = Math.max(0.1, rSquared * Math.exp(-i / 30));
      
      // Calculate bounds based on confidence
      const errorMargin = Math.abs(predictedValue) * (1 - confidence) * 0.5;
      
      const predictionDate = new Date(lastDate);
      predictionDate.setDate(predictionDate.getDate() + i);

      predictions.push({
        date: predictionDate,
        value: Math.max(0, predictedValue),
        confidence,
        upperBound: predictedValue + errorMargin,
        lowerBound: Math.max(0, predictedValue - errorMargin)
      });
    }

    return predictions;
  }

  /**
   * Exponential smoothing forecasting
   */
  private exponentialSmoothing(
    data: Array<{ date: Date; value: number }>,
    timeHorizon: number
  ): Array<{ date: Date; value: number; confidence: number; upperBound: number; lowerBound: number }> {
    const alpha = 0.3; // Smoothing parameter
    const values = data.map(d => d.value);
    
    // Calculate exponentially smoothed values
    const smoothed = [values[0]];
    for (let i = 1; i < values.length; i++) {
      smoothed[i] = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
    }

    const lastSmoothed = smoothed[smoothed.length - 1];
    const lastDate = data[data.length - 1].date;

    // Generate predictions (constant value with decreasing confidence)
    const predictions = [];
    for (let i = 1; i <= timeHorizon; i++) {
      const confidence = Math.max(0.1, Math.exp(-i / 20));
      const errorMargin = Math.abs(lastSmoothed) * (1 - confidence) * 0.3;
      
      const predictionDate = new Date(lastDate);
      predictionDate.setDate(predictionDate.getDate() + i);

      predictions.push({
        date: predictionDate,
        value: Math.max(0, lastSmoothed),
        confidence,
        upperBound: lastSmoothed + errorMargin,
        lowerBound: Math.max(0, lastSmoothed - errorMargin)
      });
    }

    return predictions;
  }

  /**
   * Moving average forecasting
   */
  private movingAverage(
    data: Array<{ date: Date; value: number }>,
    timeHorizon: number
  ): Array<{ date: Date; value: number; confidence: number; upperBound: number; lowerBound: number }> {
    const windowSize = Math.min(7, data.length);
    const recentValues = data.slice(-windowSize).map(d => d.value);
    const average = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    
    // Calculate volatility
    const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / recentValues.length;
    const volatility = Math.sqrt(variance);

    const lastDate = data[data.length - 1].date;
    const predictions = [];

    for (let i = 1; i <= timeHorizon; i++) {
      const confidence = Math.max(0.2, Math.exp(-i / 15));
      const errorMargin = volatility * 2 * (1 - confidence);
      
      const predictionDate = new Date(lastDate);
      predictionDate.setDate(predictionDate.getDate() + i);

      predictions.push({
        date: predictionDate,
        value: Math.max(0, average),
        confidence,
        upperBound: average + errorMargin,
        lowerBound: Math.max(0, average - errorMargin)
      });
    }

    return predictions;
  }

  /**
   * Seasonal decomposition forecasting
   */
  private seasonalDecomposition(
    data: Array<{ date: Date; value: number }>,
    timeHorizon: number
  ): Array<{ date: Date; value: number; confidence: number; upperBound: number; lowerBound: number }> {
    // Simplified seasonal decomposition
    const seasonalPeriod = 7; // Weekly seasonality
    const values = data.map(d => d.value);
    
    // Calculate seasonal components
    const seasonal = new Array(seasonalPeriod).fill(0);
    const counts = new Array(seasonalPeriod).fill(0);
    
    values.forEach((value, i) => {
      const seasonalIndex = i % seasonalPeriod;
      seasonal[seasonalIndex] += value;
      counts[seasonalIndex]++;
    });
    
    // Average seasonal components
    seasonal.forEach((sum, i) => {
      seasonal[i] = counts[i] > 0 ? sum / counts[i] : 0;
    });
    
    // Calculate trend
    const trendData = this.linearRegression(data, 0);
    const lastTrend = trendData.length > 0 ? trendData[0].value : values[values.length - 1];

    const lastDate = data[data.length - 1].date;
    const predictions = [];

    for (let i = 1; i <= timeHorizon; i++) {
      const seasonalIndex = (data.length + i - 1) % seasonalPeriod;
      const seasonalComponent = seasonal[seasonalIndex];
      const trendComponent = lastTrend;
      
      const predictedValue = trendComponent + (seasonalComponent - trendComponent) * 0.3;
      const confidence = Math.max(0.3, Math.exp(-i / 25));
      const errorMargin = Math.abs(predictedValue) * (1 - confidence) * 0.4;
      
      const predictionDate = new Date(lastDate);
      predictionDate.setDate(predictionDate.getDate() + i);

      predictions.push({
        date: predictionDate,
        value: Math.max(0, predictedValue),
        confidence,
        upperBound: predictedValue + errorMargin,
        lowerBound: Math.max(0, predictedValue - errorMargin)
      });
    }

    return predictions;
  }

  /**
   * Ensemble prediction combining multiple algorithms
   */
  private async ensemblePrediction(
    data: Array<{ date: Date; value: number }>,
    timeHorizon: number
  ): Promise<Array<{ date: Date; value: number; confidence: number; upperBound: number; lowerBound: number }>> {
    const algorithms = [
      PredictionAlgorithm.LINEAR_REGRESSION,
      PredictionAlgorithm.EXPONENTIAL_SMOOTHING,
      PredictionAlgorithm.MOVING_AVERAGE,
      PredictionAlgorithm.SEASONAL_DECOMPOSITION
    ];

    const predictions = await Promise.all(
      algorithms.map(algo => this.runPredictionAlgorithm(algo, data, timeHorizon))
    );

    // Combine predictions with weighted average
    const weights = [0.3, 0.25, 0.2, 0.25]; // Weights for each algorithm
    const ensemblePredictions = [];

    for (let i = 0; i < timeHorizon; i++) {
      let weightedValue = 0;
      let weightedConfidence = 0;
      let weightedUpper = 0;
      let weightedLower = 0;

      predictions.forEach((predSet, algoIndex) => {
        if (predSet[i]) {
          const weight = weights[algoIndex];
          weightedValue += predSet[i].value * weight;
          weightedConfidence += predSet[i].confidence * weight;
          weightedUpper += predSet[i].upperBound * weight;
          weightedLower += predSet[i].lowerBound * weight;
        }
      });

      ensemblePredictions.push({
        date: predictions[0][i].date,
        value: Math.max(0, weightedValue),
        confidence: Math.min(0.95, weightedConfidence + 0.1), // Ensemble boost
        upperBound: weightedUpper,
        lowerBound: Math.max(0, weightedLower)
      });
    }

    return ensemblePredictions;
  }

  // Helper methods
  private async getHistoricalData(
    tenantId: string,
    metric: string,
    days: number
  ): Promise<Array<{ date: Date; value: number }>> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      
      const result = await client.query(`
        SELECT DATE(timestamp) as date, AVG(value) as value
        FROM analytics_metrics 
        WHERE tenant_id = $1 AND metric_name = $2 
          AND timestamp >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `, [tenantId, metric]);
      
      return result.rows.map(row => ({
        date: new Date(row.date),
        value: parseFloat(row.value)
      }));
      
    } finally {
      client.release();
    }
  }

  private detectSeasonality(data: Array<{ date: Date; value: number }>): SeasonalPattern {
    // Simplified seasonality detection
    const values = data.map(d => d.value);
    const n = values.length;
    
    if (n < 14) {
      return { detected: false, period: 0, strength: 0, peaks: [], valleys: [] };
    }

    // Test for weekly seasonality (period = 7)
    let correlation = 0;
    const period = 7;
    
    if (n >= period * 2) {
      for (let i = 0; i < n - period; i++) {
        correlation += values[i] * values[i + period];
      }
      correlation = correlation / (n - period);
    }

    const detected = correlation > 0.5;
    const strength = detected ? Math.min(correlation, 1) : 0;

    return {
      detected,
      period: detected ? period : 0,
      strength,
      peaks: [], // Would implement peak detection
      valleys: [] // Would implement valley detection
    };
  }

  private analyzeTrend(data: Array<{ date: Date; value: number }>): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable';
    
    const values = data.map(d => d.value);
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    // Calculate slope using least squares
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    if (Math.abs(slope) < 0.1) return 'stable';
    return slope > 0 ? 'increasing' : 'decreasing';
  }

  private async selectBestAlgorithm(
    tenantId: string,
    metric: string,
    data: Array<{ date: Date; value: number }>
  ): Promise<PredictionAlgorithm> {
    // Simplified algorithm selection based on data characteristics
    const n = data.length;
    const seasonality = this.detectSeasonality(data);
    
    if (seasonality.detected && seasonality.strength > 0.7) {
      return PredictionAlgorithm.SEASONAL_DECOMPOSITION;
    }
    
    if (n > 30) {
      return PredictionAlgorithm.ENSEMBLE;
    }
    
    if (n > 14) {
      return PredictionAlgorithm.LINEAR_REGRESSION;
    }
    
    return PredictionAlgorithm.EXPONENTIAL_SMOOTHING;
  }

  private async getModelAccuracy(
    tenantId: string,
    metric: string,
    algorithm: PredictionAlgorithm
  ): Promise<number> {
    // Return cached accuracy or default
    return 0.75; // Placeholder
  }

  private async getExpectedValue(
    tenantId: string,
    metric: string,
    timestamp: Date
  ): Promise<number | null> {
    // Get prediction for this timestamp
    const forecast = await this.generateSingleForecast(tenantId, metric, 1);
    return forecast?.predictions[0]?.value || null;
  }

  private async classifyAnomalyType(
    tenantId: string,
    metric: string,
    value: number,
    historicalData: Array<{ date: Date; value: number }>
  ): Promise<AnomalyType> {
    // Simplified anomaly type classification
    return AnomalyType.POINT_ANOMALY;
  }

  private async getAnomalyContext(
    tenantId: string,
    metric: string,
    timestamp: Date
  ): Promise<any> {
    return {
      dayOfWeek: timestamp.getDay(),
      hour: timestamp.getHours(),
      month: timestamp.getMonth()
    };
  }

  private async storeAnomaly(anomaly: AnomalyDetection): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('SET app.current_tenant_id = $1', [anomaly.tenantId]);
      
      await client.query(`
        INSERT INTO anomaly_detections (
          id, tenant_id, metric, value, expected_value, deviation,
          anomaly_score, severity, type, detected_at, context
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        anomaly.id,
        anomaly.tenantId,
        anomaly.metric,
        anomaly.value,
        anomaly.expectedValue,
        anomaly.deviation,
        anomaly.anomalyScore,
        anomaly.severity,
        anomaly.type,
        anomaly.detectedAt,
        JSON.stringify(anomaly.context)
      ]);
      
    } finally {
      client.release();
    }
  }

  // Business insight generators
  private async generateRevenueInsights(tenantId: string): Promise<BusinessInsight | null> {
    const forecast = await this.generateSingleForecast(tenantId, 'total_revenue', 30);
    
    if (!forecast) return null;

    const currentRevenue = forecast.predictions[0]?.value || 0;
    const futureRevenue = forecast.predictions[29]?.value || 0;
    const growth = ((futureRevenue - currentRevenue) / currentRevenue) * 100;

    return {
      id: `insight_revenue_${Date.now()}`,
      tenantId,
      type: InsightType.REVENUE_FORECAST,
      title: `Revenue ${growth > 0 ? 'Growth' : 'Decline'} Forecast`,
      description: `Revenue is projected to ${growth > 0 ? 'increase' : 'decrease'} by ${Math.abs(growth).toFixed(1)}% over the next 30 days.`,
      impact: growth > 20 ? 'high' : growth > 10 ? 'medium' : 'low',
      confidence: forecast.accuracy,
      recommendations: [
        growth > 0 ? 'Prepare for increased demand and inventory needs' : 'Review pricing strategy and marketing campaigns',
        'Monitor key performance indicators closely',
        'Consider adjusting resource allocation based on projected trends'
      ],
      metrics: ['total_revenue', 'growth_rate'],
      data: { forecast, growth },
      generatedAt: new Date()
    };
  }

  private async generateChurnInsights(tenantId: string): Promise<BusinessInsight | null> {
    // Placeholder for churn prediction logic
    return {
      id: `insight_churn_${Date.now()}`,
      tenantId,
      type: InsightType.CUSTOMER_CHURN_RISK,
      title: 'Customer Retention Analysis',
      description: 'Advanced churn prediction model identifies at-risk customers.',
      impact: 'medium',
      confidence: 0.8,
      recommendations: [
        'Implement proactive retention campaigns',
        'Improve customer service response times',
        'Offer personalized incentives to at-risk customers'
      ],
      metrics: ['customer_retention_rate', 'churn_rate'],
      data: {},
      generatedAt: new Date()
    };
  }

  private async generateDemandInsights(tenantId: string): Promise<BusinessInsight | null> {
    return null; // Placeholder
  }

  private async generateEfficiencyInsights(tenantId: string): Promise<BusinessInsight | null> {
    return null; // Placeholder
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();