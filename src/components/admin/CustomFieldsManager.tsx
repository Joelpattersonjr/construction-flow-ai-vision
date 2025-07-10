import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useCustomFields } from '@/hooks/useCustomFields';
import { CustomFieldForm } from './custom-fields/CustomFieldForm';
import { CustomFieldsTable } from './custom-fields/CustomFieldsTable';

export const CustomFieldsManager: React.FC = () => {
  const { profile } = useAuth();
  const { customFields, loading, addField, deleteField } = useCustomFields();
  const [isAdding, setIsAdding] = useState(false);

  if (profile?.company_role !== 'company_admin') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Only company administrators can manage custom fields.</p>
        </CardContent>
      </Card>
    );
  }

  const handleAddField = async (fieldData: {
    fieldName: string;
    fieldLabel: string;
    fieldType: string;
    fieldOptions: string;
    isRequired: boolean;
  }) => {
    const success = await addField(fieldData);
    if (success) {
      setIsAdding(false);
    }
    return success;
  };

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
          <CustomFieldForm
            onSubmit={handleAddField}
            onCancel={() => setIsAdding(false)}
          />
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

          <CustomFieldsTable
            fields={customFields}
            loading={loading}
            onDelete={deleteField}
          />
        </div>
      </CardContent>
    </Card>
  );
};
