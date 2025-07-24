import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WeatherAlert {
  id: string;
  project_id: string;
  alert_type: 'temperature_extreme' | 'high_wind' | 'severe_weather' | 'data_stale';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  weather_data?: any;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
}

export const useWeatherAlerts = (projectId: string) => {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('weather_alerts')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching weather alerts:', error);
        setError('Failed to fetch weather alerts');
        return;
      }

      // Type the data properly
      const typedAlerts: WeatherAlert[] = (data || []).map(item => ({
        id: item.id,
        project_id: item.project_id,
        alert_type: item.alert_type as WeatherAlert['alert_type'],
        severity: item.severity as WeatherAlert['severity'],
        message: item.message,
        weather_data: item.weather_data,
        is_active: item.is_active,
        created_at: item.created_at,
        expires_at: item.expires_at,
        acknowledged_at: item.acknowledged_at,
        acknowledged_by: item.acknowledged_by,
      }));

      setAlerts(typedAlerts);
    } catch (err) {
      console.error('Weather alerts error:', err);
      setError('Failed to fetch weather alerts');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('weather_alerts')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', alertId);

      if (error) {
        console.error('Error acknowledging alert:', error);
        return false;
      }

      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged_at: new Date().toISOString() }
          : alert
      ));

      return true;
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      return false;
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('weather_alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) {
        console.error('Error dismissing alert:', error);
        return false;
      }

      // Remove from local state
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      return true;
    } catch (err) {
      console.error('Error dismissing alert:', err);
      return false;
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchAlerts();
    }
  }, [projectId]);

  return {
    alerts,
    loading,
    error,
    acknowledgeAlert,
    dismissAlert,
    refreshAlerts: fetchAlerts
  };
};