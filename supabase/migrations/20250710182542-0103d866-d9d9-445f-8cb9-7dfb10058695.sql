-- Debug function to test storage path parsing and project lookup
CREATE OR REPLACE FUNCTION public.debug_storage_path(
  test_path TEXT,
  test_project_id TEXT
) 
RETURNS TABLE (
  path_input TEXT,
  project_id_extracted TEXT,
  folder_parts TEXT[],
  first_folder TEXT,
  project_exists BOOLEAN,
  user_company_id BIGINT,
  project_company_id BIGINT,
  access_granted BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  user_comp_id := get_my_company_id();
  
  -- Get project's company ID
  SELECT p.company_id INTO proj_company_id
  FROM projects p
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
$$;