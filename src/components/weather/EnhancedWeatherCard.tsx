import React, { useState } from 'react';
import { useWeatherData } from '@/hooks/useWeatherData';
import { WeatherService } from '@/services/weatherService';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, TrendingUp, History } from 'lucide-react';
import { WeatherHistoryViewer } from './WeatherHistoryViewer';
import { WeatherTrendsChart } from './WeatherTrendsChart';

interface EnhancedWeatherCardProps {
  projectId: string;
  address?: string;
  className?: string;
  showHistorical?: boolean;
}

export const EnhancedWeatherCard: React.FC<EnhancedWeatherCardProps> = ({
  projectId,
  address,
  className = '',
  showHistorical = false
}) => {
  const { weatherData, loading, error, refreshWeather } = useWeatherData(projectId, address);
  const [activeTab, setActiveTab] = useState<string>(showHistorical ? 'historical' : 'current');

  const getCurrentWeatherContent = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-4 w-16" />
        </div>
      );
    }

    if (error || !weatherData) {
      return (
        <div className="flex items-center gap-2 text-destructive">
          <span>Weather unavailable</span>
          {address && (
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshWeather}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      );
    }

    const icon = WeatherService.getWeatherIcon(weatherData.condition);
    const temp = WeatherService.formatTemperature(weatherData.temperature_current);
    
    const getFreshnessText = () => {
      if (!weatherData.cached || !weatherData.age_minutes) return '';
      if (weatherData.age_minutes < 60) {
        return `${weatherData.age_minutes}m ago`;
      }
      const hours = Math.round(weatherData.age_minutes / 60);
      return `${hours}h ago`;
    };

    const freshnessText = getFreshnessText();
    const isStale = weatherData.age_minutes && weatherData.age_minutes > 60;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <div className="text-lg font-semibold">{temp}</div>
              <div className="text-sm text-muted-foreground">{weatherData.condition}</div>
            </div>
          </div>
          {address && (
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshWeather}
              className="h-8 w-8 p-0"
              title="Refresh weather data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Humidity:</span>
            <span>{weatherData.humidity}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Wind:</span>
            <span>{weatherData.wind_speed} mph</span>
          </div>
        </div>

        {freshnessText && (
          <div className="flex items-center gap-2">
            <Badge variant={isStale ? "destructive" : "secondary"} className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {freshnessText}
            </Badge>
            {isStale && (
              <span className="text-xs text-muted-foreground">Data may be outdated</span>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!showHistorical) {
    // Simple mode - just show current weather
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Weather</CardTitle>
        </CardHeader>
        <CardContent>
          {getCurrentWeatherContent()}
        </CardContent>
      </Card>
    );
  }

  // Enhanced mode with tabs for current and historical data
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Weather Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Live
            </TabsTrigger>
            <TabsTrigger value="historical" className="text-xs">
              <History className="h-3 w-3 mr-1" />
              History
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-4">
            {getCurrentWeatherContent()}
          </TabsContent>

          <TabsContent value="historical" className="mt-4">
            <WeatherHistoryViewer projectId={projectId} />
          </TabsContent>

          <TabsContent value="trends" className="mt-4">
            <WeatherTrendsChart projectId={projectId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};