import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { invitationId } = await req.json();

    if (!invitationId) {
      throw new Error('invitationId is required');
    }

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select(`
        *,
        companies!inner(name),
        profiles!inner(full_name)
      `)
      .eq('id', invitationId)
      .single();

    if (invitationError || !invitation) {
      throw new Error('Invitation not found');
    }

    // Generate invitation URL
    const invitationUrl = `${req.headers.get('origin') || 'http://localhost:5173'}/invite/${invitation.invitation_token}`;

    // Prepare email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>You're invited to join ${invitation.companies.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px 20px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
            .role-badge { background: #e3f2fd; color: #1565c0; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #333;">🎉 You're Invited!</h1>
              <p style="margin: 10px 0 0 0; color: #666;">Join ${invitation.companies.name} on ProjectPulse</p>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p><strong>${invitation.profiles.full_name}</strong> has invited you to join <strong>${invitation.companies.name}</strong> on ProjectPulse.</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Your role:</strong> <span class="role-badge">${invitation.company_role.replace('_', ' ').toUpperCase()}</span></p>
              </div>

              <p>Click the button below to accept your invitation and create your account:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationUrl}" class="button">Accept Invitation</a>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${invitationUrl}">${invitationUrl}</a>
              </p>
              
              <div class="footer">
                <p><strong>Note:</strong> This invitation will expire in 7 days. If you have any questions, please contact ${invitation.profiles.full_name}.</p>
                <p>Welcome to the team! 🚀</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ProjectPulse <onboarding@resend.dev>',
        to: [invitation.email],
        subject: `You're invited to join ${invitation.companies.name}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Resend API error:', errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResult.id,
        message: `Invitation email sent to ${invitation.email}` 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-invitation function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});