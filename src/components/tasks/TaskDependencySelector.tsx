import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskWithDetails } from '@/types/tasks';

interface TaskDependencySelectorProps {
  tasks: TaskWithDetails[];
  currentTaskId?: number;
  selectedDependency?: number | null;
  onDependencyChange: (dependencyId: number | null) => void;
  disabled?: boolean;
}

export const TaskDependencySelector: React.FC<TaskDependencySelectorProps> = ({
  tasks,
  currentTaskId,
  selectedDependency,
  onDependencyChange,
  disabled = false,
}) => {
  // Filter out the current task and any tasks that would create circular dependencies
  const availableTasks = tasks.filter(task => {
    if (task.id === currentTaskId) return false;
    // TODO: Add logic to prevent circular dependencies
    return true;
  });

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Depends On</label>
      <Select
        value={selectedDependency?.toString() || "none"}
        onValueChange={(value) => {
          if (value === "none") {
            onDependencyChange(null);
          } else {
            onDependencyChange(parseInt(value));
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select dependency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No dependency</SelectItem>
          {availableTasks.map((task) => (
            <SelectItem key={task.id} value={task.id.toString()}>
              {task.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};