-- Fix security vulnerability: set immutable search_path for add_project_owner_as_member function

CREATE OR REPLACE FUNCTION public.add_project_owner_as_member()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Insert the project owner as an owner member
  INSERT INTO public.project_members_enhanced (
    project_id,
    user_id,
    role,
    permissions,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.owner_id,
    'owner',
    '{"read": true, "write": true, "admin": true}'::jsonb,
    now(),
    now()
  );
  
  RETURN NEW;
END;
$function$;