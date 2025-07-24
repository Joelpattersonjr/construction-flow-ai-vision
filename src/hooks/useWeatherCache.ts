import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WeatherService, WeatherData } from '@/services/weatherService';

export const useWeatherCache = (projectId: string, address?: string) => {
  const queryClient = useQueryClient();

  const weatherQuery = useQuery({
    queryKey: ['weather', projectId],
    queryFn: async (): Promise<WeatherData | null> => {
      if (!projectId) return null;

      if (address) {
        const result = await WeatherService.getWeatherForProject(projectId, address, false);
        if (result && 'error' in result) {
          throw new Error(result.message || 'Weather service error');
        }
        return result as WeatherData;
      } else {
        return await WeatherService.getCachedWeatherForProject(projectId);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
    enabled: !!projectId,
    retry: (failureCount, error) => {
      // Retry up to 3 times with exponential backoff
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const refreshWeather = async (forceRefresh: boolean = false) => {
    if (forceRefresh) {
      // Invalidate cache and force fresh fetch
      await queryClient.invalidateQueries({ queryKey: ['weather', projectId] });
      
      if (address) {
        const result = await WeatherService.getWeatherForProject(projectId, address, true);
        if (result && !('error' in result)) {
          queryClient.setQueryData(['weather', projectId], result);
        }
      }
    } else {
      // Regular refresh
      await weatherQuery.refetch();
    }
  };

  const prefetchHistoricalData = () => {
    queryClient.prefetchQuery({
      queryKey: ['weather-trends', projectId],
      queryFn: () => WeatherService.getWeatherTrendsForProject(projectId, 7),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  return {
    weatherData: weatherQuery.data,
    loading: weatherQuery.isLoading,
    error: weatherQuery.error?.message || null,
    isStale: weatherQuery.isStale,
    isFetching: weatherQuery.isFetching,
    refreshWeather,
    prefetchHistoricalData,
  };
};