import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2, Shield, Edit, Eye, FileEdit, Settings, Crown, UserCheck, Users2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { auditService } from '@/services/auditService';

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  profiles: {
    full_name: string;
    job_title: string;
  };
}

interface ProjectMembersTableProps {
  projectId: string;
  members: ProjectMember[];
  canManage: boolean;
  onMemberUpdated: () => void;
}

const ProjectMembersTable: React.FC<ProjectMembersTableProps> = ({
  projectId,
  members,
  canManage,
  onMemberUpdated,
}) => {
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [editingPermissions, setEditingPermissions] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Helper function to generate initials from full name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'manager':
        return <Settings className="h-4 w-4" />;
      case 'member':
        return <UserCheck className="h-4 w-4" />;
      case 'viewer':
        return <Eye className="h-4 w-4" />;
      default:
        return <Users2 className="h-4 w-4" />;
    }
  };

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(new Set(members.map(m => m.id)));
    } else {
      setSelectedMembers(new Set());
    }
  };

  const handleSelectMember = (memberId: string, checked: boolean) => {
    const newSelection = new Set(selectedMembers);
    if (checked) {
      newSelection.add(memberId);
    } else {
      newSelection.delete(memberId);
    }
    setSelectedMembers(newSelection);
  };

  const bulkChangeRole = async (newRole: string) => {
    const memberIds = Array.from(selectedMembers);
    setUpdating(prev => new Set([...prev, ...memberIds]));
    
    try {
      const { error } = await supabase
        .from('project_members_enhanced')
        .update({ role: newRole })
        .in('id', memberIds);

      if (error) throw error;

      toast({
        title: "Bulk role update completed",
        description: `${memberIds.length} members updated to ${newRole}`,
      });
      
      onMemberUpdated();
      setSelectedMembers(new Set());
    } catch (error) {
      toast({
        title: "Failed to update roles",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        memberIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    setUpdating(prev => new Set(prev).add(memberId));
    
    try {
      const { error } = await supabase
        .from('project_members_enhanced')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      // Log the audit activity
      await auditService.logActivity({
        projectId,
        actionType: 'role_changed',
        targetUserId: member.user_id,
        oldValue: { role: member.role },
        newValue: { role: newRole },
        metadata: { memberName: member.profiles?.full_name }
      });

      // Send notification email
      try {
        const { data: currentUser } = await supabase.auth.getUser();
        if (currentUser?.user) {
          await supabase.functions.invoke('send-permission-notification', {
            body: {
              type: 'role_changed',
              projectId,
              targetUserId: member.user_id,
              actorUserId: currentUser.user.id,
              newRole: newRole,
              previousRole: member.role
            }
          });
        }
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Don't block the main operation if email fails
      }

      toast({
        title: "Role updated",
        description: "Member role has been updated successfully",
      });
      
      onMemberUpdated();
    } catch (error) {
      toast({
        title: "Failed to update role",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  };

  const updateMemberPermissions = async (memberId: string, permissions: { read: boolean; write: boolean; admin: boolean }) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    setUpdating(prev => new Set(prev).add(memberId));
    
    try {
      const { error } = await supabase
        .from('project_members_enhanced')
        .update({ permissions })
        .eq('id', memberId);

      if (error) throw error;

      // Log the audit activity
      await auditService.logActivity({
        projectId,
        actionType: 'permissions_updated',
        targetUserId: member.user_id,
        oldValue: { permissions: member.permissions },
        newValue: { permissions },
        metadata: { memberName: member.profiles?.full_name }
      });

      toast({
        title: "Permissions updated",
        description: "Member permissions have been updated successfully",
      });
      
      onMemberUpdated();
      setEditingPermissions(null);
    } catch (error) {
      toast({
        title: "Failed to update permissions",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  };

  const removeMember = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    setUpdating(prev => new Set(prev).add(memberId));
    
    try {
      const { error } = await supabase
        .from('project_members_enhanced')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Log the audit activity
      await auditService.logActivity({
        projectId,
        actionType: 'member_removed',
        targetUserId: member.user_id,
        oldValue: { role: member.role, permissions: member.permissions },
        metadata: { memberName: member.profiles?.full_name }
      });

      // Send notification email
      try {
        const { data: currentUser } = await supabase.auth.getUser();
        if (currentUser?.user) {
          await supabase.functions.invoke('send-permission-notification', {
            body: {
              type: 'member_removed',
              projectId,
              targetUserId: member.user_id,
              actorUserId: currentUser.user.id
            }
          });
        }
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
        // Don't block the main operation if email fails
      }

      toast({
        title: "Member removed",
        description: "Member has been removed from the project",
      });
      
      onMemberUpdated();
    } catch (error) {
      toast({
        title: "Failed to remove member",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-red-100 text-red-800';
      case 'member':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const PermissionEditor: React.FC<{ member: ProjectMember }> = ({ member }) => {
    const [permissions, setPermissions] = useState(member.permissions);

    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="read"
            checked={permissions.read}
            onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, read: checked }))}
          />
          <Label htmlFor="read">Read Access</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="write"
            checked={permissions.write}
            onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, write: checked }))}
          />
          <Label htmlFor="write">Write Access</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="admin"
            checked={permissions.admin}
            onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, admin: checked }))}
          />
          <Label htmlFor="admin">Admin Access</Label>
        </div>
        <div className="flex space-x-2">
          <Button 
            size="sm"
            onClick={() => updateMemberPermissions(member.id, permissions)}
            disabled={updating.has(member.id)}
          >
            Save
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setEditingPermissions(null)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No team members</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add team members to start collaborating on this project.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {canManage && selectedMembers.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-blue-900">
            {selectedMembers.size} member{selectedMembers.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Select onValueChange={bulkChangeRole}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Change role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Make Viewer</SelectItem>
                <SelectItem value="member">Make Member</SelectItem>
                <SelectItem value="manager">Make Manager</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedMembers(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {canManage && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedMembers.size === members.length && members.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id} className="hover:bg-gray-50">
                {canManage && (
                  <TableCell>
                    <Checkbox
                      checked={selectedMembers.has(member.id)}
                      onCheckedChange={(checked) => handleSelectMember(member.id, checked === true)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={member.profiles?.full_name} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {getInitials(member.profiles?.full_name || 'UN')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900">
                        {member.profiles?.full_name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.profiles?.job_title}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {canManage && !updating.has(member.id) ? (
                    <Select
                      value={member.role}
                      onValueChange={(value) => updateMemberRole(member.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Viewer
                          </div>
                        </SelectItem>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            Member
                          </div>
                        </SelectItem>
                        <SelectItem value="manager">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Manager
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getRoleBadgeColor(member.role) + " flex items-center gap-1 w-fit"}>
                      {getRoleIcon(member.role)}
                      {member.role}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {editingPermissions === member.id ? (
                    <PermissionEditor member={member} />
                  ) : (
                    <div className="flex space-x-1">
                      <TooltipProvider>
                        {member.permissions.read && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                Read
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Can view project content</TooltipContent>
                          </Tooltip>
                        )}
                        {member.permissions.write && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <FileEdit className="h-3 w-3" />
                                Write
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Can edit project content</TooltipContent>
                          </Tooltip>
                        )}
                        {member.permissions.admin && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Settings className="h-3 w-3" />
                                Admin
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Can manage team & settings</TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </div>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {editingPermissions !== member.id && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingPermissions(member.id)}
                                disabled={updating.has(member.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit permissions</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={updating.has(member.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove member</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {member.profiles?.full_name} from this project? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeMember(member.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remove Member
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
      </div>
    </div>
  );
};

export default ProjectMembersTable;