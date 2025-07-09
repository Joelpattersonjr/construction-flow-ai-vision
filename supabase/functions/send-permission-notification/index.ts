import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'member_added' | 'member_removed' | 'role_changed';
  projectId: string;
  targetUserId: string;
  actorUserId: string;
  newRole?: string;
  previousRole?: string;
}

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
      console.error('RESEND_API_KEY is missing');
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, projectId, targetUserId, actorUserId, newRole, previousRole }: NotificationRequest = await req.json();

    if (!type || !projectId || !targetUserId || !actorUserId) {
      throw new Error('Missing required notification parameters');
    }

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        name,
        project_number,
        company:companies(name)
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    // Get target user details
    const { data: targetUser, error: targetUserError } = await supabase
      .from('profiles')
      .select('full_name, id')
      .eq('id', targetUserId)
      .single();

    if (targetUserError || !targetUser) {
      throw new Error('Target user not found');
    }

    // Get actor user details
    const { data: actorUser, error: actorUserError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', actorUserId)
      .single();

    if (actorUserError || !actorUser) {
      throw new Error('Actor user not found');
    }

    // Get target user's email from auth.users
    const { data: { user: targetAuthUser }, error: userError } = await supabase.auth.admin.getUserById(targetUserId);

    if (userError || !targetAuthUser?.email) {
      throw new Error('Target user email not found');
    }

    // Generate email content based on notification type
    let subject: string;
    let emailContent: string;

    switch (type) {
      case 'member_added':
        subject = `You've been added to ${project.name}`;
        emailContent = `
          <h2>You've been added to a project</h2>
          <p><strong>${actorUser.full_name}</strong> has added you to the project <strong>${project.name}</strong>.</p>
          ${newRole ? `<p>Your role: <strong>${newRole.replace('_', ' ').toUpperCase()}</strong></p>` : ''}
          <p>You can now access this project and its resources.</p>
        `;
        break;

      case 'member_removed':
        subject = `You've been removed from ${project.name}`;
        emailContent = `
          <h2>You've been removed from a project</h2>
          <p><strong>${actorUser.full_name}</strong> has removed you from the project <strong>${project.name}</strong>.</p>
          <p>You no longer have access to this project and its resources.</p>
        `;
        break;

      case 'role_changed':
        subject = `Your role has been updated in ${project.name}`;
        emailContent = `
          <h2>Your project role has been updated</h2>
          <p><strong>${actorUser.full_name}</strong> has updated your role in the project <strong>${project.name}</strong>.</p>
          ${previousRole ? `<p>Previous role: <strong>${previousRole.replace('_', ' ').toUpperCase()}</strong></p>` : ''}
          ${newRole ? `<p>New role: <strong>${newRole.replace('_', ' ').toUpperCase()}</strong></p>` : ''}
        `;
        break;

      default:
        throw new Error('Invalid notification type');
    }

    // Prepare email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px 20px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef; }
            .project-info { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 14px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #333;">🔔 Project Notification</h1>
              <p style="margin: 10px 0 0 0; color: #666;">ProjectPulse</p>
            </div>
            <div class="content">
              ${emailContent}
              
              <div class="project-info">
                <p style="margin: 0;"><strong>Project:</strong> ${project.name}</p>
                ${project.project_number ? `<p style="margin: 5px 0 0 0;"><strong>Project Number:</strong> ${project.project_number}</p>` : ''}
                <p style="margin: 5px 0 0 0;"><strong>Company:</strong> ${project.company?.name || 'Unknown'}</p>
              </div>
              
              <div class="footer">
                <p>This is an automated notification from ProjectPulse. If you have any questions, please contact your project administrator.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    console.log('Sending permission notification email to:', targetAuthUser.email);
    
    const emailPayload = {
      from: 'ProjectPulse <notifications@resend.dev>',
      to: [targetAuthUser.email],
      subject: subject,
      html: emailHtml,
    };

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Resend API error:', {
        status: emailResponse.status,
        statusText: emailResponse.statusText,
        error: errorData
      });
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResult = await emailResponse.json();
    console.log('Permission notification email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResult.id,
        message: `Permission notification sent to ${targetAuthUser.email}` 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-permission-notification function:', error);
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