-- Fix RLS performance issue: optimize auth.uid() calls in task_schedule_slots policy
DROP POLICY IF EXISTS "Users can manage their own schedule slots" ON public.task_schedule_slots;

CREATE POLICY "Users can manage their own schedule slots"
ON public.task_schedule_slots
FOR ALL
USING (
  user_id = (select auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (select auth.uid()) 
    AND p.company_role = 'company_admin'
    AND p.company_id = get_my_company_id()
  )
);