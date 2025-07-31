import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  PieChart, 
  Target,
  DollarSign,
  Users,
  Eye,
  MousePointer,
  Zap,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  status: 'active' | 'paused' | 'completed';
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
  roi: number;
  ctr: number;
  cpc: number;
  cpa: number;
  reach: number;
  engagement: number;
  lastUpdated: string;
}

interface CampaignTrend {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
}

interface CampaignInsight {
  id: string;
  type: 'optimization' | 'warning' | 'opportunity' | 'achievement';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendations: string[];
  relatedCampaign: string;
}

interface CampaignSegment {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#6366F1',
  gray: '#6B7280'
};

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6', '#F97316', '#06B6D4'];

export const CampaignAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  
  // Data state
  const [campaigns, setCampaigns] = useState<CampaignMetrics[]>([]);
  const [campaignTrends, setCampaignTrends] = useState<CampaignTrend[]>([]);
  const [insights, setInsights] = useState<CampaignInsight[]>([]);
  const [audienceSegments, setAudienceSegments] = useState<CampaignSegment[]>([]);
  const [channelPerformance, setChannelPerformance] = useState<CampaignSegment[]>([]);

  // Summary metrics state
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0,
    totalCost: 0,
    avgROI: 0,
    avgCTR: 0,
    avgCPC: 0,
    activeCampaigns: 0
  });

  useEffect(() => {
    loadCampaignData();
  }, [selectedTimeRange, selectedCampaign]);

  const loadCampaignData = async () => {
    setLoading(true);
    try {
      // Simulate API calls - in real implementation, these would be actual API calls
      await Promise.all([
        loadCampaignMetrics(),
        loadCampaignTrends(),
        loadCampaignInsights(),
        loadAudienceSegments(),
        loadChannelPerformance()
      ]);
    } catch (error) {
      console.error('Error loading campaign data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignMetrics = async () => {
    // Mock data - replace with actual API call
    const mockCampaigns: CampaignMetrics[] = [
      {
        campaignId: 'camp-001',
        campaignName: 'Summer Food Festival 2025',
        status: 'active',
        impressions: 125000,
        clicks: 3200,
        conversions: 180,
        revenue: 8500,
        cost: 2800,
        roi: 203.57,
        ctr: 2.56,
        cpc: 0.88,
        cpa: 15.56,
        reach: 98000,
        engagement: 4100,
        lastUpdated: new Date().toISOString()
      },
      {
        campaignId: 'camp-002',
        campaignName: 'Weekend Brunch Special',
        status: 'active',
        impressions: 89000,
        clicks: 2100,
        conversions: 95,
        revenue: 4200,
        cost: 1600,
        roi: 162.50,
        ctr: 2.36,
        cpc: 0.76,
        cpa: 16.84,
        reach: 67000,
        engagement: 2300,
        lastUpdated: new Date().toISOString()
      },
      {
        campaignId: 'camp-003',
        campaignName: 'New Restaurant Launch',
        status: 'paused',
        impressions: 45000,
        clicks: 800,
        conversions: 25,
        revenue: 1200,
        cost: 900,
        roi: 33.33,
        ctr: 1.78,
        cpc: 1.13,
        cpa: 36.00,
        reach: 34000,
        engagement: 950,
        lastUpdated: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    setCampaigns(mockCampaigns);

    // Calculate summary metrics
    const summary = mockCampaigns.reduce((acc, campaign) => ({
      totalImpressions: acc.totalImpressions + campaign.impressions,
      totalClicks: acc.totalClicks + campaign.clicks,
      totalConversions: acc.totalConversions + campaign.conversions,
      totalRevenue: acc.totalRevenue + campaign.revenue,
      totalCost: acc.totalCost + campaign.cost,
      avgROI: 0, // Will calculate after
      avgCTR: 0, // Will calculate after
      avgCPC: 0, // Will calculate after
      activeCampaigns: acc.activeCampaigns + (campaign.status === 'active' ? 1 : 0)
    }), {
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
      totalCost: 0,
      avgROI: 0,
      avgCTR: 0,
      avgCPC: 0,
      activeCampaigns: 0
    });

    // Calculate averages
    summary.avgROI = summary.totalCost > 0 ? ((summary.totalRevenue - summary.totalCost) / summary.totalCost) * 100 : 0;
    summary.avgCTR = summary.totalImpressions > 0 ? (summary.totalClicks / summary.totalImpressions) * 100 : 0;
    summary.avgCPC = summary.totalClicks > 0 ? summary.totalCost / summary.totalClicks : 0;

    setSummaryMetrics(summary);
  };

  const loadCampaignTrends = async () => {
    // Mock trend data for the last 30 days
    const mockTrends: CampaignTrend[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      mockTrends.push({
        date: date.toISOString().split('T')[0],
        impressions: Math.floor(Math.random() * 5000) + 2000,
        clicks: Math.floor(Math.random() * 150) + 50,
        conversions: Math.floor(Math.random() * 15) + 3,
        revenue: Math.floor(Math.random() * 500) + 100,
        cost: Math.floor(Math.random() * 200) + 50
      });
    }

    setCampaignTrends(mockTrends);
  };

  const loadCampaignInsights = async () => {
    const mockInsights: CampaignInsight[] = [
      {
        id: 'insight-001',
        type: 'opportunity',
        title: 'High-Performing Audience Segment Identified',
        description: 'Ages 25-34 segment showing 40% higher conversion rates than campaign average.',
        impact: 'high',
        actionable: true,
        recommendations: [
          'Increase budget allocation to 25-34 age segment',
          'Create specific content targeting this demographic',
          'Test similar lookalike audiences'
        ],
        relatedCampaign: 'Summer Food Festival 2025'
      },
      {
        id: 'insight-002',
        type: 'warning',
        title: 'Campaign Performance Declining',
        description: 'New Restaurant Launch campaign CTR dropped 25% in the last 7 days.',
        impact: 'medium',
        actionable: true,
        recommendations: [
          'Refresh ad creative with new images',
          'Test different ad copy variations',
          'Review audience targeting settings'
        ],
        relatedCampaign: 'New Restaurant Launch'
      },
      {
        id: 'insight-003',
        type: 'achievement',
        title: 'ROI Target Exceeded',
        description: 'Weekend Brunch Special achieved 162% ROI, exceeding the 150% target.',
        impact: 'high',
        actionable: true,
        recommendations: [
          'Scale budget for this campaign',
          'Apply successful strategies to other campaigns',
          'Document winning creative elements'
        ],
        relatedCampaign: 'Weekend Brunch Special'
      }
    ];

    setInsights(mockInsights);
  };

  const loadAudienceSegments = async () => {
    const mockSegments: CampaignSegment[] = [
      { name: 'Ages 25-34', value: 4200, percentage: 35, color: PIE_COLORS[0] },
      { name: 'Ages 35-44', value: 3000, percentage: 25, color: PIE_COLORS[1] },
      { name: 'Ages 18-24', value: 2400, percentage: 20, color: PIE_COLORS[2] },
      { name: 'Ages 45-54', value: 1800, percentage: 15, color: PIE_COLORS[3] },
      { name: 'Ages 55+', value: 600, percentage: 5, color: PIE_COLORS[4] }
    ];

    setAudienceSegments(mockSegments);
  };

  const loadChannelPerformance = async () => {
    const mockChannels: CampaignSegment[] = [
      { name: 'Social Media', value: 5800, percentage: 45, color: PIE_COLORS[0] },
      { name: 'Google Ads', value: 3900, percentage: 30, color: PIE_COLORS[1] },
      { name: 'Email Marketing', value: 1950, percentage: 15, color: PIE_COLORS[2] },
      { name: 'Display Ads', value: 1300, percentage: 10, color: PIE_COLORS[3] }
    ];

    setChannelPerformance(mockChannels);
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
    return `${value.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'achievement': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'border-l-red-500 bg-red-50';
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
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Campaign Performance Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time insights and performance metrics for your marketing campaigns
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <Button onClick={loadCampaignData} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summaryMetrics.totalImpressions)}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12.5% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summaryMetrics.totalClicks)}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +8.3% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summaryMetrics.totalConversions)}</div>
            <div className="flex items-center text-xs text-red-600">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -2.1% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalRevenue)}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +15.7% from last period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Cost Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={campaignTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.6} />
                    <Area type="monotone" dataKey="cost" stackId="2" stroke={COLORS.danger} fill={COLORS.danger} fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average ROI</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{formatPercentage(summaryMetrics.avgROI)}</span>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average CTR</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{formatPercentage(summaryMetrics.avgCTR)}</span>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average CPC</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{formatCurrency(summaryMetrics.avgCPC)}</span>
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Campaigns</span>
                  <span className="text-lg font-bold">{summaryMetrics.activeCampaigns}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Engagement Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={campaignTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke={COLORS.primary} 
                    strokeWidth={2}
                    dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conversions" 
                    stroke={COLORS.success} 
                    strokeWidth={2}
                    dot={{ fill: COLORS.success, strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.campaignId} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{campaign.campaignName}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated {new Date(campaign.lastUpdated).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Impressions</div>
                      <div className="text-sm font-bold">{formatNumber(campaign.impressions)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Clicks</div>
                      <div className="text-sm font-bold">{formatNumber(campaign.clicks)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">CTR</div>
                      <div className="text-sm font-bold">{formatPercentage(campaign.ctr)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Conversions</div>
                      <div className="text-sm font-bold">{formatNumber(campaign.conversions)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Revenue</div>
                      <div className="text-sm font-bold">{formatCurrency(campaign.revenue)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Cost</div>
                      <div className="text-sm font-bold">{formatCurrency(campaign.cost)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">ROI</div>
                      <div className={`text-sm font-bold ${campaign.roi > 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(campaign.roi)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">CPC</div>
                      <div className="text-sm font-bold">{formatCurrency(campaign.cpc)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Channel Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={channelPerformance}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {channelPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ROI Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign ROI Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={campaigns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="campaignName" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                    <Bar dataKey="roi" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audience Segments */}
            <Card>
              <CardHeader>
                <CardTitle>Audience Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={audienceSegments}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {audienceSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Segment Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Segment Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {audienceSegments.map((segment, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                      <span className="text-sm font-medium">{segment.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{formatNumber(segment.value)}</div>
                      <div className="text-xs text-gray-500">{segment.percentage}%</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {insights.map((insight) => (
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
                  <Badge variant="outline">{insight.impact} impact</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <strong>Related Campaign:</strong> {insight.relatedCampaign}
                  </div>
                  
                  {insight.actionable && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recommended Actions:</h4>
                      <ul className="space-y-1">
                        {insight.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
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
          
          {insights.length === 0 && !loading && (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No insights available for the selected time period.</p>
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