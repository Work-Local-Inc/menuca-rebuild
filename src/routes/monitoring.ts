import express, { Request, Response } from 'express';
import { monitoringService } from '@/services/MonitoringService';
import { authenticateToken } from '@/middleware/auth';
import { requireRole } from '@/middleware/auth';
import { UserRole } from '@/types/auth';

const router = express.Router();

// Middleware: All monitoring endpoints require admin role
router.use(authenticateToken);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

/**
 * @route GET /api/v1/monitoring/health
 * @desc Get overall system health status
 * @access Admin
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await monitoringService.getSystemHealth();
    
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system health',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/monitoring/metrics
 * @desc Get latest system metrics
 * @access Admin
 */
router.get('/metrics', async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await monitoringService.getLatestMetrics();
    
    if (!metrics) {
      res.status(404).json({
        success: false,
        error: 'No metrics available',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system metrics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/monitoring/metrics/history
 * @desc Get historical metrics data
 * @access Admin
 * @query hours - Number of hours of history to retrieve (default: 24, max: 168)
 */
router.get('/metrics/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const hours = Math.min(parseInt(req.query.hours as string) || 24, 168); // Max 7 days
    const metrics = await monitoringService.getMetricsHistory(hours);
    
    res.json({
      success: true,
      data: {
        metrics,
        timeRange: {
          hours,
          from: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        },
        count: metrics.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get metrics history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics history',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/monitoring/alerts
 * @desc Get system alerts
 * @access Admin
 * @query active - If 'true', only return active alerts
 */
router.get('/alerts', async (req: Request, res: Response): Promise<void> => {
  try {
    const activeOnly = req.query.active === 'true';
    const alerts = activeOnly ? 
      await monitoringService.getActiveAlerts() : 
      await monitoringService.getAllAlerts();
    
    // Sort by timestamp (newest first)
    alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        activeCount: activeOnly ? alerts.length : alerts.filter(a => !a.resolved).length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route PUT /api/v1/monitoring/alerts/:alertId/resolve
 * @desc Resolve a specific alert
 * @access Admin
 */
router.put('/alerts/:alertId/resolve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { alertId } = req.params;
    const resolved = await monitoringService.resolveAlert(alertId);
    
    if (!resolved) {
      res.status(404).json({
        success: false,
        error: 'Alert not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: { alertId, resolved: true },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to resolve alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/monitoring/thresholds
 * @desc Get current alert thresholds
 * @access Admin
 */
router.get('/thresholds', async (req: Request, res: Response): Promise<void> => {
  try {
    const thresholds = monitoringService.getAlertThresholds();
    
    res.json({
      success: true,
      data: {
        thresholds,
        count: thresholds.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get thresholds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alert thresholds',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route PUT /api/v1/monitoring/thresholds
 * @desc Update alert threshold
 * @access Admin
 */
router.put('/thresholds', async (req: Request, res: Response): Promise<void> => {
  try {
    const { metric, threshold, operator, severity } = req.body;
    
    // Validate required fields
    if (!metric || threshold === undefined || !operator || !severity) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: metric, threshold, operator, severity',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validate operator
    if (!['gt', 'lt', 'eq'].includes(operator)) {
      res.status(400).json({
        success: false,
        error: 'Invalid operator. Must be: gt, lt, or eq',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validate severity
    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      res.status(400).json({
        success: false,
        error: 'Invalid severity. Must be: low, medium, high, or critical',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validate threshold is a number
    if (typeof threshold !== 'number' || isNaN(threshold)) {
      res.status(400).json({
        success: false,
        error: 'Threshold must be a valid number',
        timestamp: new Date().toISOString()
      });
      return;
    }

    monitoringService.updateAlertThreshold(metric, threshold, operator, severity);
    
    res.json({
      success: true,
      message: 'Alert threshold updated successfully',
      data: { metric, threshold, operator, severity },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to update threshold:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update alert threshold',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/monitoring/stats
 * @desc Get monitoring system statistics
 * @access Admin
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const [latestMetrics, activeAlerts, allAlerts] = await Promise.all([
      monitoringService.getLatestMetrics(),
      monitoringService.getActiveAlerts(),
      monitoringService.getAllAlerts()
    ]);

    const health = await monitoringService.getSystemHealth();
    
    const stats = {
      monitoring: {
        isActive: latestMetrics !== null,
        lastUpdate: latestMetrics?.timestamp || null,
        metricsCollected: latestMetrics ? 1 : 0 // In production, this would be actual count
      },
      alerts: {
        total: allAlerts.length,
        active: activeAlerts.length,
        resolved: allAlerts.filter(a => a.resolved).length,
        bySeverity: {
          low: activeAlerts.filter(a => a.severity === 'low').length,
          medium: activeAlerts.filter(a => a.severity === 'medium').length,
          high: activeAlerts.filter(a => a.severity === 'high').length,
          critical: activeAlerts.filter(a => a.severity === 'critical').length
        }
      },
      health: {
        overall: health.status,
        score: health.score,
        services: health.checks
      }
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get monitoring stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get monitoring statistics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/monitoring/start
 * @desc Start metrics collection
 * @access Admin
 */
router.post('/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const { intervalMs = 30000 } = req.body;
    
    // Validate interval
    const interval = Math.max(Math.min(intervalMs, 300000), 5000); // Between 5s and 5min
    
    await monitoringService.startMonitoring(interval);
    
    res.json({
      success: true,
      message: 'Monitoring started successfully',
      data: { intervalMs: interval },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to start monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start monitoring',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/v1/monitoring/stop
 * @desc Stop metrics collection
 * @access Admin
 */
router.post('/stop', async (req: Request, res: Response): Promise<void> => {
  try {
    monitoringService.stopMonitoring();
    
    res.json({
      success: true,
      message: 'Monitoring stopped successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to stop monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop monitoring',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;