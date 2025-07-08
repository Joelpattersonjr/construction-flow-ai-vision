-- Fix infinite recursion in companies RLS policies
-- Create security definer functions to avoid circular references

-- Create function to check if user is company admin
CREATE OR REPLACE FUNCTION public.is_company_admin(company_id_param BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = company_id_param 
    AND profiles.company_role = 'company_admin'
  );
$$;

-- Create function to check if user is company owner
CREATE OR REPLACE FUNCTION public.is_company_owner(owner_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.uid() = owner_id_param;
$$;

-- Create function to check if user belongs to company
CREATE OR REPLACE FUNCTION public.belongs_to_company(company_id_param BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = company_id_param
  );
$$;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Company admins can manage their company" ON public.companies;
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can create a company" ON public.companies;

-- Create new policies using security definer functions
CREATE POLICY "Company owners and admins can manage company" 
ON public.companies 
FOR ALL 
USING (
  public.is_company_owner(owner_id) 
  OR public.is_company_admin(id)
);

CREATE POLICY "Company members can view their company" 
ON public.companies 
FOR SELECT 
USING (public.belongs_to_company(id));

CREATE POLICY "Users can create a company" 
ON public.companies 
FOR INSERT 
WITH CHECK (public.is_company_owner(owner_id));