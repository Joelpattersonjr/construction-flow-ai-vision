
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { taskService } from '@/services/taskService';
import { TaskWithDetails } from '@/types/tasks';
import { format, addDays, differenceInDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface GanttTask extends TaskWithDetails {
  startDate: Date;
  endDate: Date;
  progress: number;
  dependencies: number[];
  isCriticalPath: boolean;
  milestone?: boolean;
}

interface GanttChartProps {
  projectId?: string;
  tasks: TaskWithDetails[];
  onTaskUpdate?: (taskId: number, updates: any) => void;
  className?: string;
}

export function GanttChart({ projectId, tasks, onTaskUpdate, className }: GanttChartProps) {
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [timelineStart, setTimelineStart] = useState<Date>(new Date());
  const [timelineEnd, setTimelineEnd] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
  const [draggedTask, setDraggedTask] = useState<GanttTask | null>(null);

  // Convert tasks to Gantt format
  useEffect(() => {
    const processedTasks: GanttTask[] = tasks.map(task => {
      const startDate = task.start_date ? new Date(task.start_date) : new Date();
      const endDate = task.end_date ? new Date(task.end_date) : addDays(startDate, 7);
      
      return {
        ...task,
        startDate,
        endDate,
        progress: task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0,
        dependencies: task.dependency_id ? [task.dependency_id] : [],
        isCriticalPath: false, // Will be calculated
        milestone: task.title?.toLowerCase().includes('milestone') || 
                  task.title?.toLowerCase().includes('inspection') ||
                  task.title?.toLowerCase().includes('delivery')
      };
    });

    // Calculate timeline bounds
    if (processedTasks.length > 0) {
      const dates = processedTasks.flatMap(t => [t.startDate, t.endDate]);
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      
      setTimelineStart(addDays(minDate, -7));
      setTimelineEnd(addDays(maxDate, 7));
    }

    setGanttTasks(processedTasks);
  }, [tasks]);

  // Generate timeline columns (days)
  const timelineColumns = useMemo(() => {
    const columns: Date[] = [];
    let current = new Date(timelineStart);
    
    while (current <= timelineEnd) {
      columns.push(new Date(current));
      current = addDays(current, 1);
    }
    
    return columns;
  }, [timelineStart, timelineEnd]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const calculateTaskPosition = (task: GanttTask) => {
    const totalDays = differenceInDays(timelineEnd, timelineStart);
    const startOffset = differenceInDays(task.startDate, timelineStart);
    const duration = differenceInDays(task.endDate, task.startDate) + 1;
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`
    };
  };

  const handleTaskDrag = (task: GanttTask, e: React.DragEvent) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTaskDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    if (!draggedTask || !onTaskUpdate) return;

    const duration = differenceInDays(draggedTask.endDate, draggedTask.startDate);
    const newEndDate = addDays(targetDate, duration);

    onTaskUpdate(draggedTask.id, {
      start_date: format(targetDate, 'yyyy-MM-dd'),
      end_date: format(newEndDate, 'yyyy-MM-dd')
    });

    setDraggedTask(null);
  };

  const renderDependencyLine = (fromTask: GanttTask, toTask: GanttTask) => {
    // Simple dependency line rendering (would need more complex logic for proper positioning)
    return (
      <div
        key={`dep-${fromTask.id}-${toTask.id}`}
        className="absolute h-0.5 bg-gray-400 z-10"
        style={{
          // Simplified positioning - would need proper calculation
          top: '50%',
          left: '0%',
          width: '100%'
        }}
      />
    );
  };

  return (
    <TooltipProvider>
      <Card className={cn("border-0 bg-white/40 backdrop-blur-sm shadow-lg", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Project Gantt Chart
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white/60">
                {ganttTasks.length} Tasks
              </Badge>
              <Badge variant="outline" className="bg-white/60">
                {format(timelineStart, 'MMM dd')} - {format(timelineEnd, 'MMM dd')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="flex">
            {/* Task List Column */}
            <div className="w-80 border-r border-gray-200 bg-white/60">
              <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                <h3 className="font-semibold text-sm">Task Name</h3>
              </div>
              <ScrollArea className="h-96">
                {ganttTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "p-3 border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer transition-colors",
                      selectedTask?.id === task.id && "bg-blue-50/50"
                    )}
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-center gap-2">
                      {task.milestone ? (
                        <div className="w-3 h-3 bg-yellow-500 rotate-45" />
                      ) : (
                        <div className={cn("w-3 h-3 rounded-full", getPriorityColor(task.priority))} />
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium truncate">
                          {task.title}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(task.startDate, 'MMM dd')} - {format(task.endDate, 'MMM dd')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {task.progress}%
                        </Badge>
                        {task.isCriticalPath && (
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Timeline Column */}
            <div className="flex-1 overflow-x-auto">
              {/* Timeline Header */}
              <div className="flex border-b border-gray-200 bg-gray-50/50 min-w-max">
                {timelineColumns.map((date) => (
                  <div
                    key={date.toISOString()}
                    className="w-10 p-2 text-xs text-center border-r border-gray-100"
                  >
                    <div className="font-medium">{format(date, 'dd')}</div>
                    <div className="text-gray-500">{format(date, 'EEE')}</div>
                  </div>
                ))}
              </div>

              {/* Timeline Content */}
              <ScrollArea className="h-96">
                <div className="relative min-w-max">
                  {ganttTasks.map((task, index) => {
                    const position = calculateTaskPosition(task);
                    
                    return (
                      <div
                        key={task.id}
                        className="relative h-12 border-b border-gray-100 hover:bg-gray-50/20"
                        style={{ minWidth: `${timelineColumns.length * 40}px` }}
                      >
                        {/* Task Bar */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "absolute top-2 h-8 rounded cursor-move transition-all duration-200",
                                task.milestone ? "bg-yellow-500" : getProgressColor(task.progress),
                                task.isCriticalPath && "ring-2 ring-red-400",
                                selectedTask?.id === task.id && "ring-2 ring-blue-400"
                              )}
                              style={position}
                              draggable
                              onDragStart={(e) => handleTaskDrag(task, e)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => handleTaskDrop(e, task.startDate)}
                            >
                              {/* Progress Bar */}
                              <div
                                className="h-full bg-green-400 rounded-l opacity-80"
                                style={{ width: `${task.progress}%` }}
                              />
                              
                              {/* Task Name */}
                              <div className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white truncate">
                                {task.title}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div className="font-medium">{task.title}</div>
                              <div className="text-gray-500">
                                {format(task.startDate, 'MMM dd')} - {format(task.endDate, 'MMM dd')}
                              </div>
                              <div className="text-gray-500">Progress: {task.progress}%</div>
                              {task.assignee && (
                                <div className="text-gray-500">Assigned: {task.assignee.full_name}</div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>

                        {/* Dependencies */}
                        {task.dependencies.map(depId => {
                          const depTask = ganttTasks.find(t => t.id === depId);
                          return depTask ? renderDependencyLine(depTask, task) : null;
                        })}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
