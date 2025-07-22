import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WorkflowStep {
  id: string;
  type: 'start' | 'approval' | 'notification' | 'condition' | 'end';
  label: string;
  assignee?: string;
  action?: string;
  description?: string;
  position: { x: number; y: number };
}

interface WorkflowConnection {
  source: string;
  target: string;
  condition_field?: string;
  condition_operator?: string;
  condition_value?: string;
  label?: string;
}

interface WorkflowConfig {
  workflow_steps: WorkflowStep[];
  workflow_connections: WorkflowConnection[];
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workflow_id, form_submission_id, form_data } = await req.json();

    console.log("Starting workflow execution:", { workflow_id, form_submission_id });

    // Get workflow configuration
    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflow_id)
      .single();

    if (workflowError || !workflow) {
      throw new Error(`Workflow not found: ${workflowError?.message}`);
    }

    const config = workflow.workflow_config as WorkflowConfig;

    // Create workflow execution record
    const { data: execution, error: executionError } = await supabase
      .from("workflow_executions")
      .insert({
        workflow_id,
        form_submission_id,
        status: "running",
        current_step_id: "1", // Start node
        execution_data: {
          form_data,
          steps_completed: [],
          current_context: {}
        }
      })
      .select()
      .single();

    if (executionError || !execution) {
      throw new Error(`Failed to create execution: ${executionError?.message}`);
    }

    console.log("Created workflow execution:", execution.id);

    // Start workflow execution in background
    EdgeRuntime.waitUntil(executeWorkflow(execution.id, config, form_data));

    return new Response(
      JSON.stringify({ 
        success: true, 
        execution_id: execution.id,
        message: "Workflow execution started"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in execute-workflow:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function executeWorkflow(executionId: string, config: WorkflowConfig, formData: any) {
  try {
    console.log("Executing workflow for execution:", executionId);

    const steps = config.workflow_steps;
    const connections = config.workflow_connections;

    // Find start node
    const startStep = steps.find(step => step.type === 'start');
    if (!startStep) {
      throw new Error("No start step found in workflow");
    }

    let currentStepId = startStep.id;
    const context = { form_data: formData };

    while (currentStepId) {
      const currentStep = steps.find(step => step.id === currentStepId);
      if (!currentStep) {
        console.error("Step not found:", currentStepId);
        break;
      }

      console.log("Processing step:", currentStep.label, currentStep.type);

      // Update current step in execution
      await supabase
        .from("workflow_executions")
        .update({
          current_step_id: currentStepId,
          execution_data: context
        })
        .eq("id", executionId);

      // Process the step based on its type
      const nextStepId = await processStep(executionId, currentStep, context, connections);
      
      if (currentStep.type === 'end') {
        // Mark workflow as completed
        await supabase
          .from("workflow_executions")
          .update({
            status: "completed",
            completed_at: new Date().toISOString()
          })
          .eq("id", executionId);
        break;
      }

      currentStepId = nextStepId;
    }

    console.log("Workflow execution completed:", executionId);

  } catch (error) {
    console.error("Error executing workflow:", error);
    
    // Mark workflow as failed
    await supabase
      .from("workflow_executions")
      .update({
        status: "failed",
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq("id", executionId);
  }
}

async function processStep(
  executionId: string,
  step: WorkflowStep,
  context: any,
  connections: WorkflowConnection[]
): Promise<string | null> {
  
  switch (step.type) {
    case 'start':
      console.log("Processing start step");
      return getNextStep(step.id, connections, context);

    case 'notification':
      console.log("Processing notification step");
      await processNotificationStep(executionId, step, context);
      return getNextStep(step.id, connections, context);

    case 'approval':
      console.log("Processing approval step");
      await processApprovalStep(executionId, step, context);
      // Approval steps require manual action, so we pause execution here
      return null;

    case 'condition':
      console.log("Processing condition step");
      return processConditionStep(step.id, connections, context);

    case 'end':
      console.log("Processing end step");
      return null;

    default:
      console.log("Unknown step type:", step.type);
      return getNextStep(step.id, connections, context);
  }
}

async function processNotificationStep(executionId: string, step: WorkflowStep, context: any) {
  try {
    // Create notification record
    const { data: notification, error } = await supabase
      .from("workflow_notifications")
      .insert({
        workflow_execution_id: executionId,
        step_id: step.id,
        notification_type: step.action || 'email',
        subject: `Workflow Notification: ${step.label}`,
        message: step.description || `Workflow step "${step.label}" has been triggered.`,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create notification:", error);
      return;
    }

    // Send email if configured
    if (step.action === 'email' || step.action === 'both') {
      try {
        await resend.emails.send({
          from: "Workflow <workflow@resend.dev>",
          to: [step.assignee || "admin@company.com"],
          subject: `Workflow Notification: ${step.label}`,
          html: `
            <h2>${step.label}</h2>
            <p>${step.description || 'A workflow step has been triggered.'}</p>
            <h3>Form Data:</h3>
            <pre>${JSON.stringify(context.form_data, null, 2)}</pre>
          `
        });

        // Update notification as sent
        await supabase
          .from("workflow_notifications")
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq("id", notification.id);

        console.log("Email notification sent successfully");
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        
        await supabase
          .from("workflow_notifications")
          .update({
            status: 'failed',
            error_message: emailError.message
          })
          .eq("id", notification.id);
      }
    }
  } catch (error) {
    console.error("Error in notification step:", error);
  }
}

async function processApprovalStep(executionId: string, step: WorkflowStep, context: any) {
  try {
    // Create approval record
    const { data: approval, error } = await supabase
      .from("workflow_approvals")
      .insert({
        workflow_execution_id: executionId,
        step_id: step.id,
        assignee_email: step.assignee,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create approval:", error);
      return;
    }

    // Send approval email
    try {
      await resend.emails.send({
        from: "Workflow <workflow@resend.dev>",
        to: [step.assignee || "admin@company.com"],
        subject: `Approval Required: ${step.label}`,
        html: `
          <h2>Approval Required</h2>
          <p><strong>Step:</strong> ${step.label}</p>
          <p><strong>Description:</strong> ${step.description || 'Please review and approve this workflow step.'}</p>
          
          <h3>Form Data to Review:</h3>
          <pre>${JSON.stringify(context.form_data, null, 2)}</pre>
          
          <div style="margin: 20px 0;">
            <a href="${Deno.env.get('SUPABASE_URL')}/dashboard/approvals/${approval.id}" 
               style="background: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Review & Approve
            </a>
          </div>
          
          <p><em>This approval expires in 7 days.</em></p>
        `
      });

      // Update notification sent timestamp
      await supabase
        .from("workflow_approvals")
        .update({
          notification_sent_at: new Date().toISOString()
        })
        .eq("id", approval.id);

      console.log("Approval email sent successfully");
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }
  } catch (error) {
    console.error("Error in approval step:", error);
  }
}

function processConditionStep(stepId: string, connections: WorkflowConnection[], context: any): string | null {
  // Find connections from this condition step
  const outgoingConnections = connections.filter(conn => conn.source === stepId);
  
  for (const connection of outgoingConnections) {
    if (connection.condition_field && connection.condition_operator && connection.condition_value) {
      const fieldValue = getFieldValue(context.form_data, connection.condition_field);
      
      if (evaluateCondition(fieldValue, connection.condition_operator, connection.condition_value)) {
        console.log("Condition met, following connection to:", connection.target);
        return connection.target;
      }
    }
  }
  
  // If no conditions met, follow first connection (default path)
  return outgoingConnections.length > 0 ? outgoingConnections[0].target : null;
}

function getNextStep(stepId: string, connections: WorkflowConnection[], context: any): string | null {
  const nextConnection = connections.find(conn => conn.source === stepId);
  return nextConnection ? nextConnection.target : null;
}

function getFieldValue(formData: any, fieldPath: string): any {
  // Simple field path resolution (can be enhanced for nested fields)
  return formData[fieldPath];
}

function evaluateCondition(fieldValue: any, operator: string, targetValue: string): boolean {
  switch (operator) {
    case 'equals':
      return String(fieldValue) === targetValue;
    case 'not_equals':
      return String(fieldValue) !== targetValue;
    case 'greater_than':
      return Number(fieldValue) > Number(targetValue);
    case 'less_than':
      return Number(fieldValue) < Number(targetValue);
    case 'contains':
      return String(fieldValue).toLowerCase().includes(targetValue.toLowerCase());
    default:
      return false;
  }
}

serve(handler);