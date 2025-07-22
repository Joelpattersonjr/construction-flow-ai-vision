import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { form_submission_id } = await req.json();

    console.log("Triggering workflows for form submission:", form_submission_id);

    // Get form submission with template info
    const { data: submission, error: submissionError } = await supabase
      .from("form_submissions")
      .select(`
        *,
        form_templates (
          id,
          name,
          company_id
        )
      `)
      .eq("id", form_submission_id)
      .single();

    if (submissionError || !submission) {
      throw new Error(`Form submission not found: ${submissionError?.message}`);
    }

    // Find active workflows for this form template
    const { data: workflows, error: workflowsError } = await supabase
      .from("workflows")
      .select("*")
      .eq("form_template_id", submission.form_template_id)
      .eq("is_active", true);

    if (workflowsError) {
      throw new Error(`Error finding workflows: ${workflowsError.message}`);
    }

    if (!workflows || workflows.length === 0) {
      console.log("No active workflows found for form template");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No active workflows found for this form template",
          workflows_triggered: 0
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${workflows.length} active workflows to trigger`);

    // Trigger each workflow
    const triggerPromises = workflows.map(async (workflow) => {
      try {
        console.log(`Triggering workflow: ${workflow.name} (${workflow.id})`);

        // Call the execute-workflow function
        const executeResponse = await supabase.functions.invoke('execute-workflow', {
          body: {
            workflow_id: workflow.id,
            form_submission_id: submission.id,
            form_data: submission.submission_data
          }
        });

        if (executeResponse.error) {
          console.error(`Failed to trigger workflow ${workflow.id}:`, executeResponse.error);
          return { workflow_id: workflow.id, status: 'failed', error: executeResponse.error };
        }

        console.log(`Successfully triggered workflow ${workflow.id}`);
        return { workflow_id: workflow.id, status: 'triggered', execution_id: executeResponse.data?.execution_id };

      } catch (error) {
        console.error(`Error triggering workflow ${workflow.id}:`, error);
        return { workflow_id: workflow.id, status: 'failed', error: error.message };
      }
    });

    const results = await Promise.all(triggerPromises);
    const successful = results.filter(r => r.status === 'triggered').length;
    const failed = results.filter(r => r.status === 'failed').length;

    console.log(`Workflow trigger summary: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Triggered ${successful} workflows successfully`,
        workflows_triggered: successful,
        workflows_failed: failed,
        results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in trigger-workflow:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);