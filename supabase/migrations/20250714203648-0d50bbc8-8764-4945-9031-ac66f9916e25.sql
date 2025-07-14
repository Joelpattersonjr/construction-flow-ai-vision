-- Add missing index for companies.owner_id foreign key
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);