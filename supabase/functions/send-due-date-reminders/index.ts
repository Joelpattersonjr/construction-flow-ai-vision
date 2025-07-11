import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Running due date reminder check...');

    // Get tasks that are due within the next 24 hours and haven't been completed
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: dueTasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!fk_tasks_assignee_id(id, full_name, email, preferences),
        project:projects(id, name)
      `)
      .eq('status', 'in_progress')
      .lte('end_date', tomorrow.toISOString().split('T')[0])
      .not('assignee_id', 'is', null);

    if (tasksError) {
      console.error('Error fetching due tasks:', tasksError);
      throw tasksError;
    }

    console.log(`Found ${dueTasks?.length || 0} tasks due within 24 hours`);

    let notificationsSent = 0;

    if (dueTasks && dueTasks.length > 0) {
      for (const task of dueTasks) {
        try {
          // Check if user has notifications enabled
          const assignee = task.assignee;
          const preferences = assignee?.preferences as any;
          
          const emailEnabled = preferences?.notifications?.email !== false;
          const dueDateRemindersEnabled = preferences?.notifications?.due_date_reminders !== false;
          
          if (!emailEnabled || !dueDateRemindersEnabled) {
            console.log(`Skipping notification for task ${task.id} - user has notifications disabled`);
            continue;
          }

          // Send due date reminder email
          const { error: emailError } = await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'due_date_reminder',
              recipient_email: assignee.email,
              recipient_name: assignee.full_name || assignee.email,
              data: {
                task: {
                  id: task.id,
                  title: task.title,
                  description: task.description,
                  due_date: task.end_date,
                  priority: task.priority
                },
                project: {
                  id: task.project.id,
                  name: task.project.name
                }
              }
            }
          });

          if (emailError) {
            console.error(`Error sending reminder for task ${task.id}:`, emailError);
          } else {
            console.log(`Sent due date reminder for task ${task.id} to ${assignee.email}`);
            notificationsSent++;
          }
        } catch (error) {
          console.error(`Error processing task ${task.id}:`, error);
        }
      }
    }

    console.log(`Due date reminder check complete. Sent ${notificationsSent} notifications.`);

    return new Response(JSON.stringify({ 
      success: true, 
      tasks_checked: dueTasks?.length || 0,
      notifications_sent: notificationsSent
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in due date reminder function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process due date reminders",
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