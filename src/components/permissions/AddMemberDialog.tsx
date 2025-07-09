import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserPlus, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { auditService } from '@/services/auditService';
import { permissionTemplateService, PermissionTemplate } from '@/services/permissionTemplateService';

interface AddMemberDialogProps {
  projectId: string;
  onMemberAdded: () => void;
}

interface CompanyMember {
  id: string;
  full_name: string;
  job_title: string;
}

const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
  projectId,
  onMemberAdded,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState('member');
  const [permissions, setPermissions] = useState({
    read: true,
    write: false,
    admin: false,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadCompanyMembers = async () => {
    setLoading(true);
    try {
      // Get current user's company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.company_id) {
        throw new Error('User not associated with a company');
      }

      // Get all company members who are not already in this project
      const { data: existingMembers } = await supabase
        .from('project_members_enhanced')
        .select('user_id')
        .eq('project_id', projectId);

      const existingUserIds = existingMembers?.map(m => m.user_id) || [];

      const { data: members, error } = await supabase
        .from('profiles')
        .select('id, full_name, job_title')
        .eq('company_id', profile.company_id)
        .not('id', 'in', `(${existingUserIds.join(',') || 'null'})`);

      if (error) throw error;
      setCompanyMembers(members || []);
    } catch (error) {
      toast({
        title: "Error loading company members",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await permissionTemplateService.getCompanyTemplates();
      setTemplates(data);
      
      // Auto-select default template for current role if available
      const defaultTemplate = data.find(t => t.role === role && t.is_default);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

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
    setRole(newRole);
    setPermissions(getPermissionsForRole(newRole));
    
    // Auto-select default template for new role if available
    const defaultTemplate = templates.find(t => t.role === newRole && t.is_default);
    if (defaultTemplate) {
      setSelectedTemplate(defaultTemplate.id);
    } else {
      setSelectedTemplate('');
    }
  };

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setRole(template.role);
        setPermissions(template.permissions);
      }
    }
  };

  useEffect(() => {
    if (open) {
      loadCompanyMembers();
      loadTemplates();
    }
  }, [open, projectId]);

  useEffect(() => {
    // Auto-select default template when templates are loaded
    if (templates.length > 0) {
      const defaultTemplate = templates.find(t => t.role === role && t.is_default);
      if (defaultTemplate && !selectedTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      }
    }
  }, [templates, role, selectedTemplate]);

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('project_members_enhanced')
        .insert({
          project_id: projectId,
          user_id: selectedUserId,
          role,
          permissions,
        });

      if (error) throw error;

      // Log the audit activity
      await auditService.logActivity({
        projectId,
        actionType: 'member_added',
        targetUserId: selectedUserId,
        newValue: { role, permissions },
        metadata: { memberName: companyMembers.find(m => m.id === selectedUserId)?.full_name }
      });

      // Send notification email
      try {
        const { data: currentUser } = await supabase.auth.getUser();
        if (currentUser?.user) {
          await supabase.functions.invoke('send-permission-notification', {
            body: {
              type: 'member_added',
              projectId,
              targetUserId: selectedUserId,
              actorUserId: currentUser.user.id,
              newRole: role
            }
          });
        }
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Don't block the main operation if email fails
      }

      toast({
        title: "Member added",
        description: "Team member has been added to the project successfully",
      });

      setOpen(false);
      setSelectedUserId('');
      setSelectedTemplate('');
      setRole('member');
      setPermissions({ read: true, write: false, admin: false });
      onMemberAdded();
    } catch (error) {
      toast({
        title: "Failed to add member",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a company member to this project and set their permissions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="member">Select Member</Label>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading company members...</span>
              </div>
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a company member" />
                </SelectTrigger>
                <SelectContent>
                  {companyMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div>
                        <div className="font-medium">{member.full_name}</div>
                        {member.job_title && (
                          <div className="text-xs text-gray-500">{member.job_title}</div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {companyMembers.length === 0 && !loading && (
              <p className="text-sm text-gray-500">
                No available company members to add.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="role">Role</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <div><strong>Viewer:</strong> Read access only</div>
                      <div><strong>Member:</strong> Read + Write access</div>
                      <div><strong>Manager:</strong> Full access including admin</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={role} onValueChange={handleRoleChange}>
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

          {templates.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="template">Permission Template (Optional)</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template or set manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    <div>
                      <div className="font-medium">Manual Setup</div>
                      <div className="text-xs text-gray-500">Set permissions manually</div>
                    </div>
                  </SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {template.name}
                          {template.is_default && <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Default</span>}
                        </div>
                        <div className="text-xs text-gray-500">
                          {template.role} • {template.description || 'No description'}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <Label>Permissions</Label>
              <span className="text-xs text-gray-500">(Auto-set based on role)</span>
            </div>
            <div className="space-y-3 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                <Switch
                  id="read"
                  checked={permissions.read}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, read: checked }))
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
                  checked={permissions.write}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, write: checked }))
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
                  checked={permissions.admin}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, admin: checked }))
                  }
                />
                <Label htmlFor="admin" className="flex items-center gap-2">
                  Admin Access
                  <span className="text-xs text-gray-500">Manage team & settings</span>
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isAdding}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddMember}
            disabled={!selectedUserId || isAdding}
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Member'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberDialog;