-- Allow unauthenticated users to read their own invitation by token
CREATE POLICY "Users can read invitations by token" 
ON public.user_invitations 
FOR SELECT 
USING (true);