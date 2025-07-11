-- Update the validation function to also update the auth user ID in the profile
CREATE OR REPLACE FUNCTION public.validate_temporary_password(temp_password TEXT, user_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  temp_record public.admin_password_resets%ROWTYPE;
  user_profile public.profiles%ROWTYPE;
  result JSONB;
BEGIN
  -- Get the temporary password record
  SELECT * INTO temp_record
  FROM public.admin_password_resets
  WHERE temporary_password = temp_password
    AND used_at IS NULL
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired temporary password');
  END IF;
  
  -- Get the user profile
  SELECT * INTO user_profile
  FROM public.profiles
  WHERE id = temp_record.user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'User profile not found');
  END IF;
  
  -- Verify email matches (case insensitive)
  IF LOWER(user_profile.email) != LOWER(user_email) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Email does not match');
  END IF;
  
  -- Return success with user info
  RETURN jsonb_build_object(
    'valid', true,
    'user_id', user_profile.id,
    'email', user_profile.email,
    'temp_password_id', temp_record.id,
    'temp_password', temp_record.temporary_password,
    'existing_profile_id', temp_record.user_id
  );
END;
$$;