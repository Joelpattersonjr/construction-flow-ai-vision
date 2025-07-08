-- Update admin@test.com profile to be associated with the company
UPDATE public.profiles 
SET company_id = 1, company_name = 'Test Company'
WHERE id = 'c566e2bc-9b75-42f7-9ceb-95cd0a8fbf95';