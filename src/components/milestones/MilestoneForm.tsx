import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MilestoneFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  projectId: string;
  milestone?: any;
}

export const MilestoneForm: React.FC<MilestoneFormProps> = ({ 
  onSubmit, 
  onCancel, 
  projectId,
  milestone 
}) => {
  const [formData, setFormData] = useState({
    title: milestone?.title || '',
    description: milestone?.description || '',
    milestone_type: milestone?.milestone_type || 'internal',
    importance_level: milestone?.importance_level || 'medium',
    target_date: milestone?.target_date ? new Date(milestone.target_date) : new Date(),
    approval_required: milestone?.approval_required || false,
    evidence_required: milestone?.evidence_required || false,
    weather_sensitive: milestone?.weather_sensitive || false,
    buffer_days: milestone?.buffer_days || 0,
    compliance_requirements: milestone?.compliance_requirements || [],
    dependencies: milestone?.dependencies || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      target_date: format(formData.target_date, 'yyyy-MM-dd'),
      compliance_requirements: formData.compliance_requirements,
      dependencies: formData.dependencies
    };

    onSubmit(submitData);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, target_date: date }));
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{milestone ? 'Edit Milestone' : 'Create New Milestone'}</DialogTitle>
          <DialogDescription>
            Configure milestone details, requirements, and dependencies.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter milestone title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the milestone requirements and deliverables"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Milestone Type</Label>
                <Select 
                  value={formData.milestone_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, milestone_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regulatory">Regulatory</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Importance Level</Label>
                <Select 
                  value={formData.importance_level} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, importance_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select importance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Timeline</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.target_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.target_date ? format(formData.target_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.target_date}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="buffer_days">Buffer Days</Label>
                <Input
                  id="buffer_days"
                  type="number"
                  min="0"
                  value={formData.buffer_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, buffer_days: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Requirements</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Approval Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Milestone requires formal approval before completion
                  </p>
                </div>
                <Switch
                  checked={formData.approval_required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, approval_required: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Evidence Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Milestone requires supporting documentation or evidence
                  </p>
                </div>
                <Switch
                  checked={formData.evidence_required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, evidence_required: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weather Sensitive</Label>
                  <p className="text-sm text-muted-foreground">
                    Milestone may be affected by weather conditions
                  </p>
                </div>
                <Switch
                  checked={formData.weather_sensitive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, weather_sensitive: checked }))}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {milestone ? 'Update Milestone' : 'Create Milestone'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};