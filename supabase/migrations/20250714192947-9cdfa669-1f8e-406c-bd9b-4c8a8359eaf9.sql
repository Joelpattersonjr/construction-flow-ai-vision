-- Fix remaining security vulnerabilities: set immutable search_path for more SECURITY DEFINER functions

CREATE OR REPLACE FUNCTION public.handle_failed_login(user_email text, user_ip text DEFAULT NULL::text, user_agent_string text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  failed_count INTEGER;
  lockout_record public.account_lockouts%ROWTYPE;
  new_lockout_count INTEGER;
  unlock_duration INTERVAL;
BEGIN
  -- Insert failed attempt record
  INSERT INTO public.login_attempts (email, ip_address, user_agent, success)
  VALUES (user_email, user_ip, user_agent_string, false);
  
  -- Count failed attempts in last 15 minutes
  SELECT COUNT(*) INTO failed_count
  FROM public.login_attempts
  WHERE email = user_email 
    AND success = false 
    AND attempted_at > (now() - interval '15 minutes');
  
  -- If 5 or more failed attempts, lock the account
  IF failed_count >= 5 THEN
    -- Check if account is already locked
    SELECT * INTO lockout_record 
    FROM public.account_lockouts 
    WHERE email = user_email;
    
    IF FOUND THEN
      -- Increment lockout count and extend lockout
      new_lockout_count := lockout_record.lockout_count + 1;
    ELSE
      -- First lockout
      new_lockout_count := 1;
    END IF;
    
    unlock_duration := calculate_lockout_duration(new_lockout_count);
    
    -- Insert or update lockout record
    INSERT INTO public.account_lockouts (email, lockout_count, unlock_at)
    VALUES (user_email, new_lockout_count, now() + unlock_duration)
    ON CONFLICT (email) DO UPDATE SET
      lockout_count = new_lockout_count,
      unlock_at = now() + unlock_duration,
      updated_at = now();
    
    RETURN jsonb_build_object(
      'locked', true, 
      'unlock_at', (now() + unlock_duration),
      'lockout_count', new_lockout_count,
      'attempts', failed_count
    );
  END IF;
  
  RETURN jsonb_build_object(
    'locked', false, 
    'attempts', failed_count,
    'remaining_attempts', (5 - failed_count)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_successful_login(user_email text, user_ip text DEFAULT NULL::text, user_agent_string text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Insert successful attempt record
  INSERT INTO public.login_attempts (email, ip_address, user_agent, success)
  VALUES (user_email, user_ip, user_agent_string, true);
  
  -- Remove any lockout records for this email
  DELETE FROM public.account_lockouts WHERE email = user_email;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_temporary_password(temp_password text, user_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;