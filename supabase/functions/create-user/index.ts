import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  companyId: number;
  companyRole: string;
  fullName?: string;
  jobTitle?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Creating user - function started");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("Environment check:", { 
      hasUrl: !!supabaseUrl, 
      hasServiceKey: !!supabaseServiceKey 
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables");
      throw new Error("Missing required environment variables");
    }
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase admin client created");

    const requestBody = await req.json();
    console.log("Request body received:", Object.keys(requestBody));
    
    const { email, password, companyId, companyRole, fullName, jobTitle }: CreateUserRequest = requestBody;

    // Check if requesting user is a company admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !requestingUser) {
      throw new Error("Invalid authentication");
    }

    console.log("Checking authorization for user:", requestingUser.id);

    // Verify requesting user is admin of the company using service role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('company_id, company_role')
      .eq('id', requestingUser.id)
      .single();

    console.log("Profile query result:", { profile, profileError });

    if (profileError || !profile) {
      console.error("Profile not found or error:", profileError);
      throw new Error("Profile not found");
    }

    console.log("Profile found:", { 
      userRole: profile.company_role, 
      userCompany: profile.company_id, 
      requestedCompany: companyId 
    });

    if (profile.company_role !== 'company_admin' || profile.company_id !== companyId) {
      throw new Error("Insufficient permissions");
    }

    // Create the user using admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        job_title: jobTitle,
      }
    });

    if (createError) {
      throw createError;
    }

    // Create profile for the new user
    const { error: profileInsertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        company_id: companyId,
        company_role: companyRole,
        full_name: fullName,
        job_title: jobTitle,
      });

    if (profileInsertError) {
      // If profile creation fails, delete the user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw profileInsertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          full_name: fullName,
          job_title: jobTitle,
          company_role: companyRole,
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Error creating user:", error);
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