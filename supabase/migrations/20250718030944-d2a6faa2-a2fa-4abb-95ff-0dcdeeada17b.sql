-- Update Pro subscription features to include time_tracking as per the plan features
UPDATE companies 
SET subscription_features = jsonb_set(
  subscription_features, 
  '{time_tracking}', 
  'true'::jsonb
)
WHERE subscription_tier = 'pro';

-- Also ensure starter tier has the appropriate features
UPDATE companies 
SET subscription_features = jsonb_set(
  jsonb_set(subscription_features, '{collaboration}', 'true'::jsonb),
  '{version_control}', 
  'true'::jsonb
)
WHERE subscription_tier = 'starter';