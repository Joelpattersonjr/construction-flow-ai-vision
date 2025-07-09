import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Star, StarOff, Shield, Eye, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { permissionTemplateService, PermissionTemplate } from '@/services/permissionTemplateService';
import PermissionTemplateDialog from './PermissionTemplateDialog';

interface PermissionTemplatesTableProps {
  canManage: boolean;
}

const PermissionTemplatesTable: React.FC<PermissionTemplatesTableProps> = ({ canManage }) => {
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PermissionTemplate | undefined>();
  const { toast } = useToast();

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await permissionTemplateService.getCompanyTemplates();
      setTemplates(data);
    } catch (error) {
      toast({
        title: "Error loading templates",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreateNew = () => {
    setEditingTemplate(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (template: PermissionTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    try {
      await permissionTemplateService.deleteTemplate(templateId);
      toast({
        title: "Template deleted",
        description: `"${templateName}" has been deleted successfully`,
      });
      loadTemplates();
    } catch (error) {
      toast({
        title: "Error deleting template",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (templateId: string, role: string, isCurrentlyDefault: boolean) => {
    try {
      if (isCurrentlyDefault) {
        // If it's already default, we can't unset it directly through our service
        toast({
          title: "Already default",
          description: "This template is already set as the default for this role",
        });
        return;
      }

      await permissionTemplateService.setAsDefault(templateId, role);
      toast({
        title: "Default template updated",
        description: "Template has been set as default for this role",
      });
      loadTemplates();
    } catch (error) {
      toast({
        title: "Error updating default",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const getPermissionIcons = (permissions: { read: boolean; write: boolean; admin: boolean }) => {
    const icons = [];
    if (permissions.read) icons.push(<div key="read" title="Read"><Eye className="h-3 w-3" /></div>);
    if (permissions.write) icons.push(<div key="write" title="Write"><Edit3 className="h-3 w-3" /></div>);
    if (permissions.admin) icons.push(<div key="admin" title="Admin"><Shield className="h-3 w-3" /></div>);
    return icons;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'viewer': return 'secondary';
      case 'member': return 'default';
      case 'manager': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission Templates</CardTitle>
          <CardDescription>Loading templates...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Permission Templates</CardTitle>
              <CardDescription>
                Manage reusable permission templates for your team members.
                {!canManage && " You need to be a project owner or company admin to manage templates."}
              </CardDescription>
            </div>
            {canManage && (
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No permission templates found.</p>
              {canManage && (
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Description</TableHead>
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(template.role)}>
                        {template.role.charAt(0).toUpperCase() + template.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getPermissionIcons(template.permissions)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.is_default ? (
                        <Badge variant="default" className="flex items-center gap-1 w-fit">
                          <Star className="h-3 w-3 fill-current" />
                          Default
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-gray-600 truncate" title={template.description}>
                        {template.description || '-'}
                      </p>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(template.id, template.role, template.is_default)}
                            title={template.is_default ? "Already default" : "Set as default"}
                          >
                            {template.is_default ? (
                              <Star className="h-4 w-4 fill-current text-yellow-500" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{template.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(template.id, template.name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PermissionTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
        onTemplateUpdated={loadTemplates}
      />
    </>
  );
};

export default PermissionTemplatesTable;