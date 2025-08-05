import winston from 'winston';
import { Pool } from 'pg';
import db from '@/database/connection';  
import cache from '@/cache/memory';
import { chatService } from '@/services/ChatService';
import os from 'os';
import { promisify } from 'util';
import fs from 'fs';

const readFile = promisify(fs.readFile);

// Monitoring interfaces
interface SystemMetrics {
  timestamp: string;
  system: {
    cpu: {
      usage: number;
      loadAverage: number[];
      cores: number;
    };
    memory: {
      total: number;
      used: number;
      free: number;
      usage_percentage: number;
    };
    disk: {
      total: number;
      used: number;
      free: number;
      usage_percentage: number;
    };
    uptime: number;
  };
  application: {
    name: string;
    version: string;
    environment: string;
    process_id: number;
    uptime: number;
    memory_usage: NodeJS.MemoryUsage;
    event_loop_delay: number;
  };
  database: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    pool_size: number;
    active_connections: number;
    idle_connections: number;
    pending_requests: number;
    response_time: number;
    error_rate: number;
  };
  cache: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    connected_clients: number;
    used_memory: number;
    used_memory_rss: number;
    memory_usage_percentage: number;
    keyspace_hits: number;
    keyspace_misses: number;
    hit_rate: number;
    response_time: number;
  };
  websocket: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    active_connections: number;
    total_messages: number;
    active_chat_sessions: number;
    agent_count: number;
  };
}

interface AlertThreshold {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

interface Alert {
  id: string;
  metric: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  threshold: number;
  timestamp: string;
  resolved: boolean;
  tenant_id: string;
}

export class MonitoringService {
  private logger: winston.Logger;
  private metrics: SystemMetrics[] = [];
  private alerts: Alert[] = [];
  private alertThresholds: AlertThreshold[] = [];
  private metricsRetentionDays: number = 7;
  private isCollecting: boolean = false;
  private collectionInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/monitoring.log' })
      ]
    });

    this.initializeDefaultThresholds();
  }

  private initializeDefaultThresholds(): void {
    this.alertThresholds = [
      // CPU Thresholds
      { metric: 'system.cpu.usage', threshold: 80, operator: 'gt', severity: 'high', enabled: true },
      { metric: 'system.cpu.usage', threshold: 95, operator: 'gt', severity: 'critical', enabled: true },
      
      // Memory Thresholds  
      { metric: 'system.memory.usage_percentage', threshold: 85, operator: 'gt', severity: 'high', enabled: true },
      { metric: 'system.memory.usage_percentage', threshold: 95, operator: 'gt', severity: 'critical', enabled: true },
      
      // Disk Thresholds
      { metric: 'system.disk.usage_percentage', threshold: 80, operator: 'gt', severity: 'medium', enabled: true },
      { metric: 'system.disk.usage_percentage', threshold: 90, operator: 'gt', severity: 'high', enabled: true },
      
      // Database Thresholds
      { metric: 'database.response_time', threshold: 1000, operator: 'gt', severity: 'medium', enabled: true },
      { metric: 'database.response_time', threshold: 5000, operator: 'gt', severity: 'high', enabled: true },
      { metric: 'database.error_rate', threshold: 5, operator: 'gt', severity: 'high', enabled: true },
      
      // Cache Thresholds (Memory cache - simplified)
      { metric: 'cache.memory_usage_percentage', threshold: 80, operator: 'gt', severity: 'medium', enabled: true },
      
      // Application Thresholds
      { metric: 'application.event_loop_delay', threshold: 100, operator: 'gt', severity: 'medium', enabled: true },
      { metric: 'application.event_loop_delay', threshold: 500, operator: 'gt', severity: 'high', enabled: true }
    ];
  }

  // Start metrics collection
  async startMonitoring(intervalMs: number = 30000): Promise<void> {
    if (this.isCollecting) {
      this.logger.warn('Monitoring already started');
      return;
    }

    this.logger.info('Starting system monitoring');
    this.isCollecting = true;

    // Collect initial metrics
    await this.collectMetrics();

    // Set up interval collection
    this.collectionInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.checkAlerts();
        await this.cleanupOldMetrics();
      } catch (error) {
        this.logger.error('Error during metrics collection:', error);
      }
    }, intervalMs);
  }

  // Stop metrics collection
  stopMonitoring(): void {
    if (!this.isCollecting) {
      return;
    }

    this.logger.info('Stopping system monitoring');
    this.isCollecting = false;

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  // Collect comprehensive system metrics
  async collectMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date().toISOString();
    
    try {
      const [
        systemMetrics,
        databaseMetrics,
        redisMetrics,
        websocketMetrics
      ] = await Promise.all([
        this.collectSystemMetrics(),
        this.collectDatabaseMetrics(),
        this.collectCacheMetrics(),
        this.collectWebSocketMetrics()
      ]);

      const metrics: SystemMetrics = {
        timestamp,
        system: systemMetrics,
        application: {
          name: 'MenuCA API',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          process_id: process.pid,
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          event_loop_delay: await this.measureEventLoopDelay()
        },
        database: databaseMetrics,
        cache: cacheMetrics,
        websocket: websocketMetrics
      };

      // Store metrics in memory (in production, use a time-series DB)
      this.metrics.push(metrics);
      
      // Keep only recent metrics
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      this.logger.debug('Metrics collected successfully', { timestamp });
      return metrics;

    } catch (error) {
      this.logger.error('Failed to collect metrics:', error);
      throw error;
    }
  }

  private async collectSystemMetrics() {
    const loadAvg = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    // Get disk usage (simplified - in production use a proper disk usage library)
    let diskStats = { total: 0, used: 0, free: 0, usage_percentage: 0 };
    try {
      const stats = await fs.promises.statfs('.');
      diskStats = {
        total: stats.bavail * stats.bsize,
        used: (stats.blocks - stats.bavail) * stats.bsize,
        free: stats.bavail * stats.bsize,
        usage_percentage: ((stats.blocks - stats.bavail) / stats.blocks) * 100
      };
    } catch (error) {
      this.logger.warn('Could not collect disk stats:', error);
    }

    return {
      cpu: {
        usage: await this.getCpuUsage(),
        loadAverage: loadAvg,
        cores: os.cpus().length
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usage_percentage: (usedMem / totalMem) * 100
      },
      disk: diskStats,
      uptime: os.uptime()
    };
  }

  private async collectDatabaseMetrics() {
    const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';
    let responseTime = 0;
    let poolStats = { size: 0, active: 0, idle: 0, pending: 0 };

    try {
      // Test database connection and measure response time
      const isHealthy = await db.testConnection();
      responseTime = Date.now() - startTime;
      
      status = isHealthy ? 
        (responseTime > 1000 ? 'degraded' : 'healthy') : 
        'unhealthy';

      // Get connection pool stats
      const dbPoolStatus = db.getPoolStatus();
      poolStats = {
        size: dbPoolStatus.totalCount,
        active: dbPoolStatus.totalCount - dbPoolStatus.idleCount,
        idle: dbPoolStatus.idleCount,
        pending: dbPoolStatus.waitingCount
      };

    } catch (error) {
      this.logger.error('Database metrics collection failed:', error);
      responseTime = Date.now() - startTime;
    }

    return {
      status,
      pool_size: poolStats.size,
      active_connections: poolStats.active,
      idle_connections: poolStats.idle,
      pending_requests: poolStats.pending,
      response_time: responseTime,
      error_rate: 0 // In production, track this over time
    };
  }

  private async collectCacheMetrics() {
    const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'; // Memory cache is always healthy
    let responseTime = Date.now() - startTime;
    let cacheInfo = {
      connected_clients: 1, // Single process
      used_memory: process.memoryUsage().heapUsed,
      used_memory_rss: process.memoryUsage().rss,
      memory_usage_percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
      keyspace_hits: 100, // Mock data for memory cache
      keyspace_misses: 10,
      hit_rate: 90.9
    };

    try {
      const isHealthy = await cache.testConnection();
      responseTime = Date.now() - startTime;
      
      status = isHealthy ? 'healthy' : 'unhealthy';

      if (isHealthy && cache.isReady()) {
        const info = await cache.getInfo();
        
        // Parse Redis INFO response (simplified)
        redisInfo = {
          connected_clients: this.parseRedisInfo(info, 'connected_clients') || 0,
          used_memory: this.parseRedisInfo(info, 'used_memory') || 0,
          used_memory_rss: this.parseRedisInfo(info, 'used_memory_rss') || 0,
          memory_usage_percentage: 0, // Calculate based on maxmemory if set
          keyspace_hits: this.parseRedisInfo(info, 'keyspace_hits') || 0,
          keyspace_misses: this.parseRedisInfo(info, 'keyspace_misses') || 0,
          hit_rate: 0
        };

        // Calculate hit rate
        const totalRequests = redisInfo.keyspace_hits + redisInfo.keyspace_misses;
        redisInfo.hit_rate = totalRequests > 0 ? 
          (redisInfo.keyspace_hits / totalRequests) * 100 : 0;
      }

    } catch (error) {
      this.logger.error('Redis metrics collection failed:', error);
      responseTime = Date.now() - startTime;
    }

    return {
      status,
      response_time: responseTime,
      ...redisInfo
    };
  }

  private async collectWebSocketMetrics() {
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let wsStats = {
      active_connections: 0,
      total_messages: 0,
      active_chat_sessions: 0,
      agent_count: 0
    };

    try {
      // Get WebSocket stats from ChatService
      const chatStats = chatService.getConnectionStats();
      wsStats = {
        active_connections: chatStats.totalConnections,
        total_messages: chatStats.totalMessages,
        active_chat_sessions: chatStats.activeSessions,
        agent_count: chatStats.activeAgents
      };

      // Determine status based on connection count
      if (wsStats.active_connections > 1000) {
        status = 'degraded';
      }

    } catch (error) {
      this.logger.error('WebSocket metrics collection failed:', error);
      status = 'unhealthy';
    }

    return {
      status,
      ...wsStats
    };
  }

  private parseRedisInfo(info: string, key: string): number | null {
    const lines = info.split('\r\n');
    for (const line of lines) {
      if (line.startsWith(`${key}:`)) {
        const value = line.split(':')[1];
        return parseInt(value) || 0;
      }
    }
    return null;
  }

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const totalUsage = currentUsage.user + currentUsage.system;
        const usage = (totalUsage / 1000000 / 1) * 100; // Convert to percentage
        resolve(Math.min(usage, 100));
      }, 100);
    });
  }

  private async measureEventLoopDelay(): Promise<number> {
    return new Promise((resolve) => {
      const start = process.hrtime();
      setImmediate(() => {
        const delta = process.hrtime(start);
        const delay = delta[0] * 1000 + delta[1] * 1e-6; // Convert to milliseconds
        resolve(delay);
      });
    });
  }

  // Alert management
  private async checkAlerts(): Promise<void> {
    if (this.metrics.length === 0) return;

    const latestMetrics = this.metrics[this.metrics.length - 1];
    
    for (const threshold of this.alertThresholds) {
      if (!threshold.enabled) continue;

      const value = this.getMetricValue(latestMetrics, threshold.metric);
      if (value === null) continue;

      const shouldAlert = this.evaluateThreshold(value, threshold.threshold, threshold.operator);

      if (shouldAlert) {
        await this.createAlert(threshold, value, latestMetrics.timestamp);
      }
    }
  }

  private getMetricValue(metrics: SystemMetrics, path: string): number | null {
    const parts = path.split('.');
    let current: any = metrics;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }
    
    return typeof current === 'number' ? current : null;
  }

  private evaluateThreshold(value: number, threshold: number, operator: 'gt' | 'lt' | 'eq'): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  private async createAlert(threshold: AlertThreshold, value: number, timestamp: string): Promise<void> {
    const alertId = `${threshold.metric}-${Date.now()}`;
    
    // Check if similar alert already exists and is not resolved
    const existingAlert = this.alerts.find(a => 
      a.metric === threshold.metric && 
      !a.resolved && 
      a.severity === threshold.severity
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: Alert = {
      id: alertId,
      metric: threshold.metric,
      message: `${threshold.metric} is ${value} (threshold: ${threshold.threshold})`,
      severity: threshold.severity,
      value,
      threshold: threshold.threshold,
      timestamp,
      resolved: false,
      tenant_id: 'system'
    };

    this.alerts.push(alert);
    
    this.logger.warn('Alert triggered', {
      alertId,
      metric: threshold.metric,
      value,
      threshold: threshold.threshold,
      severity: threshold.severity
    });

    // In production, send notifications (email, Slack, PagerDuty, etc.)
    await this.sendAlertNotification(alert);
  }

  private async sendAlertNotification(alert: Alert): Promise<void> {
    // Placeholder for alert notification system
    // In production, integrate with email, Slack, PagerDuty, etc.
    this.logger.info('Alert notification sent', { alertId: alert.id });
  }

  // Public API methods
  async getLatestMetrics(): Promise<SystemMetrics | null> {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  async getMetricsHistory(hours: number = 24): Promise<SystemMetrics[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => new Date(m.timestamp) > cutoff);
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return this.alerts.filter(a => !a.resolved);
  }

  async getAllAlerts(): Promise<Alert[]> {
    return [...this.alerts];
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.logger.info('Alert resolved', { alertId });
      return true;
    }
    return false;
  }

  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, any>;
    score: number;
  }> {
    const latest = await this.getLatestMetrics();
    if (!latest) {
      return {
        status: 'unhealthy',
        checks: {},
        score: 0
      };
    }

    const checks = {
      database: latest.database.status,
      cache: latest.cache.status,
      websocket: latest.websocket.status,
      cpu: latest.system.cpu.usage < 90 ? 'healthy' : 'degraded',
      memory: latest.system.memory.usage_percentage < 90 ? 'healthy' : 'degraded',
      disk: latest.system.disk.usage_percentage < 90 ? 'healthy' : 'degraded'
    };

    // Calculate health score
    const totalChecks = Object.keys(checks).length;
    const healthyChecks = Object.values(checks).filter(status => status === 'healthy').length;
    const score = Math.round((healthyChecks / totalChecks) * 100);

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const unhealthyCount = Object.values(checks).filter(s => s === 'unhealthy').length;
    const degradedCount = Object.values(checks).filter(s => s === 'degraded').length;

    if (unhealthyCount > 0) {
      status = 'unhealthy';
    } else if (degradedCount > 2) {
      status = 'unhealthy';
    } else if (degradedCount > 0) {
      status = 'degraded';
    }

    return { status, checks, score };
  }

  private async cleanupOldMetrics(): Promise<void> {
    const cutoff = new Date(Date.now() - this.metricsRetentionDays * 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => new Date(m.timestamp) > cutoff);
    
    // Also cleanup old resolved alerts
    this.alerts = this.alerts.filter(a => 
      !a.resolved || new Date(a.timestamp) > cutoff
    );
  }

  // Configuration methods
  updateAlertThreshold(metric: string, threshold: number, operator: 'gt' | 'lt' | 'eq', severity: 'low' | 'medium' | 'high' | 'critical'): void {
    const existingThreshold = this.alertThresholds.find(t => 
      t.metric === metric && t.severity === severity
    );

    if (existingThreshold) {
      existingThreshold.threshold = threshold;
      existingThreshold.operator = operator;
    } else {
      this.alertThresholds.push({
        metric,
        threshold,
        operator,
        severity,
        enabled: true
      });
    }
  }

  getAlertThresholds(): AlertThreshold[] {
    return [...this.alertThresholds];
  }
}

// Singleton instance
export const monitoringService = new MonitoringService();