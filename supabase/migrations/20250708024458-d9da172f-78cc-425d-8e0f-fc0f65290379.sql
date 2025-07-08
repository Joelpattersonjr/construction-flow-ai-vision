-- Update admin@test.com to be a company admin for testing
UPDATE public.profiles 
SET company_role = 'company_admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@test.com'
);