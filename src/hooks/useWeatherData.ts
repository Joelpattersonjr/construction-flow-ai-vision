import { useState, useEffect } from 'react';
import { WeatherService, WeatherData, WeatherError } from '@/services/weatherService';

export const useWeatherData = (projectId: string, address?: string) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First try to get cached data
        let weather = await WeatherService.getCachedWeatherForProject(projectId);
        
        // If no cached data or we have an address, fetch fresh data
        if (!weather && address) {
          const result = await WeatherService.getWeatherForProject(projectId, address);
          
          // Check if the result is an error response
          if (result && 'error' in result) {
            console.error('Weather service returned error:', result.error, result.message);
            setError(result.message || 'Weather service error');
            setWeatherData(null);
            return;
          }
          
          weather = result as WeatherData;
        }

        setWeatherData(weather);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [projectId, address]);

  return { weatherData, loading, error };
};