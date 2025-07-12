import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskWithDetails } from '@/types/tasks';
import { KanbanTaskCard } from './KanbanTaskCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: TaskWithDetails[];
  color: string;
  wipLimit?: number;
  onEditTask: (task: TaskWithDetails) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  color,
  wipLimit,
  onEditTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
      status: id,
    },
  });

  const isWipLimitExceeded = wipLimit && tasks.length > wipLimit;

  return (
    <Card className={`${color} border-dashed min-h-[600px] ${isOver ? 'border-primary' : ''} ${isWipLimitExceeded ? 'border-red-300 bg-red-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isWipLimitExceeded ? "destructive" : "secondary"}
              className={isWipLimitExceeded ? "bg-red-500 text-white" : ""}
            >
              {tasks.length}{wipLimit ? `/${wipLimit}` : ''}
            </Badge>
            {isWipLimitExceeded && (
              <Badge variant="outline" className="text-red-600 border-red-300">
                WIP Exceeded!
              </Badge>
            )}
          </div>
        </div>
        {wipLimit && (
          <div className="text-xs text-muted-foreground">
            WIP Limit: {wipLimit}
          </div>
        )}
      </CardHeader>
      <CardContent 
        ref={setNodeRef} 
        className="space-y-3 min-h-[500px] group"
      >
        <SortableContext items={tasks.map(task => task.id.toString())} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm border-2 border-dashed border-muted rounded-lg">
            Drop tasks here
          </div>
        )}
      </CardContent>
    </Card>
  );
};