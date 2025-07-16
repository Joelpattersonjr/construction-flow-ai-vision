import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { taskService } from '@/services/taskService';
import { scheduleService } from '@/services/scheduleService';
import { Task } from '@/types/tasks';
import { useToast } from '@/hooks/use-toast';

interface TaskScheduleFormProps {
  date: string;
  initialData?: {
    task_id: number;
    start_time: string;
    end_time: string;
    duration_minutes: number;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function TaskScheduleForm({
  date,
  initialData,
  onSubmit,
  onCancel,
  isEditing = false
}: TaskScheduleFormProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    initialData?.task_id?.toString() || ''
  );
  const [startTime, setStartTime] = useState(initialData?.start_time || '09:00');
  const [endTime, setEndTime] = useState(initialData?.end_time || '10:00');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    // Auto-calculate end time when start time changes
    if (startTime && !isEditing) {
      const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
      const endMinutes = startMinutes + 60; // Default 1 hour duration
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      setEndTime(`${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`);
    }
  }, [startTime, isEditing]);

  const loadTasks = async () => {
    try {
      const companyTasks = await taskService.getCompanyTasks();
      // Filter out completed tasks and sort by priority
      const availableTasks = companyTasks
        .filter(task => task.status !== 'completed')
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        });
      setTasks(availableTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks.",
        variant: "destructive",
      });
    }
  };

  const calculateDuration = (): number => {
    if (!startTime || !endTime) return 0;
    return scheduleService.calculateDurationMinutes(startTime, endTime);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTaskId || !startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const duration = calculateDuration();
    if (duration <= 0) {
      toast({
        title: "Error",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        task_id: parseInt(selectedTaskId),
        start_time: startTime,
        end_time: endTime,
        duration_minutes: duration
      });
    } catch (error) {
      console.error('Error scheduling task:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="task" className="text-sm font-medium">
            Task
          </Label>
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a task to schedule" />
            </SelectTrigger>
            <SelectContent>
              {tasks.map((task) => (
                <SelectItem key={task.id} value={task.id.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{task.title}</span>
                    <span className={`text-xs ml-2 ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-time" className="text-sm font-medium">
              Start Time
            </Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="end-time" className="text-sm font-medium">
              End Time
            </Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Date: {new Date(date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <Clock className="w-4 h-4" />
            <span>Duration: {formatDuration(calculateDuration())}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-600"
        >
          {loading ? 'Scheduling...' : isEditing ? 'Update Schedule' : 'Schedule Task'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}