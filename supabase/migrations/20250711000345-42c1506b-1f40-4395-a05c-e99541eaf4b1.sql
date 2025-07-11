-- Allow public access to admin_password_resets for temporary password validation during login
CREATE POLICY "Public can validate temporary passwords" 
ON public.admin_password_resets 
FOR SELECT 
TO public
USING (used_at IS NULL AND expires_at > now());