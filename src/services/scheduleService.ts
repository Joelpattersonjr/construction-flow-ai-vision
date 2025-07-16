import { supabase } from "@/integrations/supabase/client";
import { ScheduleSlot, TeamScheduleTemplate, ScheduleAnalytics } from "@/types/scheduling";

export const scheduleService = {
  // Schedule Slots Management
  async createScheduleSlot(slotData: {
    task_id: number;
    user_id: string;
    date: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
  }): Promise<ScheduleSlot> {
    // Check for overlaps first
    const { data: overlap } = await supabase.rpc('check_schedule_overlap', {
      p_user_id: slotData.user_id,
      p_date: slotData.date,
      p_start_time: slotData.start_time,
      p_end_time: slotData.end_time
    });

    if (overlap) {
      throw new Error('Time slot overlaps with existing schedule');
    }

    const { data, error } = await supabase
      .from('task_schedule_slots')
      .insert(slotData)
      .select(`
        *,
        task:tasks(id, title, priority, status),
        user:profiles(id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return data as ScheduleSlot;
  },

  async getScheduleSlots(userId: string, startDate: string, endDate: string): Promise<ScheduleSlot[]> {
    const { data, error } = await supabase
      .from('task_schedule_slots')
      .select(`
        *,
        task:tasks(id, title, priority, status),
        user:profiles(id, full_name, email)
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return (data || []) as ScheduleSlot[];
  },

  async updateScheduleSlot(slotId: string, updates: Partial<ScheduleSlot>): Promise<ScheduleSlot> {
    // If time is being updated, check for overlaps
    if (updates.start_time || updates.end_time || updates.date) {
      const { data: currentSlot } = await supabase
        .from('task_schedule_slots')
        .select('*')
        .eq('id', slotId)
        .single();

      if (currentSlot) {
        const { data: overlap } = await supabase.rpc('check_schedule_overlap', {
          p_user_id: currentSlot.user_id,
          p_date: updates.date || currentSlot.date,
          p_start_time: updates.start_time || currentSlot.start_time,
          p_end_time: updates.end_time || currentSlot.end_time,
          p_slot_id: slotId
        });

        if (overlap) {
          throw new Error('Updated time slot would overlap with existing schedule');
        }
      }
    }

    const { data, error } = await supabase
      .from('task_schedule_slots')
      .update(updates)
      .eq('id', slotId)
      .select(`
        *,
        task:tasks(id, title, priority, status),
        user:profiles(id, full_name, email)
      `)
      .single();

    if (error) throw error;
    return data as ScheduleSlot;
  },

  async deleteScheduleSlot(slotId: string): Promise<void> {
    const { error } = await supabase
      .from('task_schedule_slots')
      .delete()
      .eq('id', slotId);

    if (error) throw error;
  },

  // Team Schedule Templates
  async createTemplate(template: {
    name: string;
    description?: string;
    work_hours_start: string;
    work_hours_end: string;
    break_duration_minutes: number;
  }): Promise<TeamScheduleTemplate> {
    const { data: user } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.user?.id)
      .single();

    const { data, error } = await supabase
      .from('team_schedule_templates')
      .insert({
        ...template,
        company_id: profile?.company_id,
        created_by: user.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as TeamScheduleTemplate;
  },

  async getCompanyTemplates(): Promise<TeamScheduleTemplate[]> {
    const { data, error } = await supabase
      .from('team_schedule_templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as TeamScheduleTemplate[];
  },

  // Schedule Analytics
  async getScheduleAnalytics(userId: string, date: string): Promise<ScheduleAnalytics | null> {
    const { data, error } = await supabase
      .from('schedule_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as ScheduleAnalytics | null;
  },

  async updateScheduleAnalytics(userId: string, date: string): Promise<void> {
    // Calculate efficiency using the database function
    const { data: efficiency } = await supabase.rpc('calculate_schedule_efficiency', {
      p_user_id: userId,
      p_date: date
    });

    // Get scheduled task count and hours
    const { data: slots } = await supabase
      .from('task_schedule_slots')
      .select('duration_minutes')
      .eq('user_id', userId)
      .eq('date', date);

    const scheduledMinutes = (slots || []).reduce((sum, slot) => sum + slot.duration_minutes, 0);
    const scheduledHours = scheduledMinutes / 60;
    const tasksScheduled = (slots || []).length;

    // Get completed tasks for the day
    const { data: completedTasks } = await supabase
      .from('task_time_entries')
      .select('task_id')
      .eq('user_id', userId)
      .gte('start_time', `${date}T00:00:00`)
      .lt('start_time', `${date}T23:59:59`)
      .not('end_time', 'is', null);

    const tasksCompleted = new Set(completedTasks?.map(t => t.task_id) || []).size;

    // Get actual hours worked
    const { data: timeEntries } = await supabase
      .from('task_time_entries')
      .select('duration_seconds')
      .eq('user_id', userId)
      .gte('start_time', `${date}T00:00:00`)
      .lt('start_time', `${date}T23:59:59`)
      .not('duration_seconds', 'is', null);

    const actualSeconds = (timeEntries || []).reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0);
    const actualHours = actualSeconds / 3600;

    // Upsert analytics
    const { error } = await supabase
      .from('schedule_analytics')
      .upsert({
        user_id: userId,
        date,
        scheduled_hours: scheduledHours,
        actual_hours: actualHours,
        tasks_scheduled: tasksScheduled,
        tasks_completed: tasksCompleted,
        efficiency_score: efficiency || 0
      });

    if (error) throw error;
  },

  // Team Scheduling
  async getTeamSchedule(date: string): Promise<ScheduleSlot[]> {
    const { data, error } = await supabase
      .from('task_schedule_slots')
      .select(`
        *,
        task:tasks(id, title, priority, status),
        user:profiles(id, full_name, email)
      `)
      .eq('date', date)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return (data || []) as ScheduleSlot[];
  },

  // Utility functions
  generateTimeSlots(startHour: number = 8, endHour: number = 17, intervalMinutes: number = 30): string[] {
    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  },

  calculateDurationMinutes(startTime: string, endTime: string): number {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }
};