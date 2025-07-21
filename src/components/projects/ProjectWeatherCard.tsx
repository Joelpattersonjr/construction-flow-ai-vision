import React from 'react';
import { useWeatherData } from '@/hooks/useWeatherData';
import { WeatherService } from '@/services/weatherService';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { weatherData, loading, error } = useWeatherData(projectId, address);

  // Debug logging
  console.log('Weather data received:', weatherData);

  if (loading) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Weather unavailable
      </div>
    );
  }

  const icon = WeatherService.getWeatherIcon(weatherData.condition);
  const temp = WeatherService.formatTemperature(weatherData.temperature_current);

  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      <span className="flex items-center gap-1">
        <span>{icon}</span>
        <span>{temp}</span>
        <span className="text-xs">({weatherData.condition})</span>
      </span>
    </div>
  );
};