import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  GripVertical, 
  Type, 
  Hash, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  CheckSquare, 
  Circle, 
  Upload, 
  MapPin, 
  PenTool,
  Database
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: any;
  conditionalLogic?: any;
}

interface FormBuilderProps {
  formId?: string | null;
  onClose: () => void;
}

const fieldTypes = [
  { type: 'text', label: 'Text Input', icon: Type },
  { type: 'textarea', label: 'Text Area', icon: FileText },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'select', label: 'Dropdown', icon: Database },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'radio', label: 'Radio Buttons', icon: Circle },
  { type: 'file', label: 'File Upload', icon: Upload },
  { type: 'signature', label: 'E-Signature', icon: PenTool },
  { type: 'location', label: 'Geolocation', icon: MapPin },
];

export const FormBuilder: React.FC<FormBuilderProps> = ({ formId, onClose }) => {
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (formId) {
      loadForm();
    }
  }, [formId]);

  const loadForm = async () => {
    try {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('id', formId)
        .single();

      if (error) throw error;

      setFormName(data.name);
      setFormDescription(data.description || '');
      setFormCategory(data.category || 'general');
      const schema = data.form_schema as any;
      setFields(schema?.fields || []);
    } catch (error) {
      console.error('Error loading form:', error);
      toast.error('Failed to load form template');
    }
  };

  const generateFieldId = () => {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addField = (fieldType: string) => {
    const newField: FormField = {
      id: generateFieldId(),
      type: fieldType,
      label: `New ${fieldType} Field`,
      required: false,
      ...(fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox' 
        ? { options: ['Option 1', 'Option 2'] } 
        : {}),
    };

    setFields([...fields, newField]);
    setSelectedField(newField);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
    
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates });
    }
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFields(items);
  };

  const saveForm = async () => {
    if (!formName.trim()) {
      toast.error('Please enter a form name');
      return;
    }

    setIsLoading(true);
    try {
      const formData = {
        name: formName,
        description: formDescription,
        category: formCategory,
        form_schema: { fields } as any,
        updated_at: new Date().toISOString(),
      };

      if (formId) {
        const { error } = await supabase
          .from('form_templates')
          .update(formData)
          .eq('id', formId);
        
        if (error) throw error;
        toast.success('Form template updated successfully');
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        const { data: user } = await supabase.auth.getUser();
        
        const { error } = await supabase
          .from('form_templates')
          .insert({
            ...formData,
            company_id: profile?.company_id,
            created_by: user.user?.id,
          });

        if (error) throw error;
        toast.success('Form template created successfully');
      }

      onClose();
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save form template');
    } finally {
      setIsLoading(false);
    }
  };

  const renderFieldPreview = (field: FormField) => {
    const fieldTypeInfo = fieldTypes.find(ft => ft.type === field.type);
    const IconComponent = fieldTypeInfo?.icon || Type;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <IconComponent className="h-4 w-4" />
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
        
        {field.type === 'text' && (
          <Input placeholder={field.placeholder || "Enter text..."} disabled />
        )}
        {field.type === 'textarea' && (
          <Textarea placeholder={field.placeholder || "Enter text..."} disabled />
        )}
        {field.type === 'number' && (
          <Input type="number" placeholder="Enter number..." disabled />
        )}
        {field.type === 'email' && (
          <Input type="email" placeholder="Enter email..." disabled />
        )}
        {field.type === 'phone' && (
          <Input type="tel" placeholder="Enter phone number..." disabled />
        )}
        {field.type === 'date' && (
          <Input type="date" disabled />
        )}
        {field.type === 'select' && (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {field.type === 'checkbox' && (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input type="checkbox" disabled className="rounded" />
                <label className="text-sm">{option}</label>
              </div>
            ))}
          </div>
        )}
        {field.type === 'radio' && (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input type="radio" name={field.id} disabled />
                <label className="text-sm">{option}</label>
              </div>
            ))}
          </div>
        )}
        {field.type === 'file' && (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to upload files</p>
          </div>
        )}
        {field.type === 'signature' && (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <PenTool className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Signature pad</p>
          </div>
        )}
        {field.type === 'location' && (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">GPS coordinates will be captured</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex">
      {/* Left Sidebar - Field Palette */}
      <div className="w-64 border-r bg-muted/10 p-4 space-y-4">
        <h3 className="font-medium">Field Types</h3>
        <div className="grid grid-cols-1 gap-2">
          {fieldTypes.map((fieldType) => {
            const IconComponent = fieldType.icon;
            return (
              <Button
                key={fieldType.type}
                variant="ghost"
                size="sm"
                onClick={() => addField(fieldType.type)}
                className="justify-start h-10"
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {fieldType.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Center - Form Builder */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="font-semibold">
                {formId ? 'Edit Form Template' : 'Create New Form Template'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Design your custom form with drag-and-drop fields
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={saveForm} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Form'}
            </Button>
          </div>
        </div>

        {/* Form Settings */}
        <div className="border-b p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="form-name">Form Name</Label>
              <Input
                id="form-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter form name..."
              />
            </div>
            <div>
              <Label htmlFor="form-category">Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="daily_log">Daily Log</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="rfi">RFI</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="form-description">Description</Label>
              <Input
                id="form-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Enter description..."
              />
            </div>
          </div>
        </div>

        {/* Form Canvas */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{formName || 'Untitled Form'}</CardTitle>
                {formDescription && (
                  <p className="text-muted-foreground">{formDescription}</p>
                )}
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg mb-2">No fields added yet</p>
                    <p>Drag field types from the left panel to start building your form</p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="form-fields">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                          {fields.map((field, index) => (
                            <Draggable key={field.id} draggableId={field.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`group border rounded-lg p-4 ${
                                    selectedField?.id === field.id 
                                      ? 'border-primary ring-2 ring-primary/20' 
                                      : 'border-border hover:border-muted-foreground'
                                  }`}
                                  onClick={() => setSelectedField(field)}
                                >
                                  <div className="flex items-start gap-2">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="p-1 opacity-0 group-hover:opacity-100 cursor-grab"
                                    >
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                      {renderFieldPreview(field)}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeField(field.id);
                                      }}
                                      className="opacity-0 group-hover:opacity-100"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Field Properties */}
      {selectedField && (
        <div className="w-80 border-l bg-muted/10 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Field Properties</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedField(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="field-label">Label</Label>
              <Input
                id="field-label"
                value={selectedField.label}
                onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                value={selectedField.placeholder || ''}
                onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="field-required"
                checked={selectedField.required}
                onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
              />
              <Label htmlFor="field-required">Required field</Label>
            </div>

            {(selectedField.type === 'select' || selectedField.type === 'radio' || selectedField.type === 'checkbox') && (
              <div>
                <Label>Options</Label>
                <div className="space-y-2">
                  {selectedField.options?.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(selectedField.options || [])];
                          newOptions[index] = e.target.value;
                          updateField(selectedField.id, { options: newOptions });
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newOptions = selectedField.options?.filter((_, i) => i !== index);
                          updateField(selectedField.id, { options: newOptions });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOptions = [...(selectedField.options || []), `Option ${(selectedField.options?.length || 0) + 1}`];
                      updateField(selectedField.id, { options: newOptions });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};