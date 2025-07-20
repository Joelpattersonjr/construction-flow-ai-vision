-- Fix search path security issue for cleanup_old_weather_data function
CREATE OR REPLACE FUNCTION public.cleanup_old_weather_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  DELETE FROM public.weather_cache 
  WHERE last_updated < (now() - interval '24 hours');
END;
$$;