import React, { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { taskService } from '@/services/taskService';
import { TaskLabel } from '@/types/tasks';

interface TaskLabelsManagerProps {
  taskId: number;
  labels: TaskLabel[];
  onLabelsChange: (labels: TaskLabel[]) => void;
}

const PREDEFINED_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#84cc16', // lime
  '#6b7280', // gray
];

export const TaskLabelsManager: React.FC<TaskLabelsManagerProps> = ({
  taskId,
  labels,
  onLabelsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PREDEFINED_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddLabel = async () => {
    if (!newLabelName.trim()) return;

    setIsLoading(true);
    try {
      const newLabel = await taskService.addTaskLabel(taskId, newLabelName.trim(), selectedColor);
      onLabelsChange([...labels, newLabel]);
      setNewLabelName('');
      setSelectedColor(PREDEFINED_COLORS[0]);
      toast({ title: 'Label added successfully' });
    } catch (error) {
      toast({
        title: 'Error adding label',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      await taskService.removeTaskLabel(labelId);
      onLabelsChange(labels.filter(label => label.id !== labelId));
      toast({ title: 'Label removed successfully' });
    } catch (error) {
      toast({
        title: 'Error removing label',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {labels.map((label) => (
        <Badge 
          key={label.id} 
          variant="outline" 
          className="gap-1 pr-1"
          style={{ borderColor: label.label_color, color: label.label_color }}
        >
          <Tag className="h-3 w-3" />
          {label.label_name}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => handleRemoveLabel(label.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 gap-1">
            <Plus className="h-3 w-3" />
            Add Label
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Task Label</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Label Name</label>
              <Input
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Enter label name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddLabel();
                  }
                }}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {PREDEFINED_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColor === color ? 'border-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddLabel} 
                disabled={!newLabelName.trim() || isLoading}
              >
                Add Label
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};