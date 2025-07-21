
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Clock, Users, BarChart3, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GanttChart } from './GanttChart';
import { taskService } from '@/services/taskService';
import { TaskWithDetails } from '@/types/tasks';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface GanttScheduleViewProps {
  projectId?: string;
  onTaskUpdate?: (taskId: number, updates: any) => void;
}

export function GanttScheduleView({ projectId, onTaskUpdate }: GanttScheduleViewProps) {
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasksData = projectId 
        ? await taskService.getProjectTasks(projectId)
        : await taskService.getCompanyTasks();
      
      // Filter tasks that have dates
      const tasksWithDates = tasksData.filter(task => task.start_date && task.end_date);
      setTasks(tasksWithDates);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks for Gantt chart.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId: number, updates: any) => {
    try {
      await taskService.updateTask(taskId, updates);
      await loadTasks();
      
      if (onTaskUpdate) {
        onTaskUpdate(taskId, updates);
      }
      
      toast({
        title: "Success",
        description: "Task updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update task.",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterPriority !== 'all' && task.priority !== filterPriority) {
      return false;
    }
    if (filterStatus !== 'all' && task.status !== filterStatus) {
      return false;
    }
    return true;
  });

  const getProjectStats = () => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'completed').length;
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
    const overdue = filteredTasks.filter(t => 
      t.end_date && new Date(t.end_date) < new Date() && t.status !== 'completed'
    ).length;

    return { total, completed, inProgress, overdue };
  };

  const stats = getProjectStats();

  if (loading) {
    return (
      <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Gantt chart...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Priority:</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-32 bg-white/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Status:</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 bg-white/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCriticalPath(!showCriticalPath)}
              className={showCriticalPath ? "bg-red-100 border-red-300" : "bg-white/60"}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Critical Path
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => toast({ title: "Export", description: "Export functionality coming soon!" })}
              className="bg-white/60 ml-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      {filteredTasks.length > 0 ? (
        <GanttChart
          projectId={projectId}
          tasks={filteredTasks}
          onTaskUpdate={handleTaskUpdate}
        />
      ) : (
        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tasks with Dates</h3>
            <p className="text-muted-foreground">
              Tasks need start and end dates to appear in the Gantt chart.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
