import React, { useState, useEffect } from 'react';
import { WeatherService, WeatherData } from '@/services/weatherService';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface WeatherHistoryViewerProps {
  projectId: string;
  className?: string;
}

export const WeatherHistoryViewer: React.FC<WeatherHistoryViewerProps> = ({
  projectId,
  className = ''
}) => {
  const [historicalData, setHistoricalData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const fetchHistoricalData = async () => {
    setLoading(true);
    try {
      const data = await WeatherService.getHistoricalWeatherForProject(
        projectId,
        startDate,
        endDate
      );
      setHistoricalData(data);
    } catch (error) {
      console.error('Error fetching historical weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (historicalData.length === 0) return;

    const csvData = [
      ['Date', 'Temperature (°F)', 'Condition', 'Humidity (%)', 'Wind Speed (mph)'],
      ...historicalData.map(item => [
        format(new Date(item.last_updated!), 'yyyy-MM-dd HH:mm'),
        item.temperature_current.toString(),
        item.condition,
        item.humidity.toString(),
        item.wind_speed.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather-history-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (projectId) {
      fetchHistoricalData();
    }
  }, [projectId, startDate, endDate]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Weather History
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Start date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>End date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && setEndDate(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Button onClick={fetchHistoricalData} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>

          {historicalData.length > 0 && (
            <Button onClick={exportData} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading historical weather data...
          </div>
        )}
        
        {!loading && historicalData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No historical weather data found for the selected date range.
          </div>
        )}

        {!loading && historicalData.length > 0 && (
          <div className="space-y-2">
            {historicalData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {WeatherService.getWeatherIcon(item.condition)}
                  </span>
                  <div>
                    <div className="font-medium">
                      {format(new Date(item.last_updated!), 'MMM dd, yyyy HH:mm')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.condition}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {WeatherService.formatTemperature(item.temperature_current)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Humidity: {item.humidity}% • Wind: {item.wind_speed} mph
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};