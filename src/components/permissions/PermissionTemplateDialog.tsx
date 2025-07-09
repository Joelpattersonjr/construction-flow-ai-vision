import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { permissionTemplateService, PermissionTemplate, CreatePermissionTemplateData } from '@/services/permissionTemplateService';

interface PermissionTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: PermissionTemplate;
  onTemplateUpdated: () => void;
}

const PermissionTemplateDialog: React.FC<PermissionTemplateDialogProps> = ({
  open,
  onOpenChange,
  template,
  onTemplateUpdated,
}) => {
  const [formData, setFormData] = useState<CreatePermissionTemplateData>({
    name: '',
    description: '',
    role: 'member',
    permissions: {
      read: true,
      write: false,
      admin: false,
    },
    is_default: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Pre-populate form when editing
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        role: template.role,
        permissions: template.permissions,
        is_default: template.is_default,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        role: 'member',
        permissions: {
          read: true,
          write: false,
          admin: false,
        },
        is_default: false,
      });
    }
  }, [template, open]);

  // Role-based permission templates
  const getPermissionsForRole = (roleType: string) => {
    switch (roleType) {
      case 'viewer':
        return { read: true, write: false, admin: false };
      case 'member':
        return { read: true, write: true, admin: false };
      case 'manager':
        return { read: true, write: true, admin: true };
      default:
        return { read: true, write: false, admin: false };
    }
  };

  // Auto-update permissions when role changes
  const handleRoleChange = (newRole: string) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: getPermissionsForRole(newRole),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (template) {
        await permissionTemplateService.updateTemplate(template.id, formData);
        toast({
          title: "Template updated",
          description: "Permission template has been updated successfully",
        });
      } else {
        await permissionTemplateService.createTemplate(formData);
        toast({
          title: "Template created",
          description: "Permission template has been created successfully",
        });
      }

      onTemplateUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Template' : 'Create Permission Template'}
          </DialogTitle>
          <DialogDescription>
            {template 
              ? 'Update the permission template settings.'
              : 'Create a reusable permission template for your team members.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Senior Developer, Project Lead"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this template's purpose"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">Base Role</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">
                  <div>
                    <div className="font-medium">Viewer</div>
                    <div className="text-xs text-gray-500">Read access only</div>
                  </div>
                </SelectItem>
                <SelectItem value="member">
                  <div>
                    <div className="font-medium">Member</div>
                    <div className="text-xs text-gray-500">Read + Write access</div>
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div>
                    <div className="font-medium">Manager</div>
                    <div className="text-xs text-gray-500">Full access including admin</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            <Label>Permissions</Label>
            <div className="space-y-3 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                <Switch
                  id="read"
                  checked={formData.permissions.read}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      permissions: { ...prev.permissions, read: checked }
                    }))
                  }
                />
                <Label htmlFor="read" className="flex items-center gap-2">
                  Read Access
                  <span className="text-xs text-gray-500">View project content</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="write"
                  checked={formData.permissions.write}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      permissions: { ...prev.permissions, write: checked }
                    }))
                  }
                />
                <Label htmlFor="write" className="flex items-center gap-2">
                  Write Access
                  <span className="text-xs text-gray-500">Edit project content</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="admin"
                  checked={formData.permissions.admin}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      permissions: { ...prev.permissions, admin: checked }
                    }))
                  }
                />
                <Label htmlFor="admin" className="flex items-center gap-2">
                  Admin Access
                  <span className="text-xs text-gray-500">Manage team & settings</span>
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_default: checked }))
              }
            />
            <Label htmlFor="is_default" className="flex items-center gap-2">
              Set as default template for this role
              <span className="text-xs text-gray-500">Auto-apply when adding new members</span>
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {template ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              template ? 'Update Template' : 'Create Template'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionTemplateDialog;