import React, { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, CheckCircle, Clock, Database, 
  HardDrive, Cpu, MemoryStick, Wifi, MessageCircle, 
  TrendingUp, TrendingDown, RefreshCw, Bell, Settings,
  Server, Users, Zap, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    response_time: number;
    active_connections: number;
    pool_size: number;
  };
  redis: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    response_time: number;
    used_memory: number;
    hit_rate: number;
  };
  websocket: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    active_connections: number;
    total_messages: number;
    active_chat_sessions: number;
  };
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
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  checks: Record<string, string>;
}

interface SystemMonitorProps {
  userToken: string;
  tenantId: string;
}

export const SystemMonitor: React.FC<SystemMonitorProps> = ({ userToken, tenantId }) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(30);

  // Fetch system data
  const fetchSystemData = async () => {
    try {
      const [metricsRes, healthRes, alertsRes] = await Promise.all([
        fetch('/api/v1/monitoring/metrics', {
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'x-tenant-id': tenantId,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/v1/monitoring/health', {
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'x-tenant-id': tenantId,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/v1/monitoring/alerts?active=true', {
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'x-tenant-id': tenantId,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.data);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData.data);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.data.alerts);
      }

      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to fetch system data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    fetchSystemData();

    if (autoRefresh) {
      const interval = setInterval(fetchSystemData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh, refreshInterval]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/v1/monitoring/alerts/${alertId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading system metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitor</h1>
          <p className="text-gray-600">Real-time system health and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdate}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSystemData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Health Overview</span>
              <Badge className={getStatusColor(health.status)}>
                {getStatusIcon(health.status)}
                <span className="ml-1">{health.status.toUpperCase()}</span>
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(health.checks).map(([service, status]) => (
                <div key={service} className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                    <span className="ml-1 capitalize">{service}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{health.score}%</div>
                <div className="text-sm text-gray-600">Health Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-red-600" />
              <span>Active Alerts ({alerts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <div>
                      <div className="font-medium">{alert.metric}</div>
                      <div className="text-sm text-gray-600">{alert.message}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Dashboard */}
      {metrics && (
        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="application">Application</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* System Metrics */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* CPU Usage */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                  <Cpu className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.system.cpu.usage.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.system.cpu.cores} cores • Load: {metrics.system.cpu.loadAverage[0].toFixed(2)}
                  </p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(metrics.system.cpu.usage, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Memory Usage */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <MemoryStick className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.system.memory.usage_percentage.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(metrics.system.memory.used)} / {formatBytes(metrics.system.memory.total)}
                  </p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-green-600 rounded-full transition-all duration-300"
                      style={{ width: `${metrics.system.memory.usage_percentage}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Disk Usage */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                  <HardDrive className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.system.disk.usage_percentage.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(metrics.system.disk.used)} / {formatBytes(metrics.system.disk.total)}
                  </p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-purple-600 rounded-full transition-all duration-300"
                      style={{ width: `${metrics.system.disk.usage_percentage}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* System Uptime */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatUptime(metrics.system.uptime)}</div>
                  <p className="text-xs text-muted-foreground">
                    Since system boot
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Application Metrics */}
          <TabsContent value="application" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Server className="h-5 w-5" />
                    <span>Application Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-medium">{metrics.application.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Version:</span>
                    <span className="text-sm font-medium">{metrics.application.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Environment:</span>
                    <Badge variant={metrics.application.environment === 'production' ? 'default' : 'secondary'}>
                      {metrics.application.environment}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Process ID:</span>
                    <span className="text-sm font-medium">{metrics.application.process_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Uptime:</span>
                    <span className="text-sm font-medium">{formatUptime(metrics.application.uptime)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MemoryStick className="h-5 w-5" />
                    <span>Process Memory</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">RSS:</span>
                    <span className="text-sm font-medium">{formatBytes(metrics.application.memory_usage.rss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Heap Total:</span>
                    <span className="text-sm font-medium">{formatBytes(metrics.application.memory_usage.heapTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Heap Used:</span>
                    <span className="text-sm font-medium">{formatBytes(metrics.application.memory_usage.heapUsed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">External:</span>
                    <span className="text-sm font-medium">{formatBytes(metrics.application.memory_usage.external)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Event Loop Delay:</span>
                    <span className="text-sm font-medium">{metrics.application.event_loop_delay.toFixed(2)}ms</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        metrics.application.event_loop_delay > 100 ? 'bg-red-600' : 
                        metrics.application.event_loop_delay > 50 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min((metrics.application.event_loop_delay / 200) * 100, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Services Metrics */}
          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Database */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="h-5 w-5" />
                      <span>Database</span>
                    </div>
                    <Badge className={getStatusColor(metrics.database.status)}>
                      {metrics.database.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Response Time:</span>
                    <span className="text-sm font-medium">{metrics.database.response_time}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Connections:</span>
                    <span className="text-sm font-medium">{metrics.database.active_connections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pool Size:</span>
                    <span className="text-sm font-medium">{metrics.database.pool_size}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Redis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Redis Cache</span>
                    </div>
                    <Badge className={getStatusColor(metrics.redis.status)}>
                      {metrics.redis.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Response Time:</span>
                    <span className="text-sm font-medium">{metrics.redis.response_time}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Memory Used:</span>
                    <span className="text-sm font-medium">{formatBytes(metrics.redis.used_memory)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hit Rate:</span>
                    <span className="text-sm font-medium">{metrics.redis.hit_rate.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* WebSocket */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="h-5 w-5" />
                      <span>WebSocket</span>
                    </div>
                    <Badge className={getStatusColor(metrics.websocket.status)}>
                      {metrics.websocket.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Connections:</span>
                    <span className="text-sm font-medium">{metrics.websocket.active_connections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Chat Sessions:</span>
                    <span className="text-sm font-medium">{metrics.websocket.active_chat_sessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Messages:</span>
                    <span className="text-sm font-medium">{metrics.websocket.total_messages}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Metrics */}
          <TabsContent value="performance" className="space-y-6">
            <div className="text-center text-gray-500 py-12">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Performance Metrics</h3>
              <p>Historical performance charts and trends would be displayed here.</p>
              <p className="text-sm">This would include CPU usage over time, memory trends, response times, etc.</p>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};