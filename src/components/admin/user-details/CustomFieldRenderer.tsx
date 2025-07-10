import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase } from 'lucide-react';

interface CustomField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options: string[];
  is_required: boolean;
}

interface CustomFieldRendererProps {
  field: CustomField;
  value: any;
  isEditing: boolean;
  onChange: (fieldName: string, value: any) => void;
}

export const CustomFieldRenderer: React.FC<CustomFieldRendererProps> = ({
  field,
  value,
  isEditing,
  onChange
}) => {
  if (!isEditing) {
    return (
      <div key={field.id} className="flex items-start space-x-3">
        <Briefcase className="h-4 w-4 text-muted-foreground mt-1" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">{field.field_label}</p>
          <p className="text-sm">{value || 'Not provided'}</p>
        </div>
      </div>
    );
  }

  switch (field.field_type) {
    case 'select':
      return (
        <div key={field.id} className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            {field.field_label} {field.is_required && '*'}
          </label>
          <Select value={value} onValueChange={(val) => onChange(field.field_name, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.field_label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.field_options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'textarea':
      return (
        <div key={field.id} className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            {field.field_label} {field.is_required && '*'}
          </label>
          <Textarea
            value={value}
            onChange={(e) => onChange(field.field_name, e.target.value)}
            placeholder={`Enter ${field.field_label.toLowerCase()}`}
          />
        </div>
      );

    default:
      return (
        <div key={field.id} className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            {field.field_label} {field.is_required && '*'}
          </label>
          <Input
            type={field.field_type}
            value={value}
            onChange={(e) => onChange(field.field_name, e.target.value)}
            placeholder={`Enter ${field.field_label.toLowerCase()}`}
          />
        </div>
      );
  }
};