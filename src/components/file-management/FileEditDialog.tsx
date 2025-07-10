import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CollaborativeEditor } from './CollaborativeEditor';

interface FileEditDialogProps {
  documentId: string | null;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const FileEditDialog = ({
  documentId,
  fileName,
  isOpen,
  onClose,
}: FileEditDialogProps) => {
  if (!documentId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>
            Collaborative editing session for {fileName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pb-6 h-full">
          <CollaborativeEditor
            documentId={documentId}
            fileName={fileName}
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};