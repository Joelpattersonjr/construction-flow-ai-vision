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
}

export interface WeatherError {
  error: string;
  message?: string;
  cached: boolean;
}

export class WeatherService {
  static async getWeatherForProject(projectId: string, address: string): Promise<WeatherData | WeatherError | null> {
    try {
      // Call our edge function to get weather data
      const { data, error } = await supabase.functions.invoke('fetch-weather', {
        body: { address, projectId }
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

  static async getCachedWeatherForProject(projectId: string): Promise<WeatherData | null> {
    try {
      const { data, error } = await supabase
        .from('weather_cache')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        temperature_current: data.temperature_current,
        temperature_high: data.temperature_high,
        temperature_low: data.temperature_low,
        condition: data.condition,
        humidity: data.humidity,
        wind_speed: data.wind_speed,
        weather_icon: data.weather_icon,
        cached: true
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