import React, { useState } from 'react';
import { Check, X, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TaskStatus, TaskWithDetails } from '@/types/tasks';

interface BulkOperationsProps {
  selectedTasks: number[];
  tasks: TaskWithDetails[];
  onBulkStatusChange: (taskIds: number[], status: TaskStatus) => void;
  onBulkDelete: (taskIds: number[]) => void;
  onClearSelection: () => void;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedTasks,
  tasks,
  onBulkStatusChange,
  onBulkDelete,
  onClearSelection,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | ''>('');

  if (selectedTasks.length === 0) {
    return null;
  }

  const handleStatusChange = () => {
    if (selectedStatus && selectedTasks.length > 0) {
      onBulkStatusChange(selectedTasks, selectedStatus as TaskStatus);
      setSelectedStatus('');
      onClearSelection();
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedTasks.length} task(s)?`)) {
      onBulkDelete(selectedTasks);
      onClearSelection();
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="px-3 py-1">
          {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
        </Badge>
        
        <div className="flex items-center gap-2">
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as TaskStatus | '')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleStatusChange}
            disabled={!selectedStatus}
            size="sm"
            variant="default"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Update
          </Button>
        </div>

        <Button
          onClick={handleBulkDelete}
          size="sm"
          variant="destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>

        <Button
          onClick={onClearSelection}
          size="sm"
          variant="outline"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
};