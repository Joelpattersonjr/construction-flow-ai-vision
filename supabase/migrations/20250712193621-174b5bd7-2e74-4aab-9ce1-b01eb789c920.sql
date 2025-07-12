-- Add trial tracking fields to companies table
ALTER TABLE public.companies 
ADD COLUMN trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Function to set trial period for new companies
CREATE OR REPLACE FUNCTION public.set_trial_period()
RETURNS TRIGGER AS $$
BEGIN
  -- Set 30-day trial for new companies
  NEW.trial_started_at = now();
  NEW.trial_ends_at = now() + interval '30 days';
  NEW.subscription_tier = 'trial';
  NEW.subscription_status = 'trial';
  NEW.subscription_features = jsonb_build_object(
    'version_control', true,
    'collaboration', true, 
    'advanced_analytics', false,
    'time_tracking', false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set trial period for new companies
CREATE TRIGGER set_company_trial_trigger
  BEFORE INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_trial_period();

-- Update existing companies without trial data to have expired trials
-- (this maintains existing functionality for current users)
UPDATE public.companies 
SET 
  trial_started_at = created_at,
  trial_ends_at = created_at + interval '30 days'
WHERE trial_started_at IS NULL;

-- Function to check trial status
CREATE OR REPLACE FUNCTION public.get_trial_status(company_id_param bigint)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  company_record public.companies%ROWTYPE;
  days_remaining integer;
  result jsonb;
BEGIN
  SELECT * INTO company_record 
  FROM public.companies 
  WHERE id = company_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Company not found');
  END IF;
  
  -- Calculate days remaining in trial
  days_remaining := EXTRACT(days FROM (company_record.trial_ends_at - now()))::integer;
  
  result := jsonb_build_object(
    'is_trial_active', (now() < company_record.trial_ends_at AND company_record.subscription_tier IN ('trial', 'free')),
    'trial_started_at', company_record.trial_started_at,
    'trial_ends_at', company_record.trial_ends_at,
    'days_remaining', GREATEST(0, days_remaining),
    'trial_expired', now() >= company_record.trial_ends_at
  );
  
  RETURN result;
END;
$$;