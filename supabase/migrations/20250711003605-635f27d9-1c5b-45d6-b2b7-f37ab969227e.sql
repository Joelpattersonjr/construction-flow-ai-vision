-- Fix the user's profile by copying data from the old profile to the current auth user's profile
UPDATE public.profiles 
SET 
  full_name = 'John Doe',
  email = 'johndoe@superiorfocus.com', 
  company_id = 5,
  company_role = 'company_member',
  updated_at = now()
WHERE id = '6cbaef32-7df6-40d8-bb3b-6ef4a7938c11';

-- Delete the old orphaned profile
DELETE FROM public.profiles 
WHERE id = '656d7160-b1ff-439b-a92f-0e084ca4c30e';