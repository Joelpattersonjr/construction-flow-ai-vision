import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Crown, User, Trash2, Edit } from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  job_title: string;
  company_role: 'company_admin' | 'company_member';
  updated_at: string;
}

interface TeamMembersTableProps {
  members: TeamMember[];
  onRefresh: () => void;
  loading: boolean;
}

export const TeamMembersTable: React.FC<TeamMembersTableProps> = ({
  members,
  onRefresh,
  loading,
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<'company_admin' | 'company_member'>('company_member');

  const handleRoleChange = async (memberId: string, role: 'company_admin' | 'company_member') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ company_role: role })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: "User role has been updated successfully",
      });

      setEditingMember(null);
      onRefresh();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Member Removed",
        description: "Team member has been removed successfully",
      });

      onRefresh();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'company_admin' ? (
      <Badge variant="default" className="flex items-center space-x-1">
        <Crown className="h-3 w-3" />
        <span>Admin</span>
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center space-x-1">
        <User className="h-3 w-3" />
        <span>Member</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Job Title</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="font-medium">
              {member.full_name || 'No name'}
            </TableCell>
            <TableCell>{member.job_title || 'No title'}</TableCell>
            <TableCell>
              {editingMember === member.id ? (
                <div className="flex items-center space-x-2">
                  <Select
                    value={newRole}
                    onValueChange={(value: 'company_admin' | 'company_member') => setNewRole(value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company_member">Member</SelectItem>
                      <SelectItem value="company_admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => handleRoleChange(member.id, newRole)}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingMember(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                getRoleBadge(member.company_role)
              )}
            </TableCell>
            <TableCell>
              {new Date(member.updated_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                {member.id !== profile?.id && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingMember(member.id);
                        setNewRole(member.company_role);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {member.full_name} from your company?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveMember(member.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};