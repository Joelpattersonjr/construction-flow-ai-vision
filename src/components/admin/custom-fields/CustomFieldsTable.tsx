import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomFieldDeleteDialog } from './CustomFieldDeleteDialog';
import { CustomField } from '@/types/admin';

interface CustomFieldsTableProps {
  fields: CustomField[];
  loading: boolean;
  onDelete: (fieldId: string) => Promise<boolean>;
}

export const CustomFieldsTable: React.FC<CustomFieldsTableProps> = ({
  fields,
  loading,
  onDelete
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No custom fields defined yet. Add your first field to get started.
      </div>
    );
  }

  return (
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
        {fields.map((field) => (
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
              <CustomFieldDeleteDialog
                field={field}
                onDelete={onDelete}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};