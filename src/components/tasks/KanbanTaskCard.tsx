import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EditIcon, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskWithDetails } from '@/types/tasks';

interface KanbanTaskCardProps {
  task: TaskWithDetails;
  onEdit: (task: TaskWithDetails) => void;
}

export const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({ task, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id.toString(),
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityConfig = {
    low: { label: 'Low', color: 'text-green-600' },
    medium: { label: 'Medium', color: 'text-yellow-600' },
    high: { label: 'High', color: 'text-orange-600' },
    critical: { label: 'Critical', color: 'text-red-600' },
  };

  const priority = (task.priority as keyof typeof priorityConfig) || 'medium';
  const priorityStyle = priorityConfig[priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm flex-1 pr-2">{task.title}</h4>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <EditIcon className="h-3 w-3" />
        </Button>
      </div>
      
      {task.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {task.dependency?.id && (
        <div className="mb-2 flex items-center gap-1 p-1.5 bg-muted/50 rounded text-xs">
          <ArrowRight className="h-2.5 w-2.5 text-foreground" />
          <span className="text-foreground truncate">
            Depends on: <span className="font-medium">{task.dependency.title}</span>
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={`text-xs ${priorityStyle.color}`}>
          {priorityStyle.label}
        </Badge>
        
        {task.assignee && (
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground">
              {task.assignee.full_name?.charAt(0) || task.assignee.email?.charAt(0) || '?'}
            </div>
          </div>
        )}
      </div>
      
      {task.end_date && (
        <div className="mt-2 text-xs text-muted-foreground">
          Due: {new Date(task.end_date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};