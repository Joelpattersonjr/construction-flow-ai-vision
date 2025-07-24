-- Fix security issues from the weather_alerts table
-- Add missing DELETE policy for weather_alerts
CREATE POLICY "Users can delete alerts for their company projects" 
ON public.weather_alerts 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM projects p 
  WHERE p.id = weather_alerts.project_id 
  AND p.company_id = get_my_company_id()
));

-- Update the check_weather_alerts function to use proper search_path
CREATE OR REPLACE FUNCTION public.check_weather_alerts(
  p_project_id UUID,
  p_weather_data JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  temp_current NUMERIC;
  wind_speed NUMERIC;
  condition TEXT;
  data_age_hours NUMERIC;
BEGIN
  -- Extract weather data
  temp_current := (p_weather_data->>'temperature_current')::NUMERIC;
  wind_speed := (p_weather_data->>'wind_speed')::NUMERIC;
  condition := p_weather_data->>'condition';
  
  -- Calculate data age
  data_age_hours := EXTRACT(EPOCH FROM (now() - (p_weather_data->>'last_updated')::TIMESTAMP)) / 3600;
  
  -- Temperature extreme alerts
  IF temp_current > 95 OR temp_current < 32 THEN
    INSERT INTO public.weather_alerts (project_id, alert_type, severity, message, weather_data)
    VALUES (
      p_project_id,
      'temperature_extreme',
      CASE WHEN temp_current > 100 OR temp_current < 20 THEN 'high' ELSE 'medium' END,
      CASE 
        WHEN temp_current > 95 THEN 'Extreme heat warning: ' || temp_current || '°F'
        ELSE 'Freezing temperature alert: ' || temp_current || '°F'
      END,
      p_weather_data
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- High wind alerts
  IF wind_speed > 25 THEN
    INSERT INTO public.weather_alerts (project_id, alert_type, severity, message, weather_data)
    VALUES (
      p_project_id,
      'high_wind',
      CASE WHEN wind_speed > 40 THEN 'critical' ELSE 'high' END,
      'High wind warning: ' || wind_speed || ' mph',
      p_weather_data
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Severe weather alerts
  IF condition IN ('Thunderstorm', 'Snow') THEN
    INSERT INTO public.weather_alerts (project_id, alert_type, severity, message, weather_data)
    VALUES (
      p_project_id,
      'severe_weather',
      'high',
      'Severe weather alert: ' || condition,
      p_weather_data
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Stale data alerts (older than 4 hours)
  IF data_age_hours > 4 THEN
    INSERT INTO public.weather_alerts (project_id, alert_type, severity, message, weather_data)
    VALUES (
      p_project_id,
      'data_stale',
      'medium',
      'Weather data is ' || ROUND(data_age_hours, 1) || ' hours old',
      p_weather_data
    )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$function$;