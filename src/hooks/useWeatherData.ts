import { useState, useEffect } from 'react';
import { WeatherService, WeatherData } from '@/services/weatherService';

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
          weather = await WeatherService.getWeatherForProject(projectId, address);
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