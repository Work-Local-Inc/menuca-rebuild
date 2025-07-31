import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  PieChart,
  TrendingUp,
  Target,
  Activity,
  Brain,
  Settings,
  Download,
  RefreshCw,
  Calendar,
  Users,
  DollarSign,
  ShoppingCart,
  Eye
} from 'lucide-react';

// Import our analytics components
import { CampaignAnalyticsDashboard } from '@/components/analytics/CampaignAnalyticsDashboard';
import { BusinessIntelligenceDashboard } from '@/components/analytics/BusinessIntelligenceDashboard';
import { KPIManagementDashboard } from '@/components/analytics/KPIManagementDashboard';
import { InteractiveDataVisualization } from '@/components/analytics/InteractiveDataVisualization';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  conversionRate: number;
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for overview
  const stats: DashboardStats = {
    totalRevenue: 284750,
    totalOrders: 1247,
    activeUsers: 892,
    conversionRate: 4.2
  };

  const refreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="h-10 w-10 text-blue-600" />
              MenuCA Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Real-time business intelligence and predictive analytics platform
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={refreshData} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-blue-100 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalOrders.toLocaleString()}
            </div>
            <p className="text-xs text-green-100 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Active Users</CardTitle>
            <Users className="h-4 w-4 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeUsers.toLocaleString()}
            </div>
            <p className="text-xs text-purple-100 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15.7% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-orange-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.conversionRate}%
            </div>
            <p className="text-xs text-orange-100 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +0.8% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-12">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="business-intelligence" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Business Intelligence
          </TabsTrigger>
          <TabsTrigger value="kpi-management" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            KPI Management
          </TabsTrigger>
          <TabsTrigger value="data-visualization" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Data Visualization
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Platform Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Campaign Analytics</span>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Active</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Business Intelligence</span>
                    </div>
                    <span className="text-sm text-blue-600 font-medium">Active</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">KPI Tracking</span>
                    </div>
                    <span className="text-sm text-purple-600 font-medium">Active</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <PieChart className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">Interactive Visualizations</span>
                    </div>
                    <span className="text-sm text-orange-600 font-medium">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">New campaign launched: Summer Sale 2024</span>
                    <span className="text-gray-400 ml-auto">2 hours ago</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">KPI threshold exceeded: Monthly Revenue</span>
                    <span className="text-gray-400 ml-auto">4 hours ago</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-600">Anomaly detected: Customer acquisition cost</span>
                    <span className="text-gray-400 ml-auto">6 hours ago</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">Report generated: Weekly performance summary</span>
                    <span className="text-gray-400 ml-auto">1 day ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>🎉 Welcome to MenuCA Analytics Platform!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Your Advanced Analytics Platform is Ready! 🚀
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Explore our comprehensive suite of analytics tools designed to give you deep insights 
                  into your business performance. Navigate through the tabs above to discover:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-blue-900">Campaign Analytics</h4>
                    <p className="text-sm text-blue-600">Real-time marketing insights</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <Brain className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-green-900">Business Intelligence</h4>
                    <p className="text-sm text-green-600">Executive dashboards</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-purple-900">KPI Management</h4>
                    <p className="text-sm text-purple-600">Performance tracking</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <PieChart className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-orange-900">Data Visualization</h4>
                    <p className="text-sm text-orange-600">Interactive charts</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaign Analytics Tab */}
        <TabsContent value="campaigns">
          <CampaignAnalyticsDashboard />
        </TabsContent>

        {/* Business Intelligence Tab */}
        <TabsContent value="business-intelligence">
          <BusinessIntelligenceDashboard />
        </TabsContent>

        {/* KPI Management Tab */}
        <TabsContent value="kpi-management">
          <KPIManagementDashboard />
        </TabsContent>

        {/* Data Visualization Tab */}
        <TabsContent value="data-visualization">
          <InteractiveDataVisualization />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;