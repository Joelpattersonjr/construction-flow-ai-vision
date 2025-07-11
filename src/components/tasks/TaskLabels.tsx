import React, { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TaskLabel } from '@/types/tasks';

interface TaskLabelsProps {
  labels: TaskLabel[];
  onAddLabel: (name: string, color: string) => void;
  onRemoveLabel: (labelId: string) => void;
  className?: string;
}

const labelColors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

export const TaskLabels: React.FC<TaskLabelsProps> = ({
  labels,
  onAddLabel,
  onRemoveLabel,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState(labelColors[0]);

  const handleAddLabel = () => {
    if (newLabelName.trim()) {
      onAddLabel(newLabelName.trim(), selectedColor);
      setNewLabelName('');
      setIsOpen(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {labels.map((label) => (
        <Badge
          key={label.id}
          variant="secondary"
          className="flex items-center gap-1 pr-1"
          style={{ backgroundColor: `${label.label_color}20`, borderColor: label.label_color }}
        >
          <span style={{ color: label.label_color }}>{label.label_name}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onRemoveLabel(label.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 px-2">
            <Plus className="h-3 w-3 mr-1" />
            <Tag className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Label Name</label>
              <Input
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Enter label name"
                className="mt-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2 mt-2">
                {labelColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 ${
                      selectedColor === color ? 'border-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleAddLabel} size="sm" className="flex-1">
                Add Label
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)} 
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};