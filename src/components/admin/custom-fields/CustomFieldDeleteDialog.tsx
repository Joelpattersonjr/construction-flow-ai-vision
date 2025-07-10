import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { CustomField } from '@/types/admin';

interface CustomFieldDeleteDialogProps {
  field: CustomField;
  onDelete: (fieldId: string) => Promise<boolean>;
}

export const CustomFieldDeleteDialog: React.FC<CustomFieldDeleteDialogProps> = ({
  field,
  onDelete
}) => {
  const handleDelete = () => {
    onDelete(field.id);
  };

  return (
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
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};