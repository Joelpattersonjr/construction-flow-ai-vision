-- Create table for company custom fields configuration
CREATE TABLE public.company_custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  field_options JSONB DEFAULT '[]'::jsonb,
  is_required BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, field_name)
);

-- Add custom_fields column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb;

-- Enable RLS on company_custom_fields
ALTER TABLE public.company_custom_fields ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_custom_fields
CREATE POLICY "Company admins can manage custom fields"
ON public.company_custom_fields
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = company_custom_fields.company_id 
    AND profiles.company_role = 'company_admin'
  )
);

CREATE POLICY "Company members can view custom fields"
ON public.company_custom_fields
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = company_custom_fields.company_id
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_company_custom_fields_updated_at
BEFORE UPDATE ON public.company_custom_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();