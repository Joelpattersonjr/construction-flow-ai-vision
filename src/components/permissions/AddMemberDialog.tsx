import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    if (open) {
      loadCompanyMembers();
    }
  }, [open, projectId]);

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

      toast({
        title: "Member added",
        description: "Team member has been added to the project successfully",
      });

      setOpen(false);
      setSelectedUserId('');
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
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            <Label>Permissions</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="read"
                  checked={permissions.read}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, read: checked }))
                  }
                />
                <Label htmlFor="read">Read Access</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="write"
                  checked={permissions.write}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, write: checked }))
                  }
                />
                <Label htmlFor="write">Write Access</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="admin"
                  checked={permissions.admin}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, admin: checked }))
                  }
                />
                <Label htmlFor="admin">Admin Access</Label>
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