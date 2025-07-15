import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  userId: string;
  companyId: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('authorization')!;
    const { data: user } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (!user.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Verify the requesting user is a company admin
    const { data: adminProfile } = await supabaseClient
      .from('profiles')
      .select('company_role, company_id')
      .eq('id', user.user.id)
      .single();

    if (!adminProfile || adminProfile.company_role !== 'company_admin') {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { userId, companyId }: PasswordResetRequest = await req.json();

    // Verify the target user belongs to the same company
    const { data: targetProfile } = await supabaseClient
      .from('profiles')
      .select('email, company_id')
      .eq('id', userId)
      .single();

    if (!targetProfile || targetProfile.company_id !== adminProfile.company_id || targetProfile.company_id !== companyId) {
      return new Response(JSON.stringify({ error: 'User not found or not in your company' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Generate temporary password
    const { data: tempPasswordData } = await supabaseClient.rpc('generate_temporary_password');
    const temporaryPassword = tempPasswordData;

    // Store the temporary password reset record
    const { error: resetError } = await supabaseClient
      .from('admin_password_resets')
      .insert({
        user_id: userId,
        temporary_password: temporaryPassword,
        created_by: user.user.id,
      });

    if (resetError) {
      console.error('Error creating password reset record:', resetError);
      throw resetError;
    }

    // Reset user's password using Supabase Auth Admin API
    const { error: passwordError } = await supabaseClient.auth.admin.updateUserById(userId, {
      password: temporaryPassword
    });

    if (passwordError) {
      console.error('Error updating user password:', passwordError);
      throw passwordError;
    }

    // Clear any existing lockouts for this user
    await supabaseClient
      .from('account_lockouts')
      .delete()
      .eq('email', targetProfile.email);

    console.log(`Password reset successfully for user ${userId} by admin ${user.user.id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      temporaryPassword,
      message: 'Password reset successfully. The temporary password is valid for 24 hours.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in admin-password-reset function: Password reset failed');
    return new Response(
      JSON.stringify({ error: 'Password reset failed. Please try again.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);