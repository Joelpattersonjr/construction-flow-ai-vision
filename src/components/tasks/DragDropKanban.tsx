import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditIcon, GripVertical } from 'lucide-react';
import { TaskWithDetails, TaskStatus } from '@/types/tasks';
import { TaskLabels } from './TaskLabels';

interface DragDropKanbanProps {
  tasks: TaskWithDetails[];
  onStatusChange: (taskId: number, status: TaskStatus) => void;
  onEditTask: (task: TaskWithDetails) => void;
  onAddLabel: (taskId: number, name: string, color: string) => void;
  onRemoveLabel: (labelId: string) => void;
}

const statusColumns = [
  { id: 'todo', label: 'To Do', color: 'bg-gray-50' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50' },
  { id: 'review', label: 'Review', color: 'bg-yellow-50' },
  { id: 'completed', label: 'Completed', color: 'bg-green-50' },
  { id: 'blocked', label: 'Blocked', color: 'bg-red-50' },
];

const priorityConfig = {
  low: { label: 'Low', color: 'text-green-600' },
  medium: { label: 'Medium', color: 'text-yellow-600' },
  high: { label: 'High', color: 'text-orange-600' },
  critical: { label: 'Critical', color: 'text-red-600' },
};

interface TaskCardProps {
  task: TaskWithDetails;
  onEditTask: (task: TaskWithDetails) => void;
  onAddLabel: (taskId: number, name: string, color: string) => void;
  onRemoveLabel: (labelId: string) => void;
  isDragging?: boolean;
}

function TaskCard({ task, onEditTask, onAddLabel, onRemoveLabel, isDragging = false }: TaskCardProps) {
  // Safely handle priority with proper fallback
  const priorityKey = task.priority && typeof task.priority === 'string' && task.priority in priorityConfig 
    ? task.priority as keyof typeof priorityConfig 
    : 'medium';
  const priority = priorityConfig[priorityKey];
  
  return (
    <div 
      className={`bg-white rounded-lg border p-3 shadow-sm transition-all ${
        isDragging ? 'opacity-50 rotate-3 scale-105' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm flex-1">{task.title}</h4>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEditTask(task)}
          className="h-6 w-6 p-0 ml-2"
        >
          <EditIcon className="h-3 w-3" />
        </Button>
      </div>
      
      {task.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {task.description}
        </p>
      )}
      
      {task.labels && task.labels.length > 0 && (
        <TaskLabels
          labels={task.labels}
          onAddLabel={(name, color) => onAddLabel(task.id, name, color)}
          onRemoveLabel={onRemoveLabel}
          className="mb-2"
        />
      )}
      
      <div className="flex items-center justify-between mt-2">
        <Badge variant="outline" className={priority.color}>
          {priority.label}
        </Badge>
        {task.assignee && (
          <div className="text-xs text-muted-foreground">
            {task.assignee.full_name || task.assignee.email}
          </div>
        )}
      </div>
    </div>
  );
}

interface SortableTaskCardProps {
  task: TaskWithDetails;
  onEditTask: (task: TaskWithDetails) => void;
  onAddLabel: (taskId: number, name: string, color: string) => void;
  onRemoveLabel: (labelId: string) => void;
}

function SortableTaskCard(props: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: props.task.id.toString() // Convert to string to ensure compatibility
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing touch-none"
    >
      <TaskCard {...props} isDragging={isDragging} />
    </div>
  );
}

interface DroppableColumnProps {
  column: typeof statusColumns[0];
  tasks: TaskWithDetails[];
  onEditTask: (task: TaskWithDetails) => void;
  onAddLabel: (taskId: number, name: string, color: string) => void;
  onRemoveLabel: (labelId: string) => void;
}

function DroppableColumn({ column, tasks, onEditTask, onAddLabel, onRemoveLabel }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div ref={setNodeRef} className="h-full">
      <Card className={`${column.color} border-dashed h-fit transition-colors ${isOver ? 'border-primary border-2' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {column.label}
            </CardTitle>
            <Badge variant="secondary">
              {tasks.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 min-h-[200px]">
          <SortableContext items={tasks.map(t => t.id.toString())} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onEditTask={onEditTask}
                onAddLabel={onAddLabel}
                onRemoveLabel={onRemoveLabel}
              />
            ))}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}

export function DragDropKanban({ 
  tasks, 
  onStatusChange, 
  onEditTask, 
  onAddLabel, 
  onRemoveLabel 
}: DragDropKanbanProps) {
  const [activeTask, setActiveTask] = React.useState<TaskWithDetails | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    })
  );

  // Group tasks by status
  const tasksByStatus = statusColumns.reduce((acc, column) => {
    acc[column.id] = tasks.filter(task => task.status === column.id);
    return acc;
  }, {} as Record<string, TaskWithDetails[]>);

  function handleDragStart(event: DragStartEvent) {
    console.log('Drag start:', event.active.id);
    const taskId = parseInt(event.active.id.toString());
    const task = tasks.find(t => t.id === taskId);
    setActiveTask(task || null);
  }

  function handleDragEnd(event: DragEndEvent) {
    console.log('Drag end:', event.active.id, 'over:', event.over?.id);
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      console.log('No drop target');
      return;
    }

    const taskId = parseInt(active.id.toString());
    const newStatus = over.id as TaskStatus;
    
    console.log('Status change:', taskId, 'to', newStatus);
    
    // Find current task and check if status changed
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      console.log('Calling onStatusChange');
      onStatusChange(taskId, newStatus);
    } else {
      console.log('No status change needed');
    }
  }

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[600px]">
        {statusColumns.map((column) => (
          <DroppableColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id] || []}
            onEditTask={onEditTask}
            onAddLabel={onAddLabel}
            onRemoveLabel={onRemoveLabel}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            onEditTask={onEditTask}
            onAddLabel={onAddLabel}
            onRemoveLabel={onRemoveLabel}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}