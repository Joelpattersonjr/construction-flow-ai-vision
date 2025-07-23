import { useState, useEffect } from 'react';
import { WeatherService, WeatherData, WeatherError } from '@/services/weatherService';

export const useWeatherData = (projectId: string, address?: string) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async (forceRefresh: boolean = false) => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (address) {
        // If we have an address, use the main service method
        const result = await WeatherService.getWeatherForProject(projectId, address, forceRefresh);
        
        // Check if the result is an error response
        if (result && 'error' in result) {
          console.error('Weather service returned error:', result.error, result.message);
          setError(result.message || 'Weather service error');
          setWeatherData(null);
          return;
        }
        
        setWeatherData(result as WeatherData);
      } else {
        // If no address, just try to get cached data
        const cachedWeather = await WeatherService.getCachedWeatherForProject(projectId);
        setWeatherData(cachedWeather);
      }
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const refreshWeather = () => {
    fetchWeatherData(true);
  };

  useEffect(() => {
    fetchWeatherData();
  }, [projectId, address]);

  return { weatherData, loading, error, refreshWeather };
};