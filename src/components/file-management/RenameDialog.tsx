import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  type: 'file' | 'folder';
  onRename: (newName: string) => Promise<void>;
}

const RenameDialog: React.FC<RenameDialogProps> = ({
  open,
  onOpenChange,
  currentName,
  type,
  onRename,
}) => {
  const [newName, setNewName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    if (open) {
      setNewName(currentName);
    }
  }, [open, currentName]);

  const handleRename = async () => {
    if (!newName.trim() || newName === currentName) return;

    setIsRenaming(true);
    try {
      await onRename(newName.trim());
      onOpenChange(false);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newName.trim() && newName !== currentName && !isRenaming) {
      handleRename();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename {type}</DialogTitle>
          <DialogDescription>
            Enter a new name for this {type}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Enter ${type} name`}
            disabled={isRenaming}
          />
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isRenaming}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRename} 
            disabled={!newName.trim() || newName === currentName || isRenaming}
          >
            {isRenaming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Renaming...
              </>
            ) : (
              'Rename'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RenameDialog;