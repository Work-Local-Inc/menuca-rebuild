import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  TrendingUp, 
  TrendingDown,
  Activity,
  Filter,
  Download,
  RefreshCw,
  Maximize2,
  Minimize2,
  Settings,
  Eye,
  EyeOff,
  Calendar,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  Share2,
  MousePointer,
  Move3d,
  Layers,
  Grid,
  Palette
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
  Pie,
  ScatterChart,
  Scatter,
  ReferenceLine,
  ReferenceArea,
  Brush,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  Sankey,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';

interface DataPoint {
  id: string;
  name: string;
  value: number;
  category: string;
  timestamp: Date;
  metadata?: any;
}

interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  dataSource: string;
  xAxis: string;
  yAxis: string[];
  filters: ChartFilter[];
  colors: string[];
  animation: boolean;
  interactive: boolean;
  showGrid: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  timeRange: { start: Date; end: Date };
}

enum ChartType {
  LINE = 'line',
  AREA = 'area',
  BAR = 'bar',
  PIE = 'pie',
  SCATTER = 'scatter',
  COMPOSED = 'composed',
  RADAR = 'radar',
  TREEMAP = 'treemap',
  FUNNEL = 'funnel',
  SANKEY = 'sankey'
}

interface ChartFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
  active: boolean;
}

interface VisualizationTheme {
  name: string;
  colors: {
    primary: string[];
    background: string;
    text: string;
    grid: string;
    accent: string;
  };
}

const CHART_THEMES: VisualizationTheme[] = [
  {
    name: 'Modern Blue',
    colors: {
      primary: ['#3B82F6', '#1D4ED8', '#0EA5E9', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      background: '#FFFFFF',
      text: '#1F2937',
      grid: '#E5E7EB',
      accent: '#6366F1'
    }
  },
  {
    name: 'Dark Mode',
    colors: {
      primary: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#FB7185', '#4ADE80', '#38BDF8'],
      background: '#1F2937',
      text: '#F9FAFB',
      grid: '#374151',
      accent: '#818CF8'
    }
  },
  {
    name: 'Vibrant',
    colors: {
      primary: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FFB347', '#87CEEB'],
      background: '#FFFFFF',
      text: '#2C3E50',
      grid: '#BDC3C7',
      accent: '#E74C3C'
    }
  }
];

const SAMPLE_DATA = {
  revenue: [
    { name: 'Jan', value: 45000, target: 50000, category: 'Q1' },
    { name: 'Feb', value: 52000, target: 50000, category: 'Q1' },
    { name: 'Mar', value: 48000, target: 50000, category: 'Q1' },
    { name: 'Apr', value: 61000, target: 55000, category: 'Q2' },
    { name: 'May', value: 55000, target: 55000, category: 'Q2' },
    { name: 'Jun', value: 58000, target: 55000, category: 'Q2' }
  ],
  performance: [
    { category: 'Orders', value: 1250, change: 12.5 },
    { category: 'Revenue', value: 284750, change: 8.3 },
    { category: 'Customers', value: 892, change: -2.1 },
    { category: 'Conversion', value: 4.2, change: 15.7 }
  ],
  distribution: [
    { name: 'Mobile', value: 45, color: '#3B82F6' },
    { name: 'Desktop', value: 35, color: '#10B981' },
    { name: 'Tablet', value: 20, color: '#F59E0B' }
  ],
  correlation: Array.from({ length: 50 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100 + Math.random() * 20,
    size: Math.random() * 1000 + 100,
    category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
  }))
};

export const InteractiveDataVisualization: React.FC = () => {
  const [activeTheme, setActiveTheme] = useState<VisualizationTheme>(CHART_THEMES[0]);
  const [selectedChart, setSelectedChart] = useState<ChartType>(ChartType.LINE);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnimated, setIsAnimated] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);
  const [brushRange, setBrushRange] = useState<any>(null);
  const [filters, setFilters] = useState<ChartFilter[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);

  // Real-time data simulation
  const [liveData, setLiveData] = useState(SAMPLE_DATA.revenue);
  const [dataHistory, setDataHistory] = useState<any[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setLiveData(prev => {
          const newData = [...prev];
          const lastMonth = newData[newData.length - 1];
          const nextValue = lastMonth.value + (Math.random() - 0.5) * 10000;
          
          newData.push({
            name: `Month ${newData.length + 1}`,
            value: Math.max(0, nextValue),
            target: lastMonth.target + 5000,
            category: `Q${Math.ceil((newData.length + 1) / 3)}`
          });
          
          // Keep only last 12 months
          if (newData.length > 12) {
            newData.shift();
          }
          
          setDataHistory(prev => [...prev, { timestamp: new Date(), data: [...newData] }]);
          
          return newData;
        });
      }, playbackSpeed);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed]);

  const filteredData = useMemo(() => {
    let data = liveData;
    
    filters.forEach(filter => {
      if (!filter.active) return;
      
      data = data.filter(item => {
        const fieldValue = (item as any)[filter.field];
        
        switch (filter.operator) {
          case 'equals':
            return fieldValue === filter.value;
          case 'contains':
            return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'greater_than':
            return Number(fieldValue) > Number(filter.value);
          case 'less_than':
            return Number(fieldValue) < Number(filter.value);
          default:
            return true;
        }
      });
    });
    
    return data;
  }, [liveData, filters]);

  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    switch (selectedChart) {
      case ChartType.LINE:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={activeTheme.colors.grid} />}
              <XAxis dataKey="name" stroke={activeTheme.colors.text} />
              <YAxis stroke={activeTheme.colors.text} />
              {showLegend && <Legend />}
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: activeTheme.colors.background,
                  border: `1px solid ${activeTheme.colors.grid}`,
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={activeTheme.colors.primary[0]} 
                strokeWidth={3}
                dot={{ fill: activeTheme.colors.primary[0], strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: activeTheme.colors.accent }}
                animationDuration={isAnimated ? 1000 : 0}
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke={activeTheme.colors.primary[1]} 
                strokeDasharray="5 5"
                dot={false}
                animationDuration={isAnimated ? 1000 : 0}
              />
              {brushRange && <Brush dataKey="name" height={30} />}
            </LineChart>
          </ResponsiveContainer>
        );

      case ChartType.AREA:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={activeTheme.colors.grid} />}
              <XAxis dataKey="name" stroke={activeTheme.colors.text} />
              <YAxis stroke={activeTheme.colors.text} />
              {showLegend && <Legend />}
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={activeTheme.colors.primary[0]} 
                fill={`${activeTheme.colors.primary[0]}30`}
                strokeWidth={2}
                animationDuration={isAnimated ? 1000 : 0}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case ChartType.BAR:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={activeTheme.colors.grid} />}
              <XAxis dataKey="name" stroke={activeTheme.colors.text} />
              <YAxis stroke={activeTheme.colors.text} />
              {showLegend && <Legend />}
              <Tooltip />
              <Bar 
                dataKey="value" 
                fill={activeTheme.colors.primary[0]}
                animationDuration={isAnimated ? 1000 : 0}
                onClick={(data) => setSelectedDataPoint(data)}
              />
              <Bar 
                dataKey="target" 
                fill={activeTheme.colors.primary[1]}
                opacity={0.7}
                animationDuration={isAnimated ? 1000 : 0}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case ChartType.PIE:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={SAMPLE_DATA.distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                animationDuration={isAnimated ? 1000 : 0}
                onClick={(data) => setSelectedDataPoint(data)}
              >
                {SAMPLE_DATA.distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case ChartType.SCATTER:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={activeTheme.colors.grid} />}
              <XAxis dataKey="x" stroke={activeTheme.colors.text} />
              <YAxis dataKey="y" stroke={activeTheme.colors.text} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter 
                name="Data Points" 
                data={SAMPLE_DATA.correlation} 
                fill={activeTheme.colors.primary[0]}
                onClick={(data) => setSelectedDataPoint(data)}
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case ChartType.RADAR:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={SAMPLE_DATA.performance}>
              <PolarGrid stroke={activeTheme.colors.grid} />
              <PolarAngleAxis dataKey="category" stroke={activeTheme.colors.text} />
              <PolarRadiusAxis stroke={activeTheme.colors.text} />
              <Radar
                name="Performance"
                dataKey="value"
                stroke={activeTheme.colors.primary[0]}
                fill={`${activeTheme.colors.primary[0]}30`}
                fillOpacity={0.6}
                strokeWidth={2}
                animationDuration={isAnimated ? 1000 : 0}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return <div className="flex items-center justify-center h-96 text-gray-500">Select a chart type to visualize data</div>;
    }
  };

  const addFilter = () => {
    const newFilter: ChartFilter = {
      field: 'name',
      operator: 'contains',
      value: '',
      active: true
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const exportChart = (format: 'png' | 'svg' | 'pdf') => {
    console.log(`Exporting chart as ${format}`);
    // Implementation would depend on chart library export capabilities
  };

  return (
    <div className={`p-6 space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'bg-gray-50 min-h-screen'}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Interactive Data Visualization
          </h1>
          <p className="text-gray-600 mt-1">
            Advanced data visualization with real-time updates and interactive controls
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant={isFullscreen ? "outline" : "default"}
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-2"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Chart Type Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Chart Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.values(ChartType).map((type) => (
              <Button
                key={type}
                variant={selectedChart === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChart(type)}
                className="w-full justify-start capitalize"
              >
                {type === ChartType.LINE && <LineChartIcon className="h-3 w-3 mr-2" />}
                {type === ChartType.BAR && <BarChart3 className="h-3 w-3 mr-2" />}
                {type === ChartType.PIE && <PieChartIcon className="h-3 w-3 mr-2" />}
                {type === ChartType.AREA && <Activity className="h-3 w-3 mr-2" />}
                {type}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Theme Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {CHART_THEMES.map((theme) => (
              <Button
                key={theme.name}
                variant={activeTheme.name === theme.name ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTheme(theme)}
                className="w-full justify-start"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: theme.colors.primary[0] }}
                  />
                  {theme.name}
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Display Options */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Display Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs">Animation</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAnimated(!isAnimated)}
              >
                {isAnimated ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Grid</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
              >
                {showGrid ? <Grid3x3 className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Legend</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLegend(!showLegend)}
              >
                {showLegend ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Playback Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Play className="h-4 w-4" />
              Real-time Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLiveData(SAMPLE_DATA.revenue);
                  setDataHistory([]);
                }}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1">
              <label className="text-xs">Speed (ms)</label>
              <Input
                type="number"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                min="100"
                max="5000"
                step="100"
                className="h-8"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Visualization */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              {selectedChart === ChartType.LINE && <LineChartIcon className="h-5 w-5" />}
              {selectedChart === ChartType.BAR && <BarChart3 className="h-5 w-5" />}
              {selectedChart === ChartType.PIE && <PieChartIcon className="h-5 w-5" />}
              Revenue Analytics - {selectedChart.charAt(0).toUpperCase() + selectedChart.slice(1)} Chart
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {isPlaying ? 'Live' : 'Static'}
              </Badge>
              <Badge variant="outline">
                {filteredData.length} data points
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ backgroundColor: activeTheme.colors.background }} className="rounded-lg p-4">
            {renderChart()}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Data Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Data Filters
              </CardTitle>
              <Button size="sm" onClick={addFilter}>
                Add Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filters.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No filters applied</p>
            ) : (
              <div className="space-y-3">
                {filters.map((filter, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <select
                      value={filter.field}
                      onChange={(e) => {
                        const newFilters = [...filters];
                        newFilters[index].field = e.target.value;
                        setFilters(newFilters);
                      }}
                      className="flex-1 text-sm border rounded px-2 py-1"
                    >
                      <option value="name">Name</option>
                      <option value="value">Value</option>
                      <option value="category">Category</option>
                    </select>
                    <select
                      value={filter.operator}
                      onChange={(e) => {
                        const newFilters = [...filters];
                        newFilters[index].operator = e.target.value as any;
                        setFilters(newFilters);
                      }}
                      className="flex-1 text-sm border rounded px-2 py-1"
                    >
                      <option value="equals">Equals</option>
                      <option value="contains">Contains</option>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                    </select>
                    <Input
                      value={filter.value}
                      onChange={(e) => {
                        const newFilters = [...filters];
                        newFilters[index].value = e.target.value;
                        setFilters(newFilters);
                      }}
                      className="flex-1 h-8"
                      placeholder="Value"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFilter(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Data Point Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Data Point Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDataPoint ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedDataPoint).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="text-xs text-gray-500 capitalize">{key}</div>
                      <div className="font-medium">
                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDataPoint(null)}
                  className="w-full"
                >
                  Clear Selection
                </Button>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Click on a data point in the chart to view details
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data History Timeline */}
      {dataHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Data History Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {dataHistory.slice(-10).map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>{entry.timestamp.toLocaleTimeString()}</span>
                  <span>{entry.data.length} data points</span>
                  <Badge variant="outline" className="text-xs">
                    Latest: {entry.data[entry.data.length - 1]?.value?.toLocaleString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};