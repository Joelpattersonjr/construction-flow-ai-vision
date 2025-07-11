import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EditIcon } from 'lucide-react';
import { TaskWithDetails, TaskStatus } from '@/types/tasks';

interface SimpleKanbanProps {
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

interface SimpleTaskCardProps {
  task: TaskWithDetails;
  onEditTask: (task: TaskWithDetails) => void;
  onStatusChange: (taskId: number, status: TaskStatus) => void;
}

function SimpleTaskCard({ task, onEditTask, onStatusChange }: SimpleTaskCardProps) {
  // Safe priority handling
  const priorityKey = task.priority && typeof task.priority === 'string' && task.priority in priorityConfig 
    ? task.priority as keyof typeof priorityConfig 
    : 'medium';
  const priority = priorityConfig[priorityKey];
  
  return (
    <div className="bg-white rounded-lg border p-3 shadow-sm transition-all hover:shadow-md">
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
      
      <div className="flex items-center justify-between mt-2">
        <Badge variant="outline" className={priority.color}>
          {priority.label}
        </Badge>
        
        <Select 
          value={task.status || 'todo'} 
          onValueChange={(value) => onStatusChange(task.id, value as TaskStatus)}
        >
          <SelectTrigger className="w-24 h-6 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusColumns.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function SimpleKanban({ 
  tasks, 
  onStatusChange, 
  onEditTask, 
  onAddLabel, 
  onRemoveLabel 
}: SimpleKanbanProps) {
  // Group tasks by status
  const tasksByStatus = statusColumns.reduce((acc, column) => {
    acc[column.id] = tasks.filter(task => task.status === column.id);
    return acc;
  }, {} as Record<string, TaskWithDetails[]>);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[600px]">
      {statusColumns.map((column) => (
        <Card key={column.id} className={`${column.color} h-fit`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {column.label}
              </CardTitle>
              <Badge variant="secondary">
                {tasksByStatus[column.id]?.length || 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 min-h-[200px]">
            {(tasksByStatus[column.id] || []).map((task) => (
              <SimpleTaskCard
                key={task.id}
                task={task}
                onEditTask={onEditTask}
                onStatusChange={onStatusChange}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}