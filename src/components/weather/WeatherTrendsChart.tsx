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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Weather Trends
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={selectedDays.toString()} onValueChange={(value) => setSelectedDays(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchTrendsData} disabled={loading} variant="outline">
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading weather trends...
          </div>
        )}
        
        {!loading && chartData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No weather data available for trends analysis.
          </div>
        )}

        {!loading && chartData.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{avgTemperature}°F</div>
                <div className="text-sm text-muted-foreground">Average Temp</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold capitalize">{temperatureTrend}</div>
                <div className="text-sm text-muted-foreground">Trend</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{chartData.length}</div>
                <div className="text-sm text-muted-foreground">Data Points</div>
              </div>
            </div>

            {/* Temperature Chart */}
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'temperature' ? `${value}°F` : value,
                      name === 'temperature' ? 'Temperature' : 
                      name === 'humidity' ? 'Humidity' : 'Wind Speed'
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Temperature (°F)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Humidity & Wind Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'humidity' ? `${value}%` : `${value} mph`,
                      name === 'humidity' ? 'Humidity' : 'Wind Speed'
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="humidity" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="Humidity (%)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="windSpeed" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    name="Wind Speed (mph)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};