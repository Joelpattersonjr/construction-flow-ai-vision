import React, { useState } from 'react';
import { useWeatherData } from '@/hooks/useWeatherData';
import { WeatherService } from '@/services/weatherService';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye } from 'lucide-react';
import { WeatherAnalyticsModal } from '@/components/weather/WeatherAnalyticsModal';

interface ProjectWeatherCardProps {
  projectId: string;
  projectName?: string;
  address?: string;
  className?: string;
}

export const ProjectWeatherCard: React.FC<ProjectWeatherCardProps> = ({
  projectId,
  projectName = 'Project',
  address,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    <>
      <div className={`text-sm text-muted-foreground ${className}`}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span>{icon}</span>
            <span>{temp}</span>
            <span className="text-xs">({weatherData.condition})</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {address && (
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshWeather}
                className="h-6 w-6 p-0"
                title="Refresh weather data"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="h-6 px-2 text-xs"
              title="View detailed weather analytics"
            >
              <Eye className="h-3 w-3 mr-1" />
              Details
            </Button>
          </div>
        </div>
        {freshnessText && (
          <div className="text-xs opacity-70 mt-0.5">
            {freshnessText}
          </div>
        )}
      </div>
      
      <WeatherAnalyticsModal
        projectId={projectId}
        projectName={projectName}
        address={address}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};