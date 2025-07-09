-- Create audit_log table to track permission changes and member activities
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'member_added', 'member_removed', 'role_changed', 'permissions_updated'
  target_user_id UUID, -- The user who was affected by the action
  old_value JSONB, -- Previous state (role, permissions, etc.)
  new_value JSONB, -- New state (role, permissions, etc.)
  metadata JSONB, -- Additional context data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_audit_log_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_audit_log_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_audit_log_target_user FOREIGN KEY (target_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing audit logs
CREATE POLICY "Users can view audit logs for their company projects" 
ON public.audit_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = audit_log.project_id 
    AND p.company_id = get_my_company_id()
  )
);

-- Create policy for inserting audit logs
CREATE POLICY "Users can create audit logs for their company projects" 
ON public.audit_log 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = audit_log.project_id 
    AND p.company_id = get_my_company_id()
  )
);

-- Create index for better performance
CREATE INDEX idx_audit_log_project_created 
ON public.audit_log (project_id, created_at DESC);

CREATE INDEX idx_audit_log_user 
ON public.audit_log (user_id);

CREATE INDEX idx_audit_log_target_user 
ON public.audit_log (target_user_id);