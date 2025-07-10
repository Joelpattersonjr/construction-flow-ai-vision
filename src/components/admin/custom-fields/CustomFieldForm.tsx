import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, X } from 'lucide-react';

interface CustomFieldFormProps {
  onSubmit: (data: {
    fieldName: string;
    fieldLabel: string;
    fieldType: string;
    fieldOptions: string;
    isRequired: boolean;
  }) => Promise<boolean>;
  onCancel: () => void;
}

const fieldTypeOptions = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select (Dropdown)' },
  { value: 'textarea', label: 'Text Area' }
];

export const CustomFieldForm: React.FC<CustomFieldFormProps> = ({ onSubmit, onCancel }) => {
  const [fieldName, setFieldName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldOptions, setFieldOptions] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const success = await onSubmit({
      fieldName,
      fieldLabel,
      fieldType,
      fieldOptions,
      isRequired,
    });
    
    if (success) {
      resetForm();
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFieldName('');
    setFieldLabel('');
    setFieldType('text');
    setFieldOptions('');
    setIsRequired(false);
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="font-medium">Add New Custom Field</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fieldLabel">Field Label *</Label>
          <Input
            id="fieldLabel"
            placeholder="e.g., Department"
            value={fieldLabel}
            onChange={(e) => setFieldLabel(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fieldName">Field Name *</Label>
          <Input
            id="fieldName"
            placeholder="e.g., department"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fieldType">Field Type</Label>
          <Select value={fieldType} onValueChange={setFieldType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fieldTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="isRequired"
              checked={isRequired}
              onCheckedChange={setIsRequired}
            />
            <Label htmlFor="isRequired">Required Field</Label>
          </div>
        </div>
      </div>
      
      {fieldType === 'select' && (
        <div className="space-y-2">
          <Label htmlFor="fieldOptions">Options (comma-separated)</Label>
          <Input
            id="fieldOptions"
            placeholder="e.g., Engineering, Marketing, Sales"
            value={fieldOptions}
            onChange={(e) => setFieldOptions(e.target.value)}
          />
        </div>
      )}

      <div className="flex space-x-2">
        <Button 
          onClick={handleSubmit} 
          disabled={!fieldName || !fieldLabel || isSubmitting}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Field
        </Button>
        <Button variant="outline" onClick={handleCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
};