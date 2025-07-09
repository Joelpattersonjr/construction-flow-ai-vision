import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2, Shield, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const { toast } = useToast();

  const updateMemberRole = async (memberId: string, newRole: string) => {
    setUpdating(prev => new Set(prev).add(memberId));
    
    try {
      const { error } = await supabase
        .from('project_members_enhanced')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

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
    setUpdating(prev => new Set(prev).add(memberId));
    
    try {
      const { error } = await supabase
        .from('project_members_enhanced')
        .update({ permissions })
        .eq('id', memberId);

      if (error) throw error;

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
    setUpdating(prev => new Set(prev).add(memberId));
    
    try {
      const { error } = await supabase
        .from('project_members_enhanced')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Permissions</TableHead>
            {canManage && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{member.profiles?.full_name || 'Unknown User'}</div>
                  <div className="text-sm text-gray-500">{member.profiles?.job_title}</div>
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
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getRoleBadgeColor(member.role)}>
                    {member.role}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {editingPermissions === member.id ? (
                  <PermissionEditor member={member} />
                ) : (
                  <div className="flex space-x-1">
                    {member.permissions.read && <Badge variant="outline">Read</Badge>}
                    {member.permissions.write && <Badge variant="outline">Write</Badge>}
                    {member.permissions.admin && <Badge variant="outline">Admin</Badge>}
                  </div>
                )}
              </TableCell>
              {canManage && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {editingPermissions !== member.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPermissions(member.id)}
                        disabled={updating.has(member.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updating.has(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
  );
};

export default ProjectMembersTable;