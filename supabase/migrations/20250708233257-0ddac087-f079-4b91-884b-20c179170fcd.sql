-- Fix the user profile that wasn't properly associated with the company
-- Update the user profile to assign correct company and role
UPDATE profiles 
SET 
  company_id = 4,
  company_role = 'company_member',
  updated_at = now()
WHERE id = 'd9d35a60-aced-4120-a033-335ba590b9b0';

-- Mark the invitation as accepted
UPDATE user_invitations 
SET 
  accepted_at = now(),
  updated_at = now()
WHERE email = 'joelpattersonjr@gmail.com' 
  AND company_id = 4 
  AND accepted_at IS NULL;