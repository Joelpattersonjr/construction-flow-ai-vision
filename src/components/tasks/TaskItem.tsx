import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { TaskWithDetails, TaskPriority, TaskStatus } from '@/types/tasks';
import { TaskItemHeader } from './TaskItemHeader';
import { TaskItemActions } from './TaskItemActions';
import { TaskItemMetadata } from './TaskItemMetadata';
import { TaskItemDetails } from './TaskItemDetails';

interface TaskItemProps {
  task: TaskWithDetails;
  onEdit: (task: TaskWithDetails) => void;
  onDelete: (taskId: number) => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onAddLabel?: (taskId: number, name: string, color: string) => void;
  onRemoveLabel?: (labelId: string) => void;
  // Bulk selection
  isSelected?: boolean;
  onSelect?: (taskId: number, selected: boolean) => void;
  // Dependencies
  dependencyTask?: TaskWithDetails | null;
}

const statusConfig = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  review: { label: 'Review', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-800' },
};

const priorityConfig = {
  low: { label: 'Low', color: 'text-green-600', icon: '🟢' },
  medium: { label: 'Medium', color: 'text-yellow-600', icon: '🟡' },
  high: { label: 'High', color: 'text-orange-600', icon: '🟠' },
  critical: { label: 'Critical', color: 'text-red-600', icon: '🔴' },
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onAddLabel,
  onRemoveLabel,
  isSelected = false,
  onSelect,
  dependencyTask,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isOverdue = task.end_date && new Date(task.end_date) < new Date() && task.status !== 'completed';

  return (
    <Card className={`transition-all hover:shadow-md ${isOverdue ? 'border-red-200 bg-red-50' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Bulk selection checkbox */}
          {onSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(task.id, checked as boolean)}
              className="mt-1"
            />
          )}
          
          <TaskItemHeader task={task} dependencyTask={dependencyTask} />
          
          <TaskItemActions
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            isExpanded={isExpanded}
            onToggleExpanded={() => setIsExpanded(!isExpanded)}
          />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <TaskItemMetadata
          task={task}
          statusConfig={statusConfig}
          priorityConfig={priorityConfig}
          onToggleExpanded={() => setIsExpanded(!isExpanded)}
        />

        {/* Task Labels - Temporarily disabled */}
        {/* {task.labels && task.labels.length > 0 && onAddLabel && onRemoveLabel && (
          <TaskLabels
            labels={task.labels}
            onAddLabel={(name, color) => onAddLabel(task.id, name, color)}
            onRemoveLabel={onRemoveLabel}
            className="mt-2"
          />
        )} */}

        <TaskItemDetails taskId={task.id} isExpanded={isExpanded} />
      </CardContent>
    </Card>
  );
};