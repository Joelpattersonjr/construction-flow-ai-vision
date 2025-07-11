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
  onEditTask: (task: TaskWithDetails) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  color,
  onEditTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
      status: id,
    },
  });

  return (
    <Card className={`${color} border-dashed min-h-[600px] ${isOver ? 'border-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {title}
          </CardTitle>
          <Badge variant="secondary">
            {tasks.length}
          </Badge>
        </div>
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