export interface ScheduleSlot {
  id: string;
  task_id: number;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  task?: {
    id: number;
    title: string | null;
    priority: string | null;
    status: string | null;
  };
  user?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

export interface TeamScheduleTemplate {
  id: string;
  name: string;
  description: string | null;
  company_id: number;
  created_by: string;
  is_active: boolean;
  work_hours_start: string;
  work_hours_end: string;
  break_duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface ScheduleAnalytics {
  id: string;
  user_id: string;
  date: string;
  scheduled_hours: number;
  actual_hours: number;
  tasks_scheduled: number;
  tasks_completed: number;
  efficiency_score: number;
  created_at: string;
}

export interface TimeSlot {
  time: string;
  slot?: ScheduleSlot | null;
  isEmpty: boolean;
}

export interface DaySchedule {
  date: string;
  slots: ScheduleSlot[];
  analytics?: ScheduleAnalytics;
}