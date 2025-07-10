import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Save, X, GripVertical } from 'lucide-react';

interface CustomField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options: string[];
  is_required: boolean;
  display_order: number;
}

export const CustomFieldsManager: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  
  // Form state
  const [fieldName, setFieldName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [fieldOptions, setFieldOptions] = useState('');
  const [isRequired, setIsRequired] = useState(false);

  useEffect(() => {
    if (profile?.company_id) {
      fetchCustomFields();
    }
  }, [profile?.company_id]);

  const fetchCustomFields = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_custom_fields')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('display_order');

      if (error) throw error;
      // Transform the data to match our interface
      const transformedData = (data || []).map(field => ({
        ...field,
        field_options: Array.isArray(field.field_options) 
          ? field.field_options.filter((opt): opt is string => typeof opt === 'string')
          : []
      })) as CustomField[];
      setCustomFields(transformedData);
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      toast({
        title: "Error",
        description: "Failed to load custom fields",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = async () => {
    if (!fieldName || !fieldLabel || !profile?.company_id) return;

    try {
      const optionsArray = fieldType === 'select' ? fieldOptions.split(',').map(o => o.trim()).filter(o => o) : [];
      
      const { error } = await supabase
        .from('company_custom_fields')
        .insert({
          company_id: profile.company_id,
          field_name: fieldName.toLowerCase().replace(/\s+/g, '_'),
          field_label: fieldLabel,
          field_type: fieldType,
          field_options: optionsArray,
          is_required: isRequired,
          display_order: customFields.length
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Custom field added successfully",
      });

      resetForm();
      fetchCustomFields();
    } catch (error) {
      console.error('Error adding custom field:', error);
      toast({
        title: "Error",
        description: "Failed to add custom field",
        variant: "destructive",
      });
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from('company_custom_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Custom field deleted successfully",
      });

      fetchCustomFields();
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast({
        title: "Error",
        description: "Failed to delete custom field",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFieldName('');
    setFieldLabel('');
    setFieldType('text');
    setFieldOptions('');
    setIsRequired(false);
    setIsAdding(false);
    setEditingField(null);
  };

  const fieldTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Select (Dropdown)' },
    { value: 'textarea', label: 'Text Area' }
  ];

  if (profile?.company_role !== 'company_admin') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Only company administrators can manage custom fields.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Team Member Fields</CardTitle>
        <CardDescription>
          Add custom fields to collect additional information from your team members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Field Form */}
        {isAdding && (
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
              <Button onClick={handleAddField} disabled={!fieldName || !fieldLabel}>
                <Save className="h-4 w-4 mr-2" />
                Save Field
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Existing Fields Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Current Custom Fields ({customFields.length})</h3>
            {!isAdding && (
              <Button onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : customFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No custom fields defined yet. Add your first field to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customFields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.field_label}</TableCell>
                    <TableCell className="capitalize">{field.field_type}</TableCell>
                    <TableCell>
                      {field.is_required ? (
                        <span className="text-red-600 font-medium">Required</span>
                      ) : (
                        <span className="text-muted-foreground">Optional</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {field.field_type === 'select' && field.field_options.length > 0 ? (
                        <span className="text-sm text-muted-foreground">
                          {field.field_options.join(', ')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the "{field.field_label}" field? 
                              This will remove all data for this field from existing team members.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteField(field.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
