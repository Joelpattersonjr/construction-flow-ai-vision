import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { taskService } from '@/services/taskService';
import { TaskDetailsDialog } from '../tasks/TaskDetailsDialog';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  classNames: string[];
  extendedProps: {
    task: any;
    priority: string;
    status: string;
    assignee?: any;
    project?: any;
  };
}

interface TaskCalendarProps {
  companyTasks?: any[];
  onTaskUpdate?: () => void;
}

export const TaskCalendar: React.FC<TaskCalendarProps> = ({ 
  companyTasks, 
  onTaskUpdate 
}) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load tasks
  useEffect(() => {
    loadTasks();
  }, [companyTasks]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      let tasksData = companyTasks;
      
      if (!tasksData) {
        tasksData = await taskService.getCompanyTasks();
      }
      
      setTasks(tasksData);
      convertTasksToEvents(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks for calendar.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const convertTasksToEvents = (tasksData: any[]) => {
    const calendarEvents: CalendarEvent[] = tasksData
      .filter(task => task.end_date) // Only show tasks with due dates
      .map(task => {
        // Determine colors based on priority and status
        const getPriorityColors = (priority: string, status: string) => {
          if (status === 'completed') {
            return {
              backgroundColor: '#22c55e',
              borderColor: '#16a34a',
              textColor: '#ffffff'
            };
          }
          
          switch (priority) {
            case 'high':
              return {
                backgroundColor: '#ef4444',
                borderColor: '#dc2626',
                textColor: '#ffffff'
              };
            case 'medium':
              return {
                backgroundColor: '#f97316',
                borderColor: '#ea580c',
                textColor: '#ffffff'
              };
            case 'low':
              return {
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                textColor: '#ffffff'
              };
            default:
              return {
                backgroundColor: '#6b7280',
                borderColor: '#4b5563',
                textColor: '#ffffff'
              };
          }
        };

        const colors = getPriorityColors(task.priority || 'medium', task.status || 'todo');
        
        return {
          id: task.id.toString(),
          title: task.title || 'Untitled Task',
          start: task.end_date,
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          textColor: colors.textColor,
          classNames: ['cursor-pointer', 'transition-all', 'hover:opacity-80'],
          extendedProps: {
            task,
            priority: task.priority || 'medium',
            status: task.status || 'todo',
            assignee: task.assignee,
            project: task.project
          }
        };
      });

    setEvents(calendarEvents);
  };

  // Handle event click
  const handleEventClick = (info: any) => {
    const task = info.event.extendedProps.task;
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  // Handle date selection for creating new tasks
  const handleDateSelect = (selectInfo: any) => {
    const title = prompt('Enter task title:');
    if (title) {
      // Create new task with selected date
      const newTask = {
        title,
        end_date: format(selectInfo.start, 'yyyy-MM-dd'),
        status: 'todo' as const,
        priority: 'medium' as const
      };
      
      taskService.createTask(newTask)
        .then(() => {
          toast({
            title: "Task created",
            description: "New task has been added to the calendar.",
          });
          loadTasks();
          onTaskUpdate?.();
        })
        .catch(error => {
          console.error('Error creating task:', error);
          toast({
            title: "Error",
            description: "Failed to create task.",
            variant: "destructive",
          });
        });
    }
    
    // Clear selection
    selectInfo.view.calendar.unselect();
  };

  // Handle event drop (drag and drop)
  const handleEventDrop = async (info: any) => {
    const task = info.event.extendedProps.task;
    const newDate = format(info.event.start, 'yyyy-MM-dd');
    
    try {
      await taskService.updateTask(task.id, {
        end_date: newDate
      });
      
      toast({
        title: "Task updated",
        description: `Task due date changed to ${format(info.event.start, 'PPP')}.`,
      });
      
      loadTasks();
      onTaskUpdate?.();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task due date.",
        variant: "destructive",
      });
      // Revert the change
      info.revert();
    }
  };

  const handleTaskUpdate = () => {
    loadTasks();
    onTaskUpdate?.();
    setIsTaskDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <style>{`
        .fc-theme-standard .fc-scrollgrid {
          border: 1px solid hsl(var(--border));
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: hsl(var(--border));
        }
        .fc-col-header-cell {
          background: hsl(var(--muted));
          font-weight: 600;
        }
        .fc-daygrid-day {
          background: hsl(var(--background));
        }
        .fc-daygrid-day:hover {
          background: hsl(var(--muted) / 0.5);
        }
        .fc-day-today {
          background: hsl(var(--primary) / 0.1) !important;
        }
        .fc-event {
          border-radius: 4px;
          padding: 1px 3px;
          font-size: 12px;
          font-weight: 500;
        }
        .fc-event:hover {
          filter: brightness(1.1);
        }
        .fc-toolbar-title {
          color: hsl(var(--foreground));
          font-weight: 600;
        }
        .fc-button {
          background: hsl(var(--primary)) !important;
          border-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }
        .fc-button:hover {
          background: hsl(var(--primary) / 0.9) !important;
        }
        .fc-button:disabled {
          background: hsl(var(--muted)) !important;
          border-color: hsl(var(--muted)) !important;
          color: hsl(var(--muted-foreground)) !important;
        }
      `}</style>
      
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        initialView="dayGridMonth"
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        height="auto"
        eventDisplay="block"
        displayEventTime={false}
        eventTextColor="#ffffff"
        eventMouseEnter={(info) => {
          info.el.style.transform = 'scale(1.05)';
          info.el.style.zIndex = '10';
        }}
        eventMouseLeave={(info) => {
          info.el.style.transform = 'scale(1)';
          info.el.style.zIndex = '1';
        }}
      />

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={selectedTask}
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
      />
    </div>
  );
};