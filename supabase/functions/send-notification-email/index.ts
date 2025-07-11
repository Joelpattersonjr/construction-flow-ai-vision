import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  type: 'task_assignment' | 'due_date_reminder' | 'project_update' | 'task_comment';
  recipient_email: string;
  recipient_name: string;
  data: {
    task?: {
      id: number;
      title: string;
      description?: string;
      due_date?: string;
      priority?: string;
    };
    project?: {
      id: string;
      name: string;
    };
    assigner?: {
      name: string;
      email: string;
    };
    comment?: {
      content: string;
      author: string;
    };
    app_url?: string;
  };
}

const generateEmailContent = (request: EmailNotificationRequest) => {
  const { type, recipient_name, data } = request;
  const appUrl = data.app_url || 'https://your-app.com';

  switch (type) {
    case 'task_assignment':
      return {
        subject: `New Task Assigned: ${data.task?.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; margin-bottom: 20px;">New Task Assignment</h2>
            
            <p>Hi ${recipient_name},</p>
            
            <p>You have been assigned a new task by ${data.assigner?.name || 'a team member'}:</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">${data.task?.title}</h3>
              ${data.task?.description ? `<p style="margin: 5px 0; color: #64748b;">${data.task.description}</p>` : ''}
              ${data.task?.due_date ? `<p style="margin: 5px 0; color: #dc2626;"><strong>Due:</strong> ${new Date(data.task.due_date).toLocaleDateString()}</p>` : ''}
              ${data.task?.priority ? `<p style="margin: 5px 0;"><strong>Priority:</strong> <span style="color: ${data.task.priority === 'high' ? '#dc2626' : data.task.priority === 'medium' ? '#ea580c' : '#16a34a'};">${data.task.priority}</span></p>` : ''}
            </div>
            
            <div style="margin: 30px 0;">
              <a href="${appUrl}/tasks" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Task</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #64748b; font-size: 14px;">
              Project: ${data.project?.name || 'Unknown Project'}<br>
              You can manage your notification preferences in your profile settings.
            </p>
          </div>
        `
      };

    case 'due_date_reminder':
      const daysUntilDue = data.task?.due_date 
        ? Math.ceil((new Date(data.task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      return {
        subject: `Task Due ${daysUntilDue <= 0 ? 'Today' : `in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`}: ${data.task?.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: ${daysUntilDue <= 0 ? '#dc2626' : '#ea580c'}; margin-bottom: 20px;">
              ${daysUntilDue <= 0 ? '⚠️ Task Due Today!' : '📅 Task Due Soon'}
            </h2>
            
            <p>Hi ${recipient_name},</p>
            
            <p>This is a reminder that your task is ${daysUntilDue <= 0 ? 'due today' : `due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`}:</p>
            
            <div style="background-color: ${daysUntilDue <= 0 ? '#fef2f2' : '#fff7ed'}; border-left: 4px solid ${daysUntilDue <= 0 ? '#dc2626' : '#ea580c'}; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">${data.task?.title}</h3>
              ${data.task?.description ? `<p style="margin: 5px 0; color: #64748b;">${data.task.description}</p>` : ''}
              <p style="margin: 5px 0; color: ${daysUntilDue <= 0 ? '#dc2626' : '#ea580c'};"><strong>Due:</strong> ${data.task?.due_date ? new Date(data.task.due_date).toLocaleDateString() : 'Not set'}</p>
            </div>
            
            <div style="margin: 30px 0;">
              <a href="${appUrl}/tasks" style="background-color: ${daysUntilDue <= 0 ? '#dc2626' : '#ea580c'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Task</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #64748b; font-size: 14px;">
              Project: ${data.project?.name || 'Unknown Project'}<br>
              You can manage your notification preferences in your profile settings.
            </p>
          </div>
        `
      };

    case 'task_comment':
      return {
        subject: `New Comment on Task: ${data.task?.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; margin-bottom: 20px;">💬 New Comment</h2>
            
            <p>Hi ${recipient_name},</p>
            
            <p>${data.comment?.author} left a comment on your task:</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">${data.task?.title}</h3>
              <div style="background-color: white; padding: 10px; border-radius: 4px; margin-top: 10px;">
                <p style="margin: 0; color: #374151;">"${data.comment?.content}"</p>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">— ${data.comment?.author}</p>
              </div>
            </div>
            
            <div style="margin: 30px 0;">
              <a href="${appUrl}/tasks" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Task</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #64748b; font-size: 14px;">
              Project: ${data.project?.name || 'Unknown Project'}<br>
              You can manage your notification preferences in your profile settings.
            </p>
          </div>
        `
      };

    case 'project_update':
      return {
        subject: `Project Update: ${data.project?.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; margin-bottom: 20px;">📋 Project Update</h2>
            
            <p>Hi ${recipient_name},</p>
            
            <p>There's been an update to your project:</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">${data.project?.name}</h3>
              <p style="margin: 5px 0; color: #64748b;">Check the project for the latest updates and changes.</p>
            </div>
            
            <div style="margin: 30px 0;">
              <a href="${appUrl}/projects/${data.project?.id}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Project</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #64748b; font-size: 14px;">
              You can manage your notification preferences in your profile settings.
            </p>
          </div>
        `
      };

    default:
      return {
        subject: 'Notification',
        html: `<p>You have a new notification.</p>`
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const request: EmailNotificationRequest = await req.json();
    
    console.log('Email notification request:', {
      type: request.type,
      recipient: request.recipient_email,
      task: request.data.task?.title,
    });

    const { subject, html } = generateEmailContent(request);

    const emailResponse = await resend.emails.send({
      from: "TaskFlow <notifications@resend.dev>",
      to: [request.recipient_email],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      email_id: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send email notification",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);