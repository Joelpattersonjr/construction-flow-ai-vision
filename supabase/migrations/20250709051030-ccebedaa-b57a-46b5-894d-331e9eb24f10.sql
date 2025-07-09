-- Create a debugging function to log policy evaluation
CREATE OR REPLACE FUNCTION debug_policy_check(user_id uuid, project_company_id bigint)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  current_uid uuid;
  user_company bigint;
  result boolean;
BEGIN
  current_uid := auth.uid();
  
  SELECT company_id INTO user_company 
  FROM public.profiles 
  WHERE id = current_uid;
  
  result := (current_uid = user_id AND project_company_id = user_company);
  
  -- Log for debugging
  RAISE NOTICE 'Policy Check - auth.uid(): %, user_id: %, user_company: %, project_company: %, result: %', 
    current_uid, user_id, user_company, project_company_id, result;
  
  RETURN result;
END;
$$;

-- Update the policy to use the debug function temporarily
DROP POLICY IF EXISTS "Users can create projects for their company" ON public.projects;

CREATE POLICY "Users can create projects for their company" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (debug_policy_check(owner_id, company_id));