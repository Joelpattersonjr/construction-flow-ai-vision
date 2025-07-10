-- Create table to track login attempts
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false,
  user_agent TEXT
);

-- Create table to track account lockouts
CREATE TABLE public.account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  lockout_count INTEGER NOT NULL DEFAULT 1,
  unlock_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for admin password resets
CREATE TABLE public.admin_password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  temporary_password TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_password_resets ENABLE ROW LEVEL SECURITY;

-- Create policies for login_attempts (only admins can view)
CREATE POLICY "Company admins can view login attempts"
ON public.login_attempts
FOR SELECT
USING (current_user_is_admin());

CREATE POLICY "System can insert login attempts"
ON public.login_attempts
FOR INSERT
WITH CHECK (true);

-- Create policies for account_lockouts (only admins can view/manage)
CREATE POLICY "Company admins can view account lockouts"
ON public.account_lockouts
FOR ALL
USING (current_user_is_admin());

CREATE POLICY "System can manage account lockouts"
ON public.account_lockouts
FOR ALL
WITH CHECK (true);

-- Create policies for admin_password_resets
CREATE POLICY "Company admins can manage password resets"
ON public.admin_password_resets
FOR ALL
USING (current_user_is_admin());

-- Create function to calculate progressive lockout duration
CREATE OR REPLACE FUNCTION calculate_lockout_duration(lockout_count INTEGER)
RETURNS INTERVAL AS $$
BEGIN
  CASE lockout_count
    WHEN 1 THEN RETURN interval '30 seconds';
    WHEN 2 THEN RETURN interval '5 minutes';
    ELSE RETURN interval '10 minutes';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  lockout_record public.account_lockouts%ROWTYPE;
BEGIN
  SELECT * INTO lockout_record 
  FROM public.account_lockouts 
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if unlock time has passed
  IF lockout_record.unlock_at <= now() THEN
    -- Remove the lockout record as it has expired
    DELETE FROM public.account_lockouts WHERE email = user_email;
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle failed login attempt
CREATE OR REPLACE FUNCTION handle_failed_login(
  user_email TEXT,
  user_ip TEXT DEFAULT NULL,
  user_agent_string TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle successful login
CREATE OR REPLACE FUNCTION handle_successful_login(
  user_email TEXT,
  user_ip TEXT DEFAULT NULL,
  user_agent_string TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert successful attempt record
  INSERT INTO public.login_attempts (email, ip_address, user_agent, success)
  VALUES (user_email, user_ip, user_agent_string, true);
  
  -- Remove any lockout records for this email
  DELETE FROM public.account_lockouts WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate temporary password
CREATE OR REPLACE FUNCTION generate_temporary_password()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts (email, attempted_at DESC);
CREATE INDEX idx_account_lockouts_email ON public.account_lockouts (email);
CREATE INDEX idx_admin_password_resets_user_id ON public.admin_password_resets (user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_account_lockouts_updated_at
  BEFORE UPDATE ON public.account_lockouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();