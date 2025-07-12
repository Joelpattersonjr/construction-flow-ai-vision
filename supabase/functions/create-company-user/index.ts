import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-COMPANY-USER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role key to bypass RLS for company/profile creation
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { companyName, fullName, jobTitle } = await req.json();
    if (!companyName || !fullName) {
      throw new Error("Company name and full name are required");
    }

    logStep("Creating company", { companyName });

    // Create the company first
    const { data: company, error: companyError } = await supabaseService
      .from('companies')
      .insert({
        name: companyName,
        owner_id: user.id,
        subscription_tier: 'free',
        subscription_status: 'active',
        subscription_features: {
          version_control: false,
          collaboration: false,
          advanced_analytics: false,
          time_tracking: false,
        }
      })
      .select()
      .single();

    if (companyError) {
      logStep("Error creating company", { error: companyError });
      throw new Error(`Failed to create company: ${companyError.message}`);
    }

    logStep("Company created successfully", { companyId: company.id });

    // Create or update the user profile
    const profileData = {
      id: user.id,
      email: user.email,
      full_name: fullName,
      job_title: jobTitle || null,
      company_id: company.id,
      company_role: 'company_admin', // First user becomes company admin
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabaseService
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (profileError) {
      logStep("Error creating profile", { error: profileError });
      // If profile creation fails, we should clean up the company
      await supabaseService
        .from('companies')
        .delete()
        .eq('id', company.id);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    logStep("Profile created successfully", { userId: user.id, companyId: company.id });

    return new Response(JSON.stringify({
      success: true,
      company: {
        id: company.id,
        name: company.name
      },
      profile: {
        id: user.id,
        full_name: fullName,
        company_role: 'company_admin'
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-company-user", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});