-- Add subscription management to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_features JSONB DEFAULT '{"version_control": false, "collaboration": false, "advanced_analytics": false}'::jsonb;

-- Create subscription management functions
CREATE OR REPLACE FUNCTION public.get_user_subscription_tier()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT c.subscription_tier 
     FROM public.companies c
     JOIN public.profiles p ON p.company_id = c.id
     WHERE p.id = auth.uid()),
    'free'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_subscription_feature(feature_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT (c.subscription_features->feature_name)::boolean
     FROM public.companies c
     JOIN public.profiles p ON p.company_id = c.id
     WHERE p.id = auth.uid()),
    false
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_subscription_limits()
RETURNS JSONB AS $$
  SELECT 
    CASE 
      WHEN get_user_subscription_tier() = 'free' THEN
        '{"max_versions_per_file": 5, "max_collaborators": 2, "version_history_days": 30}'::jsonb
      WHEN get_user_subscription_tier() = 'pro' THEN
        '{"max_versions_per_file": 50, "max_collaborators": 10, "version_history_days": 365}'::jsonb
      WHEN get_user_subscription_tier() = 'enterprise' THEN
        '{"max_versions_per_file": -1, "max_collaborators": -1, "version_history_days": -1}'::jsonb
      ELSE
        '{"max_versions_per_file": 5, "max_collaborators": 2, "version_history_days": 30}'::jsonb
    END;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Update existing companies to have proper subscription features
UPDATE public.companies 
SET subscription_features = 
  CASE 
    WHEN subscription_tier = 'pro' THEN 
      '{"version_control": true, "collaboration": true, "advanced_analytics": true}'::jsonb
    WHEN subscription_tier = 'enterprise' THEN 
      '{"version_control": true, "collaboration": true, "advanced_analytics": true}'::jsonb
    ELSE 
      '{"version_control": false, "collaboration": false, "advanced_analytics": false}'::jsonb
  END
WHERE subscription_features IS NULL OR subscription_features = '{}'::jsonb;

-- Create a view for easy subscription checking
CREATE OR REPLACE VIEW public.user_subscription_info AS
SELECT 
  p.id as user_id,
  c.id as company_id,
  c.subscription_tier,
  c.subscription_status,
  c.subscription_expires_at,
  c.subscription_features,
  get_subscription_limits() as limits
FROM public.profiles p
JOIN public.companies c ON p.company_id = c.id;

-- Enable RLS on the view
ALTER VIEW public.user_subscription_info SET (security_barrier = true);

-- Add RLS policy for the view
CREATE POLICY "Users can view their own subscription info" ON public.user_subscription_info
FOR SELECT
USING (user_id = auth.uid());