import { useState, useEffect } from 'react';
import { WeatherService, WeatherData } from '@/services/weatherService';

interface UseHistoricalWeatherDataProps {
  projectId: string;
  startDate?: Date;
  endDate?: Date;
  days?: number;
}

export const useHistoricalWeatherData = ({ 
  projectId, 
  startDate, 
  endDate, 
  days = 7 
}: UseHistoricalWeatherDataProps) => {
  const [historicalData, setHistoricalData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricalData = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let data: WeatherData[];

      if (startDate && endDate) {
        // Fetch data for specific date range
        data = await WeatherService.getHistoricalWeatherForProject(projectId, startDate, endDate);
      } else {
        // Fetch trends for the last N days
        data = await WeatherService.getWeatherTrendsForProject(projectId, days);
      }

      setHistoricalData(data);
    } catch (err) {
      console.error('Error fetching historical weather data:', err);
      setError('Failed to fetch historical weather data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchHistoricalData();
  };

  useEffect(() => {
    fetchHistoricalData();
  }, [projectId, startDate, endDate, days]);

  return { 
    historicalData, 
    loading, 
    error, 
    refreshData 
  };
};