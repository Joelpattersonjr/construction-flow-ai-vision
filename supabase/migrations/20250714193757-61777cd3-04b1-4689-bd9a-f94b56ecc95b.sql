-- Fix security vulnerability: set immutable search_path for debug_storage_path function

CREATE OR REPLACE FUNCTION public.debug_storage_path(test_path text, test_project_id text)
 RETURNS TABLE(path_input text, project_id_extracted text, folder_parts text[], first_folder text, project_exists boolean, user_company_id bigint, project_company_id bigint, access_granted boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  folder_components TEXT[];
  extracted_project_id TEXT;
  proj_company_id BIGINT;
  user_comp_id BIGINT;
BEGIN
  -- Extract folder components
  folder_components := storage.foldername(test_path);
  
  -- Get first component (should be project ID)
  extracted_project_id := folder_components[1];
  
  -- Get user's company ID
  user_comp_id := public.get_my_company_id();
  
  -- Get project's company ID
  SELECT p.company_id INTO proj_company_id
  FROM public.projects p
  WHERE p.id::text = extracted_project_id;
  
  RETURN QUERY SELECT
    test_path,
    extracted_project_id,
    folder_components,
    folder_components[1],
    (proj_company_id IS NOT NULL),
    user_comp_id,
    proj_company_id,
    (user_comp_id IS NOT NULL AND proj_company_id IS NOT NULL AND user_comp_id = proj_company_id);
END;
$function$;