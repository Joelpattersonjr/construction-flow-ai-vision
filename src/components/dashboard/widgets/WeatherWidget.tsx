import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cloud, Sun, CloudRain, Snowflake, Wind, Thermometer, Droplets, RefreshCw } from 'lucide-react';
import { useWeatherData } from '@/hooks/useWeatherData';

interface WeatherWidgetProps {
  projectId?: string;
  address?: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ 
  projectId = "default", 
  address = "New York, NY" 
}) => {
  const { weatherData, loading, error, refreshWeather } = useWeatherData(projectId, address);

  const getWeatherIcon = (condition?: string) => {
    if (!condition) return <Cloud className="h-8 w-8 text-muted-foreground" />;
    
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
      return <Sun className="h-8 w-8 text-yellow-500" />;
    } else if (conditionLower.includes('rain') || conditionLower.includes('shower')) {
      return <CloudRain className="h-8 w-8 text-blue-500" />;
    } else if (conditionLower.includes('snow')) {
      return <Snowflake className="h-8 w-8 text-blue-200" />;
    } else if (conditionLower.includes('wind')) {
      return <Wind className="h-8 w-8 text-gray-500" />;
    } else {
      return <Cloud className="h-8 w-8 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading weather...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Cloud className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">Weather unavailable</p>
          <Button variant="outline" size="sm" onClick={refreshWeather}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Cloud className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No weather data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-4">
      {/* Current Weather */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getWeatherIcon(weatherData.condition)}
          <div>
            <div className="text-2xl font-bold">{Math.round(weatherData.temperature_current)}°</div>
            <div className="text-xs text-muted-foreground">{weatherData.condition}</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={refreshWeather}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {/* Weather Details */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <Thermometer className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">High/Low</span>
          <span>{Math.round(weatherData.temperature_high)}°/{Math.round(weatherData.temperature_low)}°</span>
        </div>
        <div className="flex items-center space-x-1">
          <Droplets className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Humidity</span>
          <span>{weatherData.humidity || 'N/A'}%</span>
        </div>
        <div className="flex items-center space-x-1">
          <Wind className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Wind</span>
          <span>{weatherData.wind_speed || 'N/A'} mph</span>
        </div>
        <div className="flex items-center space-x-1">
          <Cloud className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Updated</span>
          <span>{weatherData.age_minutes ? `${weatherData.age_minutes}m ago` : 'Now'}</span>
        </div>
      </div>
    </div>
  );
};