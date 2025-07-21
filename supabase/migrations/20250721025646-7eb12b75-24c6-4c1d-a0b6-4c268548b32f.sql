
-- Phase 1: Add structured location fields to projects table
ALTER TABLE public.projects 
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN zip_code TEXT,
ADD COLUMN country TEXT DEFAULT 'USA',
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Add indexes for better performance on location queries
CREATE INDEX idx_projects_city_state ON public.projects(city, state);
CREATE INDEX idx_projects_zip_code ON public.projects(zip_code);
CREATE INDEX idx_projects_coordinates ON public.projects(latitude, longitude);

-- Create a function to parse existing addresses and populate new fields
CREATE OR REPLACE FUNCTION public.parse_project_addresses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update projects that have addresses with common patterns
  -- This is a basic parser for common US address formats
  
  -- Try to extract ZIP codes (5 digits at end)
  UPDATE public.projects 
  SET zip_code = substring(address FROM '(\d{5})(?:\-\d{4})?$')
  WHERE address IS NOT NULL AND zip_code IS NULL;
  
  -- Try to extract state abbreviations (2 letters before ZIP)
  UPDATE public.projects 
  SET state = substring(address FROM '\b([A-Z]{2})\s+\d{5}')
  WHERE address IS NOT NULL AND state IS NULL;
  
  -- Try to extract full state names
  UPDATE public.projects 
  SET state = CASE 
    WHEN address ILIKE '%Florida%' THEN 'FL'
    WHEN address ILIKE '%California%' THEN 'CA'
    WHEN address ILIKE '%Texas%' THEN 'TX'
    WHEN address ILIKE '%New York%' THEN 'NY'
    -- Add more states as needed
    ELSE state
  END
  WHERE address IS NOT NULL AND state IS NULL;
  
  -- Try to extract cities (word before state)
  UPDATE public.projects 
  SET city = CASE
    WHEN address ILIKE '%St. Cloud%' OR address ILIKE '%Saint Cloud%' THEN 'St. Cloud'
    WHEN address ILIKE '%St Cloud%' THEN 'St. Cloud'
    ELSE trim(split_part(split_part(address, state, 1), ',', -1))
  END
  WHERE address IS NOT NULL AND state IS NOT NULL AND city IS NULL;
  
END;
$$;

-- Run the address parsing function
SELECT public.parse_project_addresses();
