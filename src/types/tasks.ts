export interface Task {
  id: number;
  title: string | null;
  description?: string | null;
  status: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date: string | null;
  end_date: string | null;
  project_id: string | null;
  assignee_id: string | null;
  dependency_id: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskLabel {
  id: string;
  task_id: number;
  label_name: string;
  label_color: string;
  created_at: string;
}

export interface TaskTimeEntry {
  id: string;
  task_id: number;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

export interface TaskWithDetails extends Task {
  assignee?: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  project?: {
    id: string;
    name: string | null;
  };
  labels?: TaskLabel[];
  dependency?: {
    id: number;
    title: string | null;
    status: string | null;
  };
  time_entries?: TaskTimeEntry[];
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';