-- Create a function to automatically add project owner as admin member
CREATE OR REPLACE FUNCTION public.add_project_owner_as_member()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add project owner as member
CREATE TRIGGER add_project_owner_as_member_trigger
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.add_project_owner_as_member();

-- Add the current project owner to the existing project
INSERT INTO public.project_members_enhanced (
  project_id,
  user_id,
  role,
  permissions,
  created_at,
  updated_at
) VALUES (
  '84bef17f-452d-4fc7-b341-63ded66c174f',
  'd9d35a60-aced-4120-a033-335ba590b9b0',
  'owner',
  '{"read": true, "write": true, "admin": true}'::jsonb,
  now(),
  now()
) ON CONFLICT (project_id, user_id) DO NOTHING;