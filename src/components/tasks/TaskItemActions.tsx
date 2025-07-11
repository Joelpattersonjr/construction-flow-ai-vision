import React from 'react';
import { EditIcon, TrashIcon, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TaskWithDetails } from '@/types/tasks';

interface TaskItemActionsProps {
  task: TaskWithDetails;
  onEdit: (task: TaskWithDetails) => void;
  onDelete: (taskId: number) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const TaskItemActions: React.FC<TaskItemActionsProps> = ({
  task,
  onEdit,
  onDelete,
  isExpanded,
  onToggleExpanded,
}) => {
  return (
    <div className="flex items-center gap-1 ml-4">
      {/* Expand/collapse button for additional features */}
      <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
      </Collapsible>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEdit(task)}
        className="h-8 w-8 p-0"
      >
        <EditIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(task.id)}
        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};