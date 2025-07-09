-- Add owner information columns to projects table
ALTER TABLE public.projects 
ADD COLUMN owner_name TEXT,
ADD COLUMN owner_company TEXT,
ADD COLUMN owner_email TEXT,
ADD COLUMN owner_phone TEXT;