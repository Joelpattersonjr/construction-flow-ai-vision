-- Fix security vulnerability: set immutable search_path for update_project_storage_stats function

CREATE OR REPLACE FUNCTION public.update_project_storage_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.project_storage_stats (project_id, total_files, total_size_bytes)
    VALUES (NEW.project_id, 1, 0)
    ON CONFLICT (project_id) DO UPDATE SET
      total_files = project_storage_stats.total_files + 1,
      last_updated = now();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.project_storage_stats
    SET total_files = GREATEST(0, total_files - 1),
        last_updated = now()
    WHERE project_id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;