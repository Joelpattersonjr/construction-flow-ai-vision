import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FormInvitationRequest {
  recipientEmail: string;
  recipientName?: string;
  formId: string;
  formName: string;
  senderName?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recipientEmail, 
      recipientName, 
      formId, 
      formName, 
      senderName, 
      message 
    }: FormInvitationRequest = await req.json();

    if (!recipientEmail || !formId || !formName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const publicFormUrl = `${Deno.env.get("SUPABASE_URL")?.replace('/rest/v1', '')}/public/forms/${formId}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Form Invitation: ${formName}</h2>
        
        ${recipientName ? `<p>Hello ${recipientName},</p>` : '<p>Hello,</p>'}
        
        <p>You've been invited to fill out a form${senderName ? ` by ${senderName}` : ''}.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #555;">Form: ${formName}</h3>
          ${message ? `<p style="margin-bottom: 15px;"><em>"${message}"</em></p>` : ''}
          
          <a href="${publicFormUrl}" 
             style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
            Fill Out Form
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          You can also copy and paste this link into your browser:<br>
          <a href="${publicFormUrl}">${publicFormUrl}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999;">
          This form does not require any login or registration. Your responses will be submitted directly.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Forms <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `Form Invitation: ${formName}`,
      html: emailHtml,
    });

    console.log("Form invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      formUrl: publicFormUrl 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-form-invitation function:", error);
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