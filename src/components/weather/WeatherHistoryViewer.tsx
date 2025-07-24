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
    <div className={className}>
      {/* Compact Header */}
      <div className="mb-3">
        <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Weather History
        </h3>
        <div className="flex items-center gap-1 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs h-7 px-2",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1 h-3 w-3" />
                {startDate ? format(startDate, "MM/dd") : "Start"}
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
                size="sm"
                className={cn(
                  "text-xs h-7 px-2",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1 h-3 w-3" />
                {endDate ? format(endDate, "MM/dd") : "End"}
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

          <Button onClick={fetchHistoricalData} disabled={loading} size="sm" className="text-xs h-7 px-2">
            {loading ? 'Loading...' : 'Refresh'}
          </Button>

          {historicalData.length > 0 && (
            <Button onClick={exportData} variant="outline" size="sm" className="text-xs h-7 px-2">
              <Download className="mr-1 h-3 w-3" />
              CSV
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Loading...
        </div>
      )}
      
      {!loading && historicalData.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No data found for selected range.
        </div>
      )}

      {!loading && historicalData.length > 0 && (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {historicalData.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-1.5 px-2 border-b last:border-b-0 text-xs"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm">
                  {WeatherService.getWeatherIcon(item.condition)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {format(new Date(item.last_updated!), 'MM/dd HH:mm')}
                  </div>
                  <div className="text-muted-foreground truncate">
                    {item.condition}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className="font-semibold">
                  {WeatherService.formatTemperature(item.temperature_current)}
                </div>
                <div className="text-muted-foreground">
                  {item.humidity}% • {item.wind_speed}mph
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};