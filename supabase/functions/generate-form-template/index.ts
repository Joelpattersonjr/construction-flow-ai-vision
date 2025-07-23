import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formType, customDescription, companyId, userId } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Construction form templates and knowledge base
    const formTemplates = {
      'daily_report': {
        category: 'daily_log',
        description: 'Comprehensive daily progress and site conditions report for construction projects',
        prompt: `Create a detailed Daily Report form for construction projects. Include fields for:
- Project information (project name, date, weather conditions, temperature)
- Work progress (work completed today, work planned for tomorrow, overall progress percentage)
- Workforce (crew count, labor hours, overtime hours)
- Equipment (equipment on site, equipment status, fuel usage)
- Materials (materials delivered, materials used, materials needed)
- Safety (safety incidents, safety observations, PPE compliance)
- Visitors (visitor log with names, companies, purpose of visit)
- Issues and delays (description of any delays or problems)
- Photos and attachments
- Supervisor signature and approval`
      },
      'safety_inspection': {
        category: 'safety',
        description: 'Comprehensive safety inspection checklist and incident reporting',
        prompt: `Create a Safety Inspection form for construction sites. Include fields for:
- Inspector information (name, certification, date, time)
- Site information (project name, location, weather conditions)
- PPE inspection (hard hats, safety glasses, high-vis vests, gloves, safety boots)
- Equipment safety (scaffolding, ladders, power tools, heavy machinery)
- Hazard identification (fall hazards, electrical hazards, chemical hazards, confined spaces)
- Housekeeping (material storage, waste disposal, walkways clear, signage)
- Emergency preparedness (first aid stations, fire extinguishers, emergency exits, evacuation plans)
- Training verification (safety training records, toolbox talks conducted)
- Corrective actions (issues found, corrective measures required, responsible party, completion date)
- Overall safety rating and inspector signature`
      },
      'rfi': {
        category: 'rfi',
        description: 'Request for Information to clarify project specifications and requirements',
        prompt: `Create an RFI (Request for Information) form for construction projects. Include fields for:
- RFI details (RFI number, date submitted, project name, location)
- Requestor information (name, company, role, contact information)
- Recipient information (addressed to, company, role)
- Question/request details (subject, detailed description, urgency level)
- Reference information (drawing numbers, specification sections, related documents)
- Impact assessment (schedule impact, cost impact, work stoppage)
- Attachments (sketches, photos, documents, drawings)
- Response tracking (response required by date, actual response date)
- Resolution (response summary, action required, approved by)
- Distribution list and approval signatures`
      },
      'incident_report': {
        category: 'incident',
        description: 'Detailed incident and accident reporting for workplace safety compliance',
        prompt: `Create an Incident Report form for construction safety incidents. Include fields for:
- Incident details (date, time, location, weather conditions)
- Reporter information (name, position, contact, witness status)
- Injured person details (name, age, position, experience level, company)
- Incident description (what happened, sequence of events, root cause analysis)
- Injury details (type of injury, body part affected, medical attention required)
- Equipment involved (tools, machinery, PPE being used)
- Environmental factors (lighting, noise, temperature, surface conditions)
- Immediate actions taken (first aid, emergency services, work stoppage)
- Contributing factors (unsafe acts, unsafe conditions, inadequate training)
- Witnesses (names, contact information, statements)
- Corrective actions (immediate, short-term, long-term prevention measures)
- Investigation team and supervisor signatures`
      },
      'quality_control': {
        category: 'quality',
        description: 'Quality control inspection and compliance verification',
        prompt: `Create a Quality Control inspection form for construction projects. Include fields for:
- Inspection details (date, time, inspector name, project phase)
- Work area information (location, contractor, work type, specifications)
- Inspection criteria (code requirements, specification standards, drawings referenced)
- Quality checklist (materials approval, workmanship standards, dimensional accuracy)
- Test results (concrete strength, soil compaction, welding inspection, electrical testing)
- Deficiencies found (description, location, severity, photos)
- Compliance status (pass/fail, conditional approval, rejection)
- Corrective actions (required corrections, responsible party, completion timeline)
- Material certifications (supplier certificates, test reports, compliance documents)
- Final approval (inspector signature, date, next inspection required)`
      }
    };

    // Get the template or use custom description
    const template = formTemplates[formType as keyof typeof formTemplates];
    const systemPrompt = template ? template.prompt : customDescription;
    const category = template ? template.category : 'general';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert form designer for construction and project management. Generate comprehensive form schemas in JSON format. 

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
  "name": "Form Name",
  "description": "Form description",
  "category": "category_name",
  "fields": [
    {
      "id": "unique_id",
      "type": "field_type",
      "label": "Field Label",
      "placeholder": "Placeholder text",
      "required": true/false,
      "options": ["option1", "option2"] // only for select/radio/checkbox types
    }
  ]
}

Available field types: text, textarea, number, email, phone, date, select, checkbox, radio, file, signature, location

Make fields practical and industry-standard. Include proper validation and logical field ordering.`
          },
          {
            role: 'user',
            content: systemPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Parse the JSON response
    let formSchema;
    try {
      formSchema = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse generated form schema:', parseError);
      throw new Error('Generated form schema is not valid JSON');
    }

    // Validate the schema structure
    if (!formSchema.name || !formSchema.fields || !Array.isArray(formSchema.fields)) {
      throw new Error('Generated form schema is missing required fields');
    }

    // Add unique IDs to fields if missing
    formSchema.fields = formSchema.fields.map((field: any, index: number) => ({
      ...field,
      id: field.id || `field_${Date.now()}_${index}`
    }));

    // Save the generated template to database
    const { data: savedTemplate, error: saveError } = await supabase
      .from('form_templates')
      .insert({
        name: formSchema.name,
        description: formSchema.description,
        category: formSchema.category || category,
        form_schema: { fields: formSchema.fields },
        company_id: companyId,
        created_by: userId,
        is_active: true
      })
      .select()
      .single();

    if (saveError) {
      console.error('Database save error:', saveError);
      throw new Error('Failed to save generated template');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        template: savedTemplate,
        schema: formSchema 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in generate-form-template:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate form template' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});