import React from 'react';
import { useWeatherData } from '@/hooks/useWeatherData';
import { WeatherService } from '@/services/weatherService';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ProjectWeatherCardProps {
  projectId: string;
  address?: string;
  className?: string;
}

export const ProjectWeatherCard: React.FC<ProjectWeatherCardProps> = ({
  projectId,
  address,
  className = ''
}) => {
  const { weatherData, loading, error, refreshWeather } = useWeatherData(projectId, address);

  if (loading) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className={`text-sm text-muted-foreground flex items-center gap-2 ${className}`}>
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
  
  // Format data freshness
  const getFreshnessText = () => {
    if (!weatherData.cached || !weatherData.age_minutes) return '';
    if (weatherData.age_minutes < 60) {
      return `${weatherData.age_minutes}m ago`;
    }
    const hours = Math.round(weatherData.age_minutes / 60);
    return `${hours}h ago`;
  };

  const freshnessText = getFreshnessText();

  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      <div className="flex items-center gap-1">
        <span>{icon}</span>
        <span>{temp}</span>
        <span className="text-xs">({weatherData.condition})</span>
        {address && (
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshWeather}
            className="h-6 w-6 p-0 ml-1"
            title="Refresh weather data"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
      {freshnessText && (
        <div className="text-xs opacity-70 mt-0.5">
          {freshnessText}
        </div>
      )}
    </div>
  );
};