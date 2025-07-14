-- Fix RLS performance issue: optimize auth.uid() call in profiles policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING ((select auth.uid()) = id);