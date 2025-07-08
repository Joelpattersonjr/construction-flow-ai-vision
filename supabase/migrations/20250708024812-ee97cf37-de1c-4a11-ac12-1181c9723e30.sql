-- Create a test company and associate admin@test.com with it
INSERT INTO public.companies (name, owner_id) 
VALUES ('Test Company', 'c566e2bc-9b75-42f7-9ceb-95cd0a8fbf95')
RETURNING id;