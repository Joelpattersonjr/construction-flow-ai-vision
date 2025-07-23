import { supabase } from '@/integrations/supabase/client';

export interface WeatherData {
  temperature_current: number;
  temperature_high: number;
  temperature_low: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  weather_icon: string;
  cached?: boolean;
  last_updated?: string;
  age_minutes?: number;
}

export interface WeatherError {
  error: string;
  message?: string;
  cached: boolean;
}

export class WeatherService {
  // Cache expiration time in milliseconds (1 hour)
  private static CACHE_EXPIRY_MS = 60 * 60 * 1000;

  static async getWeatherForProject(
    projectId: string, 
    address: string, 
    forceRefresh: boolean = false
  ): Promise<WeatherData | WeatherError | null> {
    try {
      // If not forcing refresh, try to get fresh cached data first
      if (!forceRefresh) {
        const cachedData = await this.getFreshCachedWeatherForProject(projectId);
        if (cachedData) {
          return cachedData;
        }
      }

      // Call our edge function to get weather data
      const { data, error } = await supabase.functions.invoke('fetch-weather', {
        body: { address, projectId, forceRefresh }
      });

      if (error) {
        console.error('Error fetching weather:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Weather service error:', error);
      return null;
    }
  }

  static async getFreshCachedWeatherForProject(projectId: string): Promise<WeatherData | null> {
    try {
      const { data, error } = await supabase
        .from('weather_cache')
        .select('*')
        .eq('project_id', projectId)
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error querying cached weather:', error);
        return null;
      }

      if (!data) {
        console.log('No cached weather data found for project:', projectId);
        return null;
      }

      // Check if cache is still fresh (within expiry time)
      const lastUpdated = new Date(data.last_updated);
      const now = new Date();
      const ageMs = now.getTime() - lastUpdated.getTime();

      if (ageMs > this.CACHE_EXPIRY_MS) {
        console.log(`Cached weather data is stale (${Math.round(ageMs / 1000 / 60)} minutes old)`);
        return null;
      }

      const ageMinutes = Math.round(ageMs / 1000 / 60);
      
      return {
        temperature_current: data.temperature_current,
        temperature_high: data.temperature_high,
        temperature_low: data.temperature_low,
        condition: data.condition,
        humidity: data.humidity,
        wind_speed: data.wind_speed,
        weather_icon: data.weather_icon,
        cached: true,
        last_updated: data.last_updated,
        age_minutes: ageMinutes
      };
    } catch (error) {
      console.error('Error getting cached weather:', error);
      return null;
    }
  }

  static async getCachedWeatherForProject(projectId: string): Promise<WeatherData | null> {
    try {
      const { data, error } = await supabase
        .from('weather_cache')
        .select('*')
        .eq('project_id', projectId)
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error querying cached weather:', error);
        return null;
      }

      if (!data) {
        console.log('No cached weather data found for project:', projectId);
        return null;
      }

      // Calculate age for display purposes
      const lastUpdated = new Date(data.last_updated);
      const now = new Date();
      const ageMs = now.getTime() - lastUpdated.getTime();
      const ageMinutes = Math.round(ageMs / 1000 / 60);

      return {
        temperature_current: data.temperature_current,
        temperature_high: data.temperature_high,
        temperature_low: data.temperature_low,
        condition: data.condition,
        humidity: data.humidity,
        wind_speed: data.wind_speed,
        weather_icon: data.weather_icon,
        cached: true,
        last_updated: data.last_updated,
        age_minutes: ageMinutes
      };
    } catch (error) {
      console.error('Error getting cached weather:', error);
      return null;
    }
  }

  static getWeatherIcon(condition: string): string {
    const iconMap: Record<string, string> = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️'
    };
    
    return iconMap[condition] || '🌤️';
  }

  static formatTemperature(temp: number): string {
    return `${Math.round(temp)}°F`;
  }
}