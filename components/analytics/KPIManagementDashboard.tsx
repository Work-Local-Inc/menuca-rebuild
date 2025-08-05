import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target,
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  Gauge,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Settings,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  Users,
  ShoppingCart,
  Zap,
  Award,
  Calendar,
  Edit,
  Trash2
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Cell,
  Pie
} from 'recharts';

interface KPI {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: 'currency' | 'percentage' | 'number' | 'ratio';
  currentValue: number;
  previousValue?: number;
  target?: number;
  trend: 'improving' | 'declining' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  frequency: string;
  isActive: boolean;
  lastUpdated: string;
}

interface KPIAlert {
  id: string;
  kpiId: string;
  kpiName: string;
  alertType: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  currentValue: number;
  thresholdValue: number;
  isAcknowledged: boolean;
  createdAt: string;
}

interface KPIScorecard {
  overallScore: number;
  categoryScores: { [key: string]: number };
  kpiResults: Array<{
    kpiId: string;
    kpiName: string;
    category: string;
    score: number;
    achievement: number;
    status: string;
  }>;
}

interface KPITrendData {
  date: string;
  value: number;
  target?: number;
}

const CATEGORY_COLORS = {
  financial: '#10B981',
  operational: '#3B82F6',
  customer: '#F59E0B',
  marketing: '#EF4444',
  quality: '#6366F1',
  efficiency: '#8B5CF6',
  growth: '#F97316',
  satisfaction: '#06B6D4'
};

const STATUS_COLORS = {
  excellent: 'text-green-600 bg-green-100',
  good: 'text-blue-600 bg-blue-100',
  warning: 'text-yellow-600 bg-yellow-100',
  critical: 'text-red-600 bg-red-100'
};

export const KPIManagementDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Data state
  const [kpis, setKPIs] = useState<KPI[]>([]);
  const [alerts, setAlerts] = useState<KPIAlert[]>([]);
  const [scorecard, setScorecard] = useState<KPIScorecard | null>(null);
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
  const [kpiTrendData, setKpiTrendData] = useState<KPITrendData[]>([]);

  useEffect(() => {
    loadKPIData();
  }, [selectedCategory]);

  const loadKPIData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadKPIs(),
        loadKPIAlerts(),
        loadKPIScorecard()
      ]);
    } catch (error) {
      console.error('Error loading KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKPIs = async () => {
    // Mock data - replace with actual API call
    const mockKPIs: KPI[] = [
      {
        id: 'kpi-001',
        name: 'Monthly Recurring Revenue',
        description: 'Total monthly recurring revenue from subscriptions',
        category: 'financial',
        unit: 'currency',
        currentValue: 284750,
        previousValue: 265200,
        target: 300000,
        trend: 'improving',
        status: 'good',
        frequency: 'monthly',
        isActive: true,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'kpi-002',
        name: 'Customer Acquisition Cost',
        description: 'Average cost to acquire a new customer',
        category: 'marketing',
        unit: 'currency',
        currentValue: 42.50,
        previousValue: 45.80,
        target: 40.00,
        trend: 'improving',
        status: 'warning',
        frequency: 'weekly',
        isActive: true,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'kpi-003',
        name: 'Order Completion Rate',
        description: 'Percentage of orders successfully completed',
        category: 'operational',
        unit: 'percentage',
        currentValue: 94.2,
        previousValue: 91.8,
        target: 95.0,
        trend: 'improving',
        status: 'good',
        frequency: 'daily',
        isActive: true,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'kpi-004',
        name: 'Customer Satisfaction Score',
        description: 'Average customer satisfaction rating',
        category: 'satisfaction',
        unit: 'ratio',
        currentValue: 4.6,
        previousValue: 4.4,
        target: 4.8,
        trend: 'improving',
        status: 'good',
        frequency: 'weekly',
        isActive: true,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'kpi-005',
        name: 'System Response Time',
        description: 'Average API response time in milliseconds',
        category: 'efficiency',
        unit: 'number',
        currentValue: 245,
        previousValue: 180,
        target: 200,
        trend: 'declining',
        status: 'warning',
        frequency: 'hourly',
        isActive: true,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'kpi-006',
        name: 'Monthly Active Users',
        description: 'Number of unique users active in the last 30 days',
        category: 'growth',
        unit: 'number',
        currentValue: 18750,
        previousValue: 17200,
        target: 20000,
        trend: 'improving',
        status: 'excellent',
        frequency: 'daily',
        isActive: true,
        lastUpdated: new Date().toISOString()
      }
    ];

    setKPIs(mockKPIs);
  };

  const loadKPIAlerts = async () => {
    const mockAlerts: KPIAlert[] = [
      {
        id: 'alert-001',
        kpiId: 'kpi-005',
        kpiName: 'System Response Time',
        alertType: 'threshold_breach',
        severity: 'warning',
        message: 'System response time exceeded warning threshold of 200ms',
        currentValue: 245,
        thresholdValue: 200,
        isAcknowledged: false,
        createdAt: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
      },
      {
        id: 'alert-002',
        kpiId: 'kpi-002',
        kpiName: 'Customer Acquisition Cost',
        alertType: 'target_miss',
        severity: 'warning',
        message: 'Customer acquisition cost above target of $40.00',
        currentValue: 42.50,
        thresholdValue: 40.00,
        isAcknowledged: false,
        createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      }
    ];

    setAlerts(mockAlerts);
  };

  const loadKPIScorecard = async () => {
    const mockScorecard: KPIScorecard = {
      overallScore: 78,
      categoryScores: {
        financial: 85,
        marketing: 72,
        operational: 88,
        satisfaction: 82,
        efficiency: 65,
        growth: 92
      },
      kpiResults: [
        { kpiId: 'kpi-001', kpiName: 'Monthly Recurring Revenue', category: 'financial', score: 85, achievement: 94.9, status: 'good' },
        { kpiId: 'kpi-002', kpiName: 'Customer Acquisition Cost', category: 'marketing', score: 72, achievement: 94.1, status: 'warning' },
        { kpiId: 'kpi-003', kpiName: 'Order Completion Rate', category: 'operational', score: 88, achievement: 99.2, status: 'good' },
        { kpiId: 'kpi-004', kpiName: 'Customer Satisfaction Score', category: 'satisfaction', score: 82, achievement: 95.8, status: 'good' },
        { kpiId: 'kpi-005', kpiName: 'System Response Time', category: 'efficiency', score: 65, achievement: 81.6, status: 'warning' },
        { kpiId: 'kpi-006', kpiName: 'Monthly Active Users', category: 'growth', score: 92, achievement: 93.8, status: 'excellent' }
      ]
    };

    setScorecard(mockScorecard);
  };

  const loadKPITrendData = async (kpiId: string) => {
    // Generate mock trend data
    const mockTrendData: KPITrendData[] = [];
    const kpi = kpis.find(k => k.id === kpiId);
    if (!kpi) return;

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const baseValue = kpi.currentValue;
      const variation = baseValue * 0.1; // 10% variation
      const randomVariation = (Math.random() - 0.5) * variation;
      
      mockTrendData.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(0, baseValue + randomVariation),
        target: kpi.target
      });
    }

    setKpiTrendData(mockTrendData);
  };

  const filteredKPIs = kpis.filter(kpi => {
    const matchesSearch = kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kpi.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || kpi.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(Math.round(value));
      case 'ratio':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  const getChangePercent = (current: number, previous?: number) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial':
        return <DollarSign className="h-4 w-4" />;
      case 'customer':
        return <Users className="h-4 w-4" />;
      case 'operational':
        return <ShoppingCart className="h-4 w-4" />;
      case 'marketing':
        return <Target className="h-4 w-4" />;
      case 'efficiency':
        return <Zap className="h-4 w-4" />;
      case 'growth':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isAcknowledged: true }
        : alert
    ));
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-8 w-8 text-blue-600" />
            KPI Management Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor, track, and optimize your key performance indicators
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create KPI
          </Button>
          
          <Button onClick={loadKPIData} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Scorecard Summary */}
      {scorecard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{scorecard.overallScore}/100</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +3.2 from last period
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Performance by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {Object.entries(scorecard.categoryScores).map(([category, score]) => (
                  <div key={category} className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      {getCategoryIcon(category)}
                    </div>
                    <div className="text-lg font-bold">{score}</div>
                    <div className="text-xs text-gray-500 capitalize">{category}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search KPIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Categories</option>
          <option value="financial">Financial</option>
          <option value="marketing">Marketing</option>
          <option value="operational">Operational</option>
          <option value="customer">Customer</option>
          <option value="efficiency">Efficiency</option>
          <option value="growth">Growth</option>
          <option value="satisfaction">Satisfaction</option>
        </select>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts.filter(a => !a.isAcknowledged).length})</TabsTrigger>
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredKPIs.slice(0, 6).map((kpi) => (
              <Card key={kpi.id} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {getCategoryIcon(kpi.category)}
                    {kpi.name}
                  </CardTitle>
                  <Badge className={STATUS_COLORS[kpi.status]}>
                    {kpi.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {formatValue(kpi.currentValue, kpi.unit)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs">
                        {getTrendIcon(kpi.trend)}
                        <span className={`ml-1 ${
                          kpi.trend === 'improving' ? 'text-green-600' : 
                          kpi.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {kpi.previousValue && 
                            `${getChangePercent(kpi.currentValue, kpi.previousValue) > 0 ? '+' : ''}${getChangePercent(kpi.currentValue, kpi.previousValue).toFixed(1)}%`
                          }
                        </span>
                      </div>
                      
                      {kpi.target && (
                        <div className="text-xs text-gray-500">
                          Target: {formatValue(kpi.target, kpi.unit)}
                        </div>
                      )}
                    </div>
                    
                    {kpi.target && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((kpi.currentValue / kpi.target) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="capitalize">{kpi.frequency}</span>
                      <span>{new Date(kpi.lastUpdated).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-4">
          <div className="grid gap-4">
            {filteredKPIs.map((kpi) => (
              <Card key={kpi.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(kpi.category)}
                      <div>
                        <CardTitle className="text-lg">{kpi.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{kpi.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[kpi.status]}>
                        {kpi.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedKPI(kpi);
                          loadKPITrendData(kpi.id);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Current</div>
                      <div className="text-lg font-bold">{formatValue(kpi.currentValue, kpi.unit)}</div>
                    </div>
                    {kpi.previousValue && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Previous</div>
                        <div className="text-sm font-medium">{formatValue(kpi.previousValue, kpi.unit)}</div>
                      </div>
                    )}
                    {kpi.target && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Target</div>
                        <div className="text-sm font-medium">{formatValue(kpi.target, kpi.unit)}</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Trend</div>
                      <div className="flex items-center justify-center">
                        {getTrendIcon(kpi.trend)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Frequency</div>
                      <div className="text-sm font-medium capitalize">{kpi.frequency}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="flex items-center justify-center">
                        {kpi.isActive ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${
              alert.severity === 'critical' ? 'border-l-red-500' :
              alert.severity === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
            }`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <CardTitle className="text-lg">{alert.message}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        KPI: {alert.kpiName} • {alert.alertType.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'}>
                      {alert.severity}
                    </Badge>
                    {!alert.isAcknowledged && (
                      <Button
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Current Value</div>
                    <div className="font-medium">{alert.currentValue}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Threshold</div>
                    <div className="font-medium">{alert.thresholdValue}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Created</div>
                    <div className="font-medium">{new Date(alert.createdAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Status</div>
                    <div className="font-medium">
                      {alert.isAcknowledged ? (
                        <Badge variant="outline">Acknowledged</Badge>
                      ) : (
                        <Badge variant="destructive">Active</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {alerts.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-gray-500">No active alerts</p>
                <p className="text-sm text-gray-400 mt-1">All KPIs are performing within expected thresholds</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Scorecard Tab */}
        <TabsContent value="scorecard" className="space-y-6">
          {scorecard && (
            <>
              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(scorecard.categoryScores).map(([category, score]) => ({
                      category: category.charAt(0).toUpperCase() + category.slice(1),
                      score
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Individual KPI Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Individual KPI Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scorecard.kpiResults.map((result) => (
                      <div key={result.kpiId} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium">{result.kpiName}</h3>
                            <p className="text-sm text-gray-600 capitalize">{result.category}</p>
                          </div>
                          <Badge className={STATUS_COLORS[result.status as keyof typeof STATUS_COLORS]}>
                            {result.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Score</div>
                            <div className="text-xl font-bold">{result.score}/100</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Achievement</div>
                            <div className="text-lg font-medium">{result.achievement.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Progress</div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(result.achievement, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* KPI Detail Modal */}
      {selectedKPI && kpiTrendData.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{selectedKPI.name}</CardTitle>
                  <p className="text-gray-600 mt-1">{selectedKPI.description}</p>
                </div>
                <Button variant="outline" onClick={() => setSelectedKPI(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Current Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{formatValue(selectedKPI.currentValue, selectedKPI.unit)}</div>
                    <div className="text-sm text-gray-600">Current Value</div>
                  </div>
                  {selectedKPI.target && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{formatValue(selectedKPI.target, selectedKPI.unit)}</div>
                      <div className="text-sm text-gray-600">Target</div>
                    </div>
                  )}
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold flex items-center justify-center">
                      {getTrendIcon(selectedKPI.trend)}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">{selectedKPI.trend}</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Badge className={`${STATUS_COLORS[selectedKPI.status]} text-lg px-3 py-1`}>
                      {selectedKPI.status}
                    </Badge>
                    <div className="text-sm text-gray-600 mt-1">Status</div>
                  </div>
                </div>

                {/* Trend Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">30-Day Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={kpiTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis tickFormatter={(value) => formatValue(value, selectedKPI.unit)} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number) => [formatValue(value, selectedKPI.unit), 'Value']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      />
                      {selectedKPI.target && (
                        <Line 
                          type="monotone" 
                          dataKey="target" 
                          stroke="#EF4444" 
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};