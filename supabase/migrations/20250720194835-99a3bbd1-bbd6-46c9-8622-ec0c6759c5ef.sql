
-- Create weather cache table to store weather data for project locations
CREATE TABLE public.weather_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  temperature_current DECIMAL(5,2),
  temperature_high DECIMAL(5,2),
  temperature_low DECIMAL(5,2),
  condition TEXT,
  humidity INTEGER,
  wind_speed DECIMAL(5,2),
  weather_icon TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for weather cache
CREATE POLICY "Users can view weather cache for their company projects"
ON public.weather_cache
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects p
  WHERE p.id = weather_cache.project_id 
  AND p.company_id = get_my_company_id()
));

CREATE POLICY "System can manage weather cache"
ON public.weather_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_weather_cache_project_id ON public.weather_cache(project_id);
CREATE INDEX idx_weather_cache_updated ON public.weather_cache(last_updated);

-- Create function to clean up old weather data (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_weather_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.weather_cache 
  WHERE last_updated < (now() - interval '24 hours');
END;
$$;
