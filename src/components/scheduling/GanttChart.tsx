
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

    // Update critical path status
    const criticalTasks = calculateCriticalPathForTasks(processedTasks);
    processedTasks.forEach(task => {
      task.isCriticalPath = criticalTasks.has(task.id);
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

  const calculateCriticalPathForTasks = (taskList: GanttTask[]) => {
    const taskMap = new Map(taskList.map(t => [t.id, t]));
    const criticalTasks = new Set<number>();

    const calculateLongestPath = (task: GanttTask, visited = new Set<number>()): number => {
      if (visited.has(task.id)) return 0;
      visited.add(task.id);

      const taskDuration = differenceInDays(task.endDate, task.startDate);
      let maxDepPath = 0;

      task.dependencies.forEach(depId => {
        const depTask = taskMap.get(depId);
        if (depTask) {
          const depPath = calculateLongestPath(depTask, new Set(visited));
          maxDepPath = Math.max(maxDepPath, depPath);
        }
      });

      return taskDuration + maxDepPath;
    };

    let maxDuration = 0;
    taskList.forEach(task => {
      const duration = calculateLongestPath(task);
      if (duration > maxDuration) {
        maxDuration = duration;
      }
    });

    taskList.forEach(task => {
      const duration = calculateLongestPath(task);
      if (duration === maxDuration) {
        criticalTasks.add(task.id);
      }
    });

    return criticalTasks;
  };

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
        return 'bg-destructive';
      case 'medium':
        return 'bg-orange-500';
      case 'low':
        return 'bg-primary';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'border-destructive';
      case 'medium':
        return 'border-orange-500';
      case 'low':
        return 'border-primary';
      default:
        return 'border-muted-foreground';
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

    // Validate dependency constraints
    const conflictingTasks = validateDependencyConstraints(draggedTask, targetDate);
    if (conflictingTasks.length > 0) {
      console.warn('Dependency constraint violation detected');
      return;
    }

    onTaskUpdate(draggedTask.id, {
      start_date: format(targetDate, 'yyyy-MM-dd'),
      end_date: format(newEndDate, 'yyyy-MM-dd')
    });

    setDraggedTask(null);
  };

  const validateDependencyConstraints = (task: GanttTask, newStartDate: Date) => {
    const conflicts: GanttTask[] = [];
    
    // Check if task starts before its dependencies end
    task.dependencies.forEach(depId => {
      const depTask = ganttTasks.find(t => t.id === depId);
      if (depTask && newStartDate <= depTask.endDate) {
        conflicts.push(depTask);
      }
    });

    // Check if dependent tasks would start before this task ends
    const newEndDate = addDays(newStartDate, differenceInDays(task.endDate, task.startDate));
    ganttTasks.forEach(t => {
      if (t.dependencies.includes(task.id) && t.startDate <= newEndDate) {
        conflicts.push(t);
      }
    });

    return conflicts;
  };

  const calculateCriticalPath = () => {
    // Simple critical path calculation
    const taskMap = new Map(ganttTasks.map(t => [t.id, t]));
    const criticalTasks = new Set<number>();

    // Find longest path through dependencies
    const calculateLongestPath = (task: GanttTask, visited = new Set<number>()): number => {
      if (visited.has(task.id)) return 0; // Avoid cycles
      visited.add(task.id);

      const taskDuration = differenceInDays(task.endDate, task.startDate);
      let maxDepPath = 0;

      task.dependencies.forEach(depId => {
        const depTask = taskMap.get(depId);
        if (depTask) {
          const depPath = calculateLongestPath(depTask, new Set(visited));
          maxDepPath = Math.max(maxDepPath, depPath);
        }
      });

      return taskDuration + maxDepPath;
    };

    // Mark tasks on critical path
    let maxDuration = 0;
    ganttTasks.forEach(task => {
      const duration = calculateLongestPath(task);
      if (duration > maxDuration) {
        maxDuration = duration;
      }
    });

    ganttTasks.forEach(task => {
      const duration = calculateLongestPath(task);
      if (duration === maxDuration) {
        criticalTasks.add(task.id);
      }
    });

    return criticalTasks;
  };

  // Calculate critical path
  const criticalPathTasks = useMemo(() => calculateCriticalPath(), [ganttTasks]);

  const renderDependencyLine = (fromTask: GanttTask, toTask: GanttTask) => {
    const fromPosition = calculateTaskPosition(fromTask);
    const toPosition = calculateTaskPosition(toTask);
    
    const fromTaskIndex = ganttTasks.findIndex(t => t.id === fromTask.id);
    const toTaskIndex = ganttTasks.findIndex(t => t.id === toTask.id);
    
    const fromY = (fromTaskIndex * 48) + 24; // 48px row height, center point
    const toY = (toTaskIndex * 48) + 24;
    
    // Calculate line positions
    const fromX = parseFloat(fromPosition.left) + parseFloat(fromPosition.width);
    const toX = parseFloat(toPosition.left);
    
    const lineLength = Math.abs(toX - fromX);
    const lineHeight = Math.abs(toY - fromY);
    
    return (
      <g key={`dep-${fromTask.id}-${toTask.id}`}>
        {/* Horizontal line from end of first task */}
        <line
          x1={`${fromX}%`}
          y1={fromY}
          x2={`${fromX + 2}%`}
          y2={fromY}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        
        {/* Vertical connector if tasks are on different rows */}
        {fromY !== toY && (
          <line
            x1={`${fromX + 2}%`}
            y1={fromY}
            x2={`${fromX + 2}%`}
            y2={toY}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="2"
          />
        )}
        
        {/* Horizontal line to start of second task */}
        <line
          x1={`${fromX + 2}%`}
          y1={toY}
          x2={`${toX}%`}
          y2={toY}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      </g>
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
                  {/* SVG for dependency lines */}
                  <svg
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{ 
                      width: `${timelineColumns.length * 40}px`,
                      height: `${ganttTasks.length * 48}px`
                    }}
                  >
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3.5, 0 7"
                          fill="hsl(var(--muted-foreground))"
                        />
                      </marker>
                    </defs>
                    
                    {/* Render dependency lines */}
                    {ganttTasks.flatMap(task => 
                      task.dependencies.map(depId => {
                        const depTask = ganttTasks.find(t => t.id === depId);
                        return depTask ? renderDependencyLine(depTask, task) : null;
                      })
                    )}
                  </svg>

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
                                "absolute top-2 h-8 rounded cursor-move transition-all duration-200 border-2",
                                task.milestone ? "bg-yellow-500 border-yellow-600" : `${getPriorityColor(task.priority)} ${getPriorityBorderColor(task.priority)}`,
                                task.isCriticalPath && "ring-2 ring-destructive shadow-lg",
                                selectedTask?.id === task.id && "ring-2 ring-primary"
                              )}
                              style={position}
                              draggable
                              onDragStart={(e) => handleTaskDrag(task, e)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => handleTaskDrop(e, task.startDate)}
                            >
                              {/* Progress Bar */}
                              <div
                                className="h-full bg-green-500/70 rounded-l"
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
                              <div className="text-gray-500">Priority: {task.priority}</div>
                              {task.isCriticalPath && (
                                <div className="text-red-500 font-medium">⚠️ Critical Path</div>
                              )}
                              {task.dependencies.length > 0 && (
                                <div className="text-gray-500">
                                  Dependencies: {task.dependencies.map(depId => {
                                    const depTask = ganttTasks.find(t => t.id === depId);
                                    return depTask?.title || depId;
                                  }).join(', ')}
                                </div>
                              )}
                              {task.assignee && (
                                <div className="text-gray-500">Assigned: {task.assignee.full_name}</div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
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
