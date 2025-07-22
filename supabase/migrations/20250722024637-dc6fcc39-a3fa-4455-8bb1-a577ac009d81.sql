-- Create workflows table to store workflow definitions
CREATE TABLE public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  form_template_id UUID REFERENCES public.form_templates(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  workflow_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow executions table to track running workflows
CREATE TABLE public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  form_submission_id UUID NOT NULL REFERENCES public.form_submissions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  current_step_id TEXT,
  execution_data JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow approvals table for approval steps
CREATE TABLE public.workflow_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  assignee_id UUID REFERENCES auth.users(id),
  assignee_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decision_reason TEXT,
  decision_made_at TIMESTAMP WITH TIME ZONE,
  decision_made_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow notifications table for tracking notifications
CREATE TABLE public.workflow_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'in_app', 'both')),
  recipient_id UUID REFERENCES auth.users(id),
  recipient_email TEXT,
  subject TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all workflow tables
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflows table
CREATE POLICY "Users can view workflows for their company"
ON public.workflows
FOR SELECT
USING (company_id = get_my_company_id());

CREATE POLICY "Users can create workflows for their company"
ON public.workflows
FOR INSERT
WITH CHECK (company_id = get_my_company_id() AND created_by = auth.uid());

CREATE POLICY "Users can update their own workflows"
ON public.workflows
FOR UPDATE
USING (company_id = get_my_company_id() AND (created_by = auth.uid() OR current_user_is_admin()));

CREATE POLICY "Admins can delete workflows"
ON public.workflows
FOR DELETE
USING (company_id = get_my_company_id() AND current_user_is_admin());

-- RLS Policies for workflow_executions table
CREATE POLICY "Users can view executions for their company workflows"
ON public.workflow_executions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.workflows w 
  WHERE w.id = workflow_executions.workflow_id 
  AND w.company_id = get_my_company_id()
));

CREATE POLICY "Users can create executions for their company workflows"
ON public.workflow_executions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workflows w 
  WHERE w.id = workflow_executions.workflow_id 
  AND w.company_id = get_my_company_id()
));

CREATE POLICY "System can update workflow executions"
ON public.workflow_executions
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.workflows w 
  WHERE w.id = workflow_executions.workflow_id 
  AND w.company_id = get_my_company_id()
));

-- RLS Policies for workflow_approvals table
CREATE POLICY "Users can view approvals for their company workflows"
ON public.workflow_approvals
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.workflow_executions we
  JOIN public.workflows w ON w.id = we.workflow_id
  WHERE we.id = workflow_approvals.workflow_execution_id 
  AND w.company_id = get_my_company_id()
));

CREATE POLICY "System can create workflow approvals"
ON public.workflow_approvals
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workflow_executions we
  JOIN public.workflows w ON w.id = we.workflow_id
  WHERE we.id = workflow_approvals.workflow_execution_id 
  AND w.company_id = get_my_company_id()
));

CREATE POLICY "Assignees can update their approvals"
ON public.workflow_approvals
FOR UPDATE
USING (
  assignee_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.workflow_executions we
    JOIN public.workflows w ON w.id = we.workflow_id
    WHERE we.id = workflow_approvals.workflow_execution_id 
    AND w.company_id = get_my_company_id()
    AND current_user_is_admin()
  )
);

-- RLS Policies for workflow_notifications table
CREATE POLICY "Users can view notifications for their company workflows"
ON public.workflow_notifications
FOR SELECT
USING (
  recipient_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.workflow_executions we
    JOIN public.workflows w ON w.id = we.workflow_id
    WHERE we.id = workflow_notifications.workflow_execution_id 
    AND w.company_id = get_my_company_id()
  )
);

CREATE POLICY "System can create workflow notifications"
ON public.workflow_notifications
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workflow_executions we
  JOIN public.workflows w ON w.id = we.workflow_id
  WHERE we.id = workflow_notifications.workflow_execution_id 
  AND w.company_id = get_my_company_id()
));

CREATE POLICY "System can update workflow notifications"
ON public.workflow_notifications
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.workflow_executions we
  JOIN public.workflows w ON w.id = we.workflow_id
  WHERE we.id = workflow_notifications.workflow_execution_id 
  AND w.company_id = get_my_company_id()
));

-- Create indexes for better performance
CREATE INDEX idx_workflows_company_id ON public.workflows(company_id);
CREATE INDEX idx_workflows_form_template_id ON public.workflows(form_template_id);
CREATE INDEX idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_form_submission_id ON public.workflow_executions(form_submission_id);
CREATE INDEX idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX idx_workflow_approvals_execution_id ON public.workflow_approvals(workflow_execution_id);
CREATE INDEX idx_workflow_approvals_assignee_id ON public.workflow_approvals(assignee_id);
CREATE INDEX idx_workflow_approvals_status ON public.workflow_approvals(status);
CREATE INDEX idx_workflow_notifications_execution_id ON public.workflow_notifications(workflow_execution_id);
CREATE INDEX idx_workflow_notifications_recipient_id ON public.workflow_notifications(recipient_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_executions_updated_at
  BEFORE UPDATE ON public.workflow_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_approvals_updated_at
  BEFORE UPDATE ON public.workflow_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_notifications_updated_at
  BEFORE UPDATE ON public.workflow_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();