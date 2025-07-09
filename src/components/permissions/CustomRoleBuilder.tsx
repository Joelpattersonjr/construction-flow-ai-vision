import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Users, 
  FileText, 
  Shield, 
  Lock, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Save,
  AlertCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomPermission {
  id: string;
  name: string;
  description: string;
  category: 'project' | 'members' | 'files' | 'settings' | 'audit';
  enabled: boolean;
  level: 'view' | 'edit' | 'manage' | 'admin';
}

interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: CustomPermission[];
  isSystemRole: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CustomRoleBuilderProps {
  onRoleCreated: (role: CustomRole) => void;
  onRoleUpdated: (role: CustomRole) => void;
  existingRoles: CustomRole[];
}

const CustomRoleBuilder: React.FC<CustomRoleBuilderProps> = ({
  onRoleCreated,
  onRoleUpdated,
  existingRoles,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [permissions, setPermissions] = useState<CustomPermission[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const { toast } = useToast();

  const defaultPermissions: CustomPermission[] = [
    // Project permissions
    {
      id: 'project_view',
      name: 'View Project',
      description: 'Can view project details and information',
      category: 'project',
      enabled: true,
      level: 'view'
    },
    {
      id: 'project_edit',
      name: 'Edit Project',
      description: 'Can edit project information and settings',
      category: 'project',
      enabled: false,
      level: 'edit'
    },
    {
      id: 'project_delete',
      name: 'Delete Project',
      description: 'Can delete the project',
      category: 'project',
      enabled: false,
      level: 'admin'
    },
    
    // Member permissions
    {
      id: 'members_view',
      name: 'View Members',
      description: 'Can view project team members',
      category: 'members',
      enabled: true,
      level: 'view'
    },
    {
      id: 'members_invite',
      name: 'Invite Members',
      description: 'Can invite new members to the project',
      category: 'members',
      enabled: false,
      level: 'manage'
    },
    {
      id: 'members_manage',
      name: 'Manage Members',
      description: 'Can change roles and remove members',
      category: 'members',
      enabled: false,
      level: 'admin'
    },
    
    // File permissions
    {
      id: 'files_view',
      name: 'View Files',
      description: 'Can view and download project files',
      category: 'files',
      enabled: true,
      level: 'view'
    },
    {
      id: 'files_upload',
      name: 'Upload Files',
      description: 'Can upload new files to the project',
      category: 'files',
      enabled: false,
      level: 'edit'
    },
    {
      id: 'files_manage',
      name: 'Manage Files',
      description: 'Can organize, rename, and delete files',
      category: 'files',
      enabled: false,
      level: 'manage'
    },
    
    // Settings permissions
    {
      id: 'settings_view',
      name: 'View Settings',
      description: 'Can view project settings',
      category: 'settings',
      enabled: false,
      level: 'view'
    },
    {
      id: 'settings_manage',
      name: 'Manage Settings',
      description: 'Can change project settings and permissions',
      category: 'settings',
      enabled: false,
      level: 'admin'
    },
    
    // Audit permissions
    {
      id: 'audit_view',
      name: 'View Audit Log',
      description: 'Can view project activity and audit logs',
      category: 'audit',
      enabled: false,
      level: 'view'
    },
    {
      id: 'audit_export',
      name: 'Export Audit Log',
      description: 'Can export audit logs and reports',
      category: 'audit',
      enabled: false,
      level: 'manage'
    }
  ];

  useEffect(() => {
    if (!editingRole) {
      setPermissions(defaultPermissions);
    } else {
      setPermissions(editingRole.permissions);
      setRoleName(editingRole.name);
      setRoleDescription(editingRole.description);
    }
  }, [editingRole]);

  useEffect(() => {
    validatePermissions();
  }, [permissions]);

  const validatePermissions = () => {
    const newConflicts: string[] = [];
    
    // Check for logical conflicts
    permissions.forEach(permission => {
      if (permission.enabled) {
        // Check if higher level permissions are enabled without lower level ones
        if (permission.level === 'admin' || permission.level === 'manage') {
          const basePermission = permissions.find(p => 
            p.category === permission.category && p.level === 'view'
          );
          if (basePermission && !basePermission.enabled) {
            newConflicts.push(`${permission.name} requires ${basePermission.name} to be enabled`);
          }
        }
      }
    });

    // Check for duplicate role names
    if (roleName && existingRoles.some(role => 
      role.name.toLowerCase() === roleName.toLowerCase() && 
      role.id !== editingRole?.id
    )) {
      newConflicts.push('A role with this name already exists');
    }

    setConflicts(newConflicts);
  };

  const togglePermission = (permissionId: string) => {
    setPermissions(prev => prev.map(p => 
      p.id === permissionId ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const getPermissionsByCategory = (category: string) => {
    return permissions.filter(p => p.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'project': return Settings;
      case 'members': return Users;
      case 'files': return FileText;
      case 'settings': return Shield;
      case 'audit': return Eye;
      default: return Settings;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'project': return 'bg-blue-100 text-blue-800';
      case 'members': return 'bg-green-100 text-green-800';
      case 'files': return 'bg-purple-100 text-purple-800';
      case 'settings': return 'bg-red-100 text-red-800';
      case 'audit': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'view': return Eye;
      case 'edit': return Edit;
      case 'manage': return Settings;
      case 'admin': return Shield;
      default: return Eye;
    }
  };

  const handleSave = () => {
    if (!roleName.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    if (conflicts.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please resolve all conflicts before saving",
        variant: "destructive",
      });
      return;
    }

    const roleData: CustomRole = {
      id: editingRole?.id || crypto.randomUUID(),
      name: roleName.trim(),
      description: roleDescription.trim(),
      permissions: permissions.filter(p => p.enabled),
      isSystemRole: false,
      usageCount: editingRole?.usageCount || 0,
      createdAt: editingRole?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingRole) {
      onRoleUpdated(roleData);
      toast({
        title: "Role Updated",
        description: "Custom role has been updated successfully",
      });
    } else {
      onRoleCreated(roleData);
      toast({
        title: "Role Created",
        description: "Custom role has been created successfully",
      });
    }

    resetForm();
    setIsOpen(false);
  };

  const resetForm = () => {
    setRoleName('');
    setRoleDescription('');
    setPermissions(defaultPermissions);
    setConflicts([]);
    setEditingRole(null);
  };

  const openEditMode = (role: CustomRole) => {
    setEditingRole(role);
    setActiveTab('builder');
    setIsOpen(true);
  };

  const presetRoles = [
    {
      name: 'Project Viewer',
      description: 'Can view project information and files',
      permissions: ['project_view', 'members_view', 'files_view']
    },
    {
      name: 'Content Manager',
      description: 'Can manage files and view project information',
      permissions: ['project_view', 'members_view', 'files_view', 'files_upload', 'files_manage']
    },
    {
      name: 'Team Lead',
      description: 'Can manage members and content',
      permissions: ['project_view', 'members_view', 'members_invite', 'files_view', 'files_upload', 'files_manage', 'audit_view']
    }
  ];

  const applyPreset = (preset: typeof presetRoles[0]) => {
    setRoleName(preset.name);
    setRoleDescription(preset.description);
    setPermissions(prev => prev.map(p => ({
      ...p,
      enabled: preset.permissions.includes(p.id)
    })));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Custom Role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRole ? 'Edit Custom Role' : 'Create Custom Role'}
          </DialogTitle>
          <DialogDescription>
            Build a custom role with specific permissions for your project needs
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="builder">Role Builder</TabsTrigger>
            <TabsTrigger value="existing">Existing Roles</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <Label htmlFor="roleDescription">Description</Label>
                <Textarea
                  id="roleDescription"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Describe the role's purpose"
                  rows={3}
                />
              </div>
            </div>

            {conflicts.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {conflicts.map((conflict, index) => (
                      <div key={index}>• {conflict}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <Label>Permissions</Label>
              {['project', 'members', 'files', 'settings', 'audit'].map(category => {
                const categoryPermissions = getPermissionsByCategory(category);
                const CategoryIcon = getCategoryIcon(category);
                
                return (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CategoryIcon className="h-5 w-5" />
                        {category.charAt(0).toUpperCase() + category.slice(1)} Permissions
                        <Badge className={getCategoryColor(category)}>
                          {categoryPermissions.filter(p => p.enabled).length}/{categoryPermissions.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {categoryPermissions.map(permission => {
                        const LevelIcon = getLevelIcon(permission.level);
                        return (
                          <div 
                            key={permission.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <LevelIcon className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="font-medium">{permission.name}</div>
                                <div className="text-sm text-gray-500">{permission.description}</div>
                              </div>
                            </div>
                            <Switch
                              checked={permission.enabled}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
              <Button onClick={handleSave} disabled={conflicts.length > 0}>
                <Save className="h-4 w-4 mr-2" />
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="existing" className="space-y-4">
            <div className="space-y-4">
              {existingRoles.map(role => (
                <Card key={role.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {role.name}
                          {role.isSystemRole && (
                            <Badge variant="secondary">System</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {role.usageCount} users
                        </Badge>
                        {!role.isSystemRole && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditMode(role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label>Permissions ({role.permissions.length})</Label>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map(permission => (
                          <Badge key={permission.id} variant="outline" className="text-xs">
                            {permission.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="presets" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Use these preset roles as a starting point and customize them as needed.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presetRoles.map(preset => (
                <Card key={preset.name} className="cursor-pointer hover:bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-lg">{preset.name}</CardTitle>
                    <CardDescription>{preset.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label>Included Permissions</Label>
                      <div className="space-y-1">
                        {preset.permissions.map(permissionId => {
                          const permission = defaultPermissions.find(p => p.id === permissionId);
                          return (
                            <div key={permissionId} className="text-sm text-gray-600">
                              • {permission?.name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => {
                        applyPreset(preset);
                        setActiveTab('builder');
                      }}
                    >
                      Use This Preset
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CustomRoleBuilder;