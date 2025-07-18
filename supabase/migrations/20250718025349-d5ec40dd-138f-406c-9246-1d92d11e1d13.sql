-- Update Pro subscription features to include scheduling
UPDATE companies 
SET subscription_features = jsonb_set(
  subscription_features, 
  '{scheduling}', 
  'true'::jsonb
)
WHERE subscription_tier = 'pro';

-- Also update any trial companies to include scheduling for testing
UPDATE companies 
SET subscription_features = jsonb_set(
  subscription_features, 
  '{scheduling}', 
  'true'::jsonb
)
WHERE subscription_tier = 'trial';