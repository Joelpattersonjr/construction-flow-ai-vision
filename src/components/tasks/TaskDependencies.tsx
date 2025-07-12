import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, X, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

import { Task, TaskWithDetails } from '@/types/tasks';
import { taskService } from '@/services/taskService';

interface TaskDependenciesProps {
  task: TaskWithDetails;
  onTaskUpdate: (updates: Partial<Task>) => void;
}

export const TaskDependencies: React.FC<TaskDependenciesProps> = ({
  task,
  onTaskUpdate,
}) => {
  const [availableTasks, setAvailableTasks] = useState<TaskWithDetails[]>([]);
  const [selectedDependency, setSelectedDependency] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAvailableTasks();
  }, [task.project_id]);

  const loadAvailableTasks = async () => {
    if (!task.project_id) return;
    
    try {
      const tasks = await taskService.getProjectTasks(task.project_id);
      // Filter out current task and completed tasks
      const filteredTasks = tasks.filter(t => 
        t.id !== task.id && 
        t.status !== 'completed' &&
        !wouldCreateCircularDependency(t.id, task.id, tasks)
      );
      setAvailableTasks(filteredTasks);
    } catch (error) {
      toast({
        title: 'Error loading tasks',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // Check if adding this dependency would create a circular dependency
  const wouldCreateCircularDependency = (
    dependencyId: number, 
    taskId: number, 
    allTasks: TaskWithDetails[]
  ): boolean => {
    const visited = new Set<number>();
    
    const hasCycle = (currentId: number): boolean => {
      if (visited.has(currentId)) return true;
      if (currentId === dependencyId) return true;
      
      visited.add(currentId);
      
      const dependentTasks = allTasks.filter(t => t.dependency_id === currentId);
      return dependentTasks.some(t => hasCycle(t.id));
    };
    
    return hasCycle(taskId);
  };

  const addDependency = async () => {
    if (!selectedDependency) return;
    
    setIsLoading(true);
    try {
      const dependencyId = parseInt(selectedDependency);
      await onTaskUpdate({ dependency_id: dependencyId });
      setSelectedDependency('');
      await loadAvailableTasks();
      toast({ title: 'Dependency added successfully' });
    } catch (error) {
      toast({
        title: 'Error adding dependency',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeDependency = async () => {
    setIsLoading(true);
    try {
      await onTaskUpdate({ dependency_id: null });
      await loadAvailableTasks();
      toast({ title: 'Dependency removed successfully' });
    } catch (error) {
      toast({
        title: 'Error removing dependency',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDependencyStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isDependencyBlocking = task.dependency && task.dependency.status !== 'completed';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Dependencies
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Dependency */}
        {task.dependency ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium text-sm">{task.dependency.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={getDependencyStatusColor(task.dependency.status)}
                    >
                      {task.dependency.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={removeDependency}
                disabled={isLoading}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {isDependencyBlocking && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This task is blocked by an incomplete dependency. 
                  The dependent task must be completed before this task can proceed.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No dependencies set. This task can be started immediately.
          </div>
        )}

        {/* Add New Dependency */}
        {!task.dependency && availableTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Select value={selectedDependency} onValueChange={setSelectedDependency}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a task this depends on..." />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  {availableTasks.map((availableTask) => (
                    <SelectItem key={availableTask.id} value={availableTask.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{availableTask.title}</span>
                        <Badge 
                          variant="outline" 
                          className={getDependencyStatusColor(availableTask.status)}
                        >
                          {availableTask.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={addDependency}
                disabled={!selectedDependency || isLoading}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {!task.dependency && availableTasks.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No available tasks to depend on in this project.
          </div>
        )}

        {/* Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Dependencies determine task execution order</p>
          <p>• A task cannot start until its dependencies are completed</p>
          <p>• Circular dependencies are prevented automatically</p>
        </div>
      </CardContent>
    </Card>
  );
};