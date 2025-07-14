-- Fix security vulnerability: set immutable search_path for create_document_version function

CREATE OR REPLACE FUNCTION public.create_document_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  next_version INTEGER;
BEGIN
  -- Only create version if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO next_version
    FROM public.file_versions 
    WHERE document_id = NEW.id;
    
    -- Create new version
    INSERT INTO public.file_versions (
      document_id,
      version_number,
      content,
      content_hash,
      created_by,
      file_size,
      change_description
    ) VALUES (
      NEW.id,
      next_version,
      NEW.content,
      encode(sha256(NEW.content::bytea), 'hex'),
      auth.uid(),
      length(NEW.content),
      'Auto-save'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;