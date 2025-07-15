-- Update account lockout policy: 5 minutes after 5 attempts, admin reset required for continued failures

CREATE OR REPLACE FUNCTION public.calculate_lockout_duration(lockout_count integer)
 RETURNS interval
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  CASE lockout_count
    WHEN 1 THEN RETURN interval '5 minutes';
    ELSE RETURN interval '999 years'; -- Permanent lock requiring admin reset
  END CASE;
END;
$function$;

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
      -- Account already locked - increment count (will trigger permanent lock)
      new_lockout_count := lockout_record.lockout_count + 1;
    ELSE
      -- First lockout
      new_lockout_count := 1;
    END IF;
    
    -- Use explicit schema reference for calculate_lockout_duration
    unlock_duration := public.calculate_lockout_duration(new_lockout_count);
    
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
      'attempts', failed_count,
      'requires_admin_reset', (new_lockout_count > 1)
    );
  END IF;
  
  RETURN jsonb_build_object(
    'locked', false, 
    'attempts', failed_count,
    'remaining_attempts', (5 - failed_count)
  );
END;
$function$;