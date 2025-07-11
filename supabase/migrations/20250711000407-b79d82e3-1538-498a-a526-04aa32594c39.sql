-- Allow public access to mark temporary passwords as used during login
CREATE POLICY "Public can mark temporary passwords as used" 
ON public.admin_password_resets 
FOR UPDATE 
TO public
USING (used_at IS NULL AND expires_at > now())
WITH CHECK (used_at IS NOT NULL);