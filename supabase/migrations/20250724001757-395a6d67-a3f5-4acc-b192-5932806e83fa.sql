-- Create weather_alerts table for tracking weather warnings and alerts
CREATE TABLE public.weather_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('temperature_extreme', 'high_wind', 'severe_weather', 'data_stale')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  weather_data JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID
);

-- Enable RLS
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for weather alerts
CREATE POLICY "Users can view alerts for their company projects" 
ON public.weather_alerts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM projects p 
  WHERE p.id = weather_alerts.project_id 
  AND p.company_id = get_my_company_id()
));

CREATE POLICY "System can create weather alerts" 
ON public.weather_alerts 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM projects p 
  WHERE p.id = weather_alerts.project_id 
  AND p.company_id = get_my_company_id()
));

CREATE POLICY "Users can acknowledge alerts for their company projects" 
ON public.weather_alerts 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM projects p 
  WHERE p.id = weather_alerts.project_id 
  AND p.company_id = get_my_company_id()
));

-- Create function to generate weather alerts based on conditions
CREATE OR REPLACE FUNCTION public.check_weather_alerts(
  p_project_id UUID,
  p_weather_data JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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

-- Create index for performance
CREATE INDEX idx_weather_alerts_project_active ON public.weather_alerts (project_id, is_active) WHERE is_active = true;