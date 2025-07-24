import React, { useState, useEffect } from 'react';
import { WeatherService, WeatherData } from '@/services/weatherService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { BarChart3 } from 'lucide-react';

interface WeatherTrendsChartProps {
  projectId: string;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
}

export const WeatherTrendsChart: React.FC<WeatherTrendsChartProps> = ({
  projectId,
  className = ''
}) => {
  const [trendsData, setTrendsData] = useState<WeatherData[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number>(7);

  const fetchTrendsData = async () => {
    setLoading(true);
    try {
      const data = await WeatherService.getWeatherTrendsForProject(projectId, selectedDays);
      setTrendsData(data);
      
      // Transform data for chart
      const transformed = data.map(item => ({
        date: format(new Date(item.last_updated!), 'MMM dd'),
        temperature: item.temperature_current,
        humidity: item.humidity,
        windSpeed: item.wind_speed,
        condition: item.condition
      }));
      
      setChartData(transformed.reverse()); // Reverse to show chronological order
    } catch (error) {
      console.error('Error fetching weather trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTemperatureTrend = () => {
    if (chartData.length < 2) return 'stable';
    const firstTemp = chartData[0].temperature;
    const lastTemp = chartData[chartData.length - 1].temperature;
    const diff = lastTemp - firstTemp;
    
    if (diff > 5) return 'rising';
    if (diff < -5) return 'falling';
    return 'stable';
  };

  const getAverageTemperature = () => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, item) => acc + item.temperature, 0);
    return Math.round(sum / chartData.length);
  };

  useEffect(() => {
    if (projectId) {
      fetchTrendsData();
    }
  }, [projectId, selectedDays]);

  const temperatureTrend = getTemperatureTrend();
  const avgTemperature = getAverageTemperature();

  return (
    <div className={className}>
      {/* Compact Header */}
      <div className="mb-3">
        <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
          <BarChart3 className="h-3 w-3" />
          Weather Trends
        </h3>
        <div className="flex items-center gap-1">
          <Select value={selectedDays.toString()} onValueChange={(value) => setSelectedDays(parseInt(value))}>
            <SelectTrigger className="w-20 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7d</SelectItem>
              <SelectItem value="14">14d</SelectItem>
              <SelectItem value="30">30d</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchTrendsData} disabled={loading} variant="outline" size="sm" className="text-xs h-7 px-2">
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Loading trends...
        </div>
      )}
      
      {!loading && chartData.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No data available for trends.
        </div>
      )}

      {!loading && chartData.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {/* Compact Summary Stats */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="text-sm font-bold">{avgTemperature}°F</div>
              <div className="text-muted-foreground">Avg Temp</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="text-sm font-bold capitalize">{temperatureTrend}</div>
              <div className="text-muted-foreground">Trend</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="text-sm font-bold">{chartData.length}</div>
              <div className="text-muted-foreground">Points</div>
            </div>
          </div>

          {/* Compact Temperature Chart */}
          <div className="h-32">
            <h4 className="text-xs font-medium mb-1 text-muted-foreground">Temperature</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={25}
                />
                <Tooltip 
                  contentStyle={{ 
                    fontSize: '11px',
                    padding: '4px 6px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '4px'
                  }}
                  formatter={(value) => [`${value}°F`, 'Temp']}
                />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Compact Humidity & Wind Chart */}
          <div className="h-32">
            <h4 className="text-xs font-medium mb-1 text-muted-foreground">Humidity & Wind</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={25}
                />
                <Tooltip 
                  contentStyle={{ 
                    fontSize: '11px',
                    padding: '4px 6px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '4px'
                  }}
                  formatter={(value, name) => [
                    name === 'humidity' ? `${value}%` : `${value}mph`,
                    name === 'humidity' ? 'Humidity' : 'Wind'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="windSpeed" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};