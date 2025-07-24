import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { form_template_id, form_data, business_context, industry = "construction" } = await req.json();

    console.log("Generating workflow for form template:", form_template_id);

    // Get form template details
    const { data: formTemplate, error: formError } = await supabase
      .from("form_templates")
      .select("*")
      .eq("id", form_template_id)
      .single();

    if (formError || !formTemplate) {
      throw new Error(`Form template not found: ${formError?.message}`);
    }

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Analyze form structure and generate workflow
    const formFields = JSON.stringify(formTemplate.fields, null, 2);
    
    const prompt = `You are an expert workflow designer for the ${industry} industry. 
    
    Form Template: "${formTemplate.name}"
    Description: "${formTemplate.description || 'No description provided'}"
    Category: "${formTemplate.category}"
    
    Form Fields:
    ${formFields}
    
    Business Context: ${business_context || 'Standard approval process needed'}
    
    Generate a comprehensive approval workflow for this form that includes:
    1. Logical approval steps based on form content and industry best practices
    2. Conditional routing based on field values (e.g., budget thresholds, priority levels)
    3. Appropriate notification steps for stakeholders
    4. Industry-specific requirements (safety, compliance, documentation)
    
    Return a JSON object with this exact structure:
    {
      "name": "Workflow name based on form",
      "description": "Brief workflow description",
      "workflow_steps": [
        {
          "id": "unique_step_id",
          "type": "start",
          "label": "Start",
          "position": { "x": 100, "y": 100 },
          "data": {}
        },
        {
          "id": "step_2",
          "type": "approval",
          "label": "Manager Approval",
          "position": { "x": 300, "y": 100 },
          "data": {
            "approver_role": "manager",
            "approval_message": "Please review and approve this request",
            "required": true,
            "timeout_hours": 48
          }
        },
        {
          "id": "condition_1",
          "type": "condition",
          "label": "Budget Check",
          "position": { "x": 500, "y": 100 },
          "data": {
            "field_name": "budget_amount",
            "operator": "greater_than",
            "value": "10000",
            "condition_logic": "if budget > $10,000 then senior approval required"
          }
        },
        {
          "id": "notification_1",
          "type": "notification",
          "label": "Notify Team",
          "position": { "x": 300, "y": 300 },
          "data": {
            "recipients": ["team_lead", "project_manager"],
            "subject": "New {{form_name}} Submitted",
            "message": "A new {{form_name}} has been submitted and requires attention."
          }
        },
        {
          "id": "end_approved",
          "type": "end",
          "label": "Approved",
          "position": { "x": 700, "y": 100 },
          "data": { "status": "approved" }
        },
        {
          "id": "end_rejected",
          "type": "end",
          "label": "Rejected",
          "position": { "x": 700, "y": 300 },
          "data": { "status": "rejected" }
        }
      ],
      "workflow_connections": [
        { "id": "conn_1", "source": "unique_step_id", "target": "step_2", "data": {} },
        { "id": "conn_2", "source": "step_2", "target": "condition_1", "data": { "condition": "approved" } },
        { "id": "conn_3", "source": "condition_1", "target": "end_approved", "data": { "condition": "true" } },
        { "id": "conn_4", "source": "condition_1", "target": "notification_1", "data": { "condition": "false" } },
        { "id": "conn_5", "source": "notification_1", "target": "end_approved", "data": {} },
        { "id": "conn_6", "source": "step_2", "target": "end_rejected", "data": { "condition": "rejected" } }
      ]
    }
    
    Make the workflow practical and industry-appropriate. For construction forms, consider safety approvals, permit requirements, and regulatory compliance. Position nodes in a logical flow from left to right.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert workflow designer. Always respond with valid JSON only, no additional text or formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error:", errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const openAIData = await response.json();
    const generatedContent = openAIData.choices[0].message.content;

    console.log("Generated workflow content:", generatedContent);

    // Parse the JSON response
    let workflowData;
    try {
      workflowData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", generatedContent);
      throw new Error("Invalid JSON response from OpenAI");
    }

    // Validate required fields
    if (!workflowData.name || !workflowData.workflow_steps || !workflowData.workflow_connections) {
      throw new Error("Invalid workflow data structure");
    }

    return new Response(
      JSON.stringify({
        success: true,
        workflow: workflowData
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in generate-workflow function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);