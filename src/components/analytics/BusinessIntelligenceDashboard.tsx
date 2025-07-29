import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity,
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  PieChart, 
  Target,
  DollarSign,
  Users,
  ShoppingCart,
  Store,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Zap,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Cpu,
  Database,
  Shield
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';

interface ExecutiveMetric {
  id: string;
  name: string;
  category: string;
  value: number;
  previousValue: number;
  target?: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  unit: 'currency' | 'number' | 'percentage';
  priority: 'high' | 'medium' | 'low';
}

interface RealtimeData {
  timestamp: string;
  activeUsers: number;
  ordersPerMinute: number;
  revenue: number;
  systemLoad: number;
  errorRate: number;
}

interface BusinessInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'alert' | 'trend';
  title: string;
  description: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  category: string;
  generatedAt: string;
}

interface DepartmentMetrics {
  department: string;
  revenue: number;
  growth: number;
  efficiency: number;
  satisfaction: number;
}

interface GeographicData {
  region: string;
  revenue: number;
  orders: number;
  growth: number;
  marketShare: number;
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#6366F1',
  gray: '#6B7280'
};

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6', '#F97316', '#06B6D4'];

export const BusinessIntelligenceDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('executive');
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Real-time data state
  const [realtimeData, setRealtimeData] = useState<RealtimeData[]>([]);
  const [executiveMetrics, setExecutiveMetrics] = useState<ExecutiveMetric[]>([]);
  const [businessInsights, setBusinessInsights] = useState<BusinessInsight[]>([]);
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetrics[]>([]);
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);
  
  // Summary state
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    revenueGrowth: 0,
    activeCustomers: 0,
    totalOrders: 0,
    orderGrowth: 0,
    avgOrderValue: 0,
    customerSatisfaction: 0,
    systemHealth: 0
  });

  // Real-time data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      generateRealtimeData();
      setLastUpdated(new Date());
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadExecutiveMetrics(),
        loadBusinessInsights(),
        loadDepartmentMetrics(),
        loadGeographicData(),
        generateRealtimeData()
      ]);
    } catch (error) {
      console.error('Error loading BI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRealtimeData = () => {
    const now = new Date();
    const dataPoint: RealtimeData = {
      timestamp: now.toISOString(),
      activeUsers: Math.floor(Math.random() * 500) + 200,
      ordersPerMinute: Math.floor(Math.random() * 20) + 5,
      revenue: Math.floor(Math.random() * 1000) + 500,
      systemLoad: Math.random() * 100,
      errorRate: Math.random() * 2
    };

    setRealtimeData(prev => {
      const newData = [...prev, dataPoint];
      // Keep only last 30 data points
      return newData.slice(-30);
    });
  };

  const loadExecutiveMetrics = async () => {
    const mockMetrics: ExecutiveMetric[] = [
      {
        id: 'total_revenue',
        name: 'Total Revenue',
        category: 'Financial',
        value: 2847500,
        previousValue: 2456800,
        target: 3000000,
        trend: 'up',
        changePercent: 15.9,
        unit: 'currency',
        priority: 'high'
      },
      {
        id: 'active_customers',
        name: 'Active Customers',
        category: 'Customer',
        value: 18750,
        previousValue: 17200,
        target: 20000,
        trend: 'up',
        changePercent: 9.0,
        unit: 'number',
        priority: 'high'
      },
      {
        id: 'order_completion_rate',
        name: 'Order Completion Rate',
        category: 'Operations',
        value: 94.2,
        previousValue: 91.8,
        target: 95.0,
        trend: 'up',
        changePercent: 2.6,
        unit: 'percentage',
        priority: 'medium'
      },
      {
        id: 'customer_acquisition_cost',
        name: 'Customer Acquisition Cost',
        category: 'Marketing',
        value: 23.50,
        previousValue: 28.20,
        trend: 'down',
        changePercent: -16.7,
        unit: 'currency',
        priority: 'medium'
      },
      {
        id: 'avg_order_value',
        name: 'Average Order Value',
        category: 'Financial',
        value: 42.80,
        previousValue: 39.60,
        target: 45.00,
        trend: 'up',
        changePercent: 8.1,
        unit: 'currency',
        priority: 'medium'
      },
      {
        id: 'system_uptime',
        name: 'System Uptime',
        category: 'Technical',
        value: 99.8,
        previousValue: 99.6,
        target: 99.9,
        trend: 'up',
        changePercent: 0.2,
        unit: 'percentage',
        priority: 'high'
      }
    ];

    setExecutiveMetrics(mockMetrics);

    // Calculate summary
    const revenueMetric = mockMetrics.find(m => m.id === 'total_revenue')!;
    const customersMetric = mockMetrics.find(m => m.id === 'active_customers')!;
    const aovMetric = mockMetrics.find(m => m.id === 'avg_order_value')!;
    const uptimeMetric = mockMetrics.find(m => m.id === 'system_uptime')!;

    setSummary({
      totalRevenue: revenueMetric.value,
      revenueGrowth: revenueMetric.changePercent,
      activeCustomers: customersMetric.value,
      totalOrders: Math.floor(revenueMetric.value / aovMetric.value),
      orderGrowth: 12.4,
      avgOrderValue: aovMetric.value,
      customerSatisfaction: 4.6,
      systemHealth: uptimeMetric.value
    });
  };

  const loadBusinessInsights = async () => {
    const mockInsights: BusinessInsight[] = [
      {
        id: 'insight-001',
        type: 'opportunity',
        title: 'Mobile Order Growth Accelerating',
        description: 'Mobile orders increased 45% month-over-month, representing 68% of total orders.',
        impact: 'high',
        confidence: 92,
        actionable: true,
        recommendations: [
          'Optimize mobile checkout experience',
          'Implement mobile-first marketing campaigns',
          'Expand mobile app features'
        ],
        category: 'Customer Experience',
        generatedAt: new Date().toISOString()
      },
      {
        id: 'insight-002',
        type: 'risk',
        title: 'Weekend Delivery Capacity Constraint',
        description: 'Weekend order fulfillment rate dropped to 89% due to capacity limitations.',
        impact: 'medium',
        confidence: 88,
        actionable: true,
        recommendations: [
          'Increase weekend delivery staff',
          'Implement dynamic pricing for peak times',
          'Partner with additional delivery services'
        ],
        category: 'Operations',
        generatedAt: new Date().toISOString()
      },
      {
        id: 'insight-003',
        type: 'trend',
        title: 'Healthy Food Category Surge',
        description: 'Healthy food orders grew 67% with average order value 23% higher than category average.',
        impact: 'high',
        confidence: 95,
        actionable: true,
        recommendations: [
          'Expand healthy menu options',
          'Create dedicated healthy food campaigns',
          'Partner with health-focused restaurants'
        ],
        category: 'Product Strategy',
        generatedAt: new Date().toISOString()
      },
      {
        id: 'insight-004',
        type: 'alert',
        title: 'Customer Support Response Time Increasing',
        description: 'Average response time increased from 2.3 to 4.1 minutes, affecting satisfaction scores.',
        impact: 'medium',
        confidence: 85,
        actionable: true,
        recommendations: [
          'Add additional support staff during peak hours',
          'Implement AI chatbot for common queries',
          'Create self-service knowledge base'
        ],
        category: 'Customer Service',
        generatedAt: new Date().toISOString()
      }
    ];

    setBusinessInsights(mockInsights);
  };

  const loadDepartmentMetrics = async () => {
    const mockDepartments: DepartmentMetrics[] = [
      { department: 'Sales', revenue: 1200000, growth: 18.5, efficiency: 92, satisfaction: 4.7 },
      { department: 'Marketing', revenue: 800000, growth: 24.3, efficiency: 87, satisfaction: 4.4 },
      { department: 'Operations', revenue: 600000, growth: 12.1, efficiency: 94, satisfaction: 4.2 },
      { department: 'Support', revenue: 200000, growth: 8.7, efficiency: 89, satisfaction: 4.6 }
    ];

    setDepartmentMetrics(mockDepartments);
  };

  const loadGeographicData = async () => {
    const mockGeographic: GeographicData[] = [
      { region: 'North America', revenue: 1500000, orders: 35000, growth: 15.2, marketShare: 42.3 },
      { region: 'Europe', revenue: 900000, orders: 22000, growth: 22.1, marketShare: 28.7 },
      { region: 'Asia Pacific', revenue: 600000, orders: 18000, growth: 31.5, marketShare: 19.8 },
      { region: 'Latin America', revenue: 300000, orders: 8000, growth: 18.9, marketShare: 9.2 }
    ];

    setGeographicData(mockGeographic);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getMetricIcon = (category: string) => {
    switch (category) {
      case 'Financial': return <DollarSign className="h-4 w-4" />;
      case 'Customer': return <Users className="h-4 w-4" />;
      case 'Operations': return <ShoppingCart className="h-4 w-4" />;
      case 'Marketing': return <Target className="h-4 w-4" />;
      case 'Technical': return <Cpu className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string, changePercent: number) => {
    if (trend === 'up') {
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    } else if (trend === 'down') {
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'trend': return <BarChart3 className="h-4 w-4 text-blue-500" />;
      default: return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            Business Intelligence Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time insights and executive analytics for data-driven decisions
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          
          <select 
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value={10}>10s refresh</option>
            <option value={30}>30s refresh</option>
            <option value={60}>1m refresh</option>
            <option value={300}>5m refresh</option>
          </select>
          
          <Button onClick={loadInitialData} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +{summary.revenueGrowth.toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.activeCustomers)}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +9.0% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalOrders)}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +{summary.orderGrowth.toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(summary.systemHealth)}</div>
            <div className="flex items-center text-xs text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              All systems operational
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Executive Tab */}
        <TabsContent value="executive" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {executiveMetrics.map((metric) => (
              <Card key={metric.id} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {getMetricIcon(metric.category)}
                    {metric.name}
                  </CardTitle>
                  <Badge variant={metric.priority === 'high' ? 'default' : 'outline'}>
                    {metric.priority}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {metric.unit === 'currency' && formatCurrency(metric.value)}
                      {metric.unit === 'number' && formatNumber(metric.value)}
                      {metric.unit === 'percentage' && formatPercentage(metric.value)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs">
                        {getTrendIcon(metric.trend, metric.changePercent)}
                        <span className={`ml-1 ${
                          metric.changePercent > 0 ? 'text-green-600' : 
                          metric.changePercent < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                        </span>
                      </div>
                      
                      {metric.target && (
                        <div className="text-xs text-gray-500">
                          Target: {metric.unit === 'currency' && formatCurrency(metric.target)}
                          {metric.unit === 'number' && formatNumber(metric.target)}
                          {metric.unit === 'percentage' && formatPercentage(metric.target)}
                        </div>
                      )}
                    </div>
                    
                    {metric.target && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Users */}
            <Card>
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={realtimeData}>
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      interval="preserveStartEnd"
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value: number) => [formatNumber(value), 'Active Users']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="activeUsers" 
                      stroke={COLORS.primary} 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Orders Per Minute */}
            <Card>
              <CardHeader>
                <CardTitle>Orders Per Minute</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={realtimeData}>
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      interval="preserveStartEnd"
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value: number) => [formatNumber(value), 'Orders/min']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ordersPerMinute" 
                      stroke={COLORS.success} 
                      fill={COLORS.success}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* System Performance */}
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={realtimeData}>
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      interval="preserveStartEnd"
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <Bar yAxisId="left" dataKey="systemLoad" fill={COLORS.info} />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="errorRate" 
                      stroke={COLORS.danger}
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Stream */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Stream</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={realtimeData}>
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      interval="preserveStartEnd"
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={COLORS.success} 
                      fill={COLORS.success}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Department Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Department Growth Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Bar dataKey="growth" fill={COLORS.success} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Department Details */}
          <Card>
            <CardHeader>
              <CardTitle>Department Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentMetrics.map((dept, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg">{dept.department}</h3>
                      <Badge variant="outline">{formatCurrency(dept.revenue)}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Growth Rate</div>
                        <div className="font-medium text-green-600">+{dept.growth.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Efficiency</div>
                        <div className="font-medium">{dept.efficiency}%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Satisfaction</div>
                        <div className="font-medium">{dept.satisfaction.toFixed(1)}/5.0</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Regional Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Region</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={geographicData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="revenue"
                      label={({ region, marketShare }) => `${region}: ${marketShare.toFixed(1)}%`}
                    >
                      {geographicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Regional Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Regional Growth Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={geographicData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Bar dataKey="growth" fill={COLORS.warning} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Geographic Details */}
          <Card>
            <CardHeader>
              <CardTitle>Regional Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {geographicData.map((region, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {region.region}
                      </h3>
                      <Badge variant="outline">{region.marketShare.toFixed(1)}% share</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Revenue</div>
                        <div className="font-medium">{formatCurrency(region.revenue)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Orders</div>
                        <div className="font-medium">{formatNumber(region.orders)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Growth</div>
                        <div className="font-medium text-green-600">+{region.growth.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-gray-600">AOV</div>
                        <div className="font-medium">{formatCurrency(region.revenue / region.orders)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {businessInsights.map((insight) => (
            <Card key={insight.id} className={`border-l-4 ${getImpactColor(insight.impact)}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getInsightIcon(insight.type)}
                    <div>
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{insight.impact} impact</Badge>
                    <Badge variant="outline">{insight.confidence}% confidence</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span><strong>Category:</strong> {insight.category}</span>
                    <span><strong>Generated:</strong> {new Date(insight.generatedAt).toLocaleString()}</span>
                  </div>
                  
                  {insight.actionable && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recommended Actions:</h4>
                      <ul className="space-y-1">
                        {insight.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {businessInsights.length === 0 && !loading && (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No business insights available at this time.</p>
                <p className="text-sm text-gray-400 mt-1">Insights are generated based on data patterns and anomalies.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};