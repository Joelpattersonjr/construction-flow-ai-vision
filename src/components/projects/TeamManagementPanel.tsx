import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Users, 
  UserPlus, 
  Search, 
  Settings, 
  Trash2, 
  Crown, 
  Shield, 
  Eye, 
  UserCheck, 
  Edit,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    job_title: string;
    avatar_url?: string;
    email?: string;
    company_role: string;
  };
}

interface CompanyMember {
  id: string;
  full_name: string;
  job_title: string;
  email: string;
  avatar_url?: string;
  company_role: string;
}

interface TeamManagementPanelProps {
  projectId: string;
  projectName: string;
  hasWritePermission: boolean;
}

const TeamManagementPanel: React.FC<TeamManagementPanelProps> = ({
  projectId,
  projectName,
  hasWritePermission
}) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [newMemberPermissions, setNewMemberPermissions] = useState({
    read: true,
    write: false,
    admin: false,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    loadProjectMembers();
    loadCompanyMembers();
  }, [projectId]);

  const loadProjectMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('project_members_enhanced')
        .select(`
          id,
          user_id,
          role,
          permissions,
          created_at,
          profiles!inner(
            id,
            full_name,
            job_title,
            avatar_url,
            email,
            company_role
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Type-safe conversion of the data
      const typedMembers: ProjectMember[] = (data || []).map(member => ({
        ...member,
        permissions: member.permissions as { read: boolean; write: boolean; admin: boolean; }
      }));
      
      setMembers(typedMembers);
    } catch (error) {
      console.error('Error loading project members:', error);
      toast({
        title: "Error loading team members",
        description: "Could not load project team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyMembers = async () => {
    try {
      if (!profile?.company_id) return;

      // Get existing project member user IDs
      const { data: existingMembers } = await supabase
        .from('project_members_enhanced')
        .select('user_id')
        .eq('project_id', projectId);

      const existingUserIds = existingMembers?.map(m => m.user_id) || [];

      // Get all company members not in project
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, job_title, email, avatar_url, company_role')
        .eq('company_id', profile.company_id)
        .not('id', 'in', existingUserIds.length > 0 ? `(${existingUserIds.join(',')})` : '(null)');

      if (error) throw error;
      setCompanyMembers(data || []);
    } catch (error) {
      console.error('Error loading company members:', error);
    }
  };

  const addMember = async () => {
    if (!selectedUserId) return;

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('project_members_enhanced')
        .insert({
          project_id: projectId,
          user_id: selectedUserId,
          role: newMemberRole,
          permissions: newMemberPermissions,
        });

      if (error) throw error;

      toast({
        title: "Team member added",
        description: "The team member has been successfully added to the project",
      });

      setAddMemberOpen(false);
      setSelectedUserId('');
      setNewMemberRole('member');
      setNewMemberPermissions({ read: true, write: false, admin: false });
      
      // Reload data
      await Promise.all([loadProjectMembers(), loadCompanyMembers()]);
    } catch (error) {
      toast({
        title: "Error adding team member",
        description: error instanceof Error ? error.message : "Could not add team member",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    setUpdating(prev => new Set([...prev, memberId]));
    
    try {
      // Set default permissions based on role
      let permissions = { read: true, write: false, admin: false };
      switch (newRole) {
        case 'owner':
        case 'manager':
          permissions = { read: true, write: true, admin: true };
          break;
        case 'member':
          permissions = { read: true, write: true, admin: false };
          break;
        case 'viewer':
          permissions = { read: true, write: false, admin: false };
          break;
      }

      const { error } = await supabase
        .from('project_members_enhanced')
        .update({ role: newRole, permissions })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: "Team member role has been updated successfully",
      });

      loadProjectMembers();
    } catch (error) {
      toast({
        title: "Error updating role",
        description: error instanceof Error ? error.message : "Could not update role",
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
    setUpdating(prev => new Set([...prev, memberId]));
    
    try {
      const { error } = await supabase
        .from('project_members_enhanced')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Team member removed",
        description: "The team member has been removed from the project",
      });

      await Promise.all([loadProjectMembers(), loadCompanyMembers()]);
    } catch (error) {
      toast({
        title: "Error removing team member",
        description: error instanceof Error ? error.message : "Could not remove team member",
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

  // Helper functions
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Filter members based on search and role filter
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.profiles.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const rolePermissionMapping = {
    owner: { read: true, write: true, admin: true },
    manager: { read: true, write: true, admin: true },
    member: { read: true, write: true, admin: false },
    viewer: { read: true, write: false, admin: false },
  };

  const handleRoleChange = (role: string) => {
    setNewMemberRole(role);
    setNewMemberPermissions(rolePermissionMapping[role as keyof typeof rolePermissionMapping] || { read: true, write: false, admin: false });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{members.filter(m => m.role === 'manager' || m.role === 'owner').length}</p>
                <p className="text-sm text-muted-foreground">Managers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{companyMembers.length}</p>
                <p className="text-sm text-muted-foreground">Available to Add</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Project Team Members
              </CardTitle>
              <CardDescription>
                Manage team members and their roles for {projectName}
              </CardDescription>
            </div>
            {hasWritePermission && (
              <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>
                      Add a company member to this project and assign their role.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="member-select">Select Member</Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a team member" />
                        </SelectTrigger>
                        <SelectContent>
                          {companyMembers.map(member => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex items-center space-x-2">
                                <span>{member.full_name}</span>
                                {member.job_title && (
                                  <span className="text-sm text-muted-foreground">- {member.job_title}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role-select">Role</Label>
                      <Select value={newMemberRole} onValueChange={handleRoleChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer - Read only access</SelectItem>
                          <SelectItem value="member">Member - Read and edit access</SelectItem>
                          <SelectItem value="manager">Manager - Full access including member management</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Permissions</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Read Access</Label>
                            <p className="text-sm text-muted-foreground">Can view project content</p>
                          </div>
                          <Switch 
                            checked={newMemberPermissions.read} 
                            onCheckedChange={(checked) => setNewMemberPermissions(prev => ({ ...prev, read: checked }))}
                            disabled
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Write Access</Label>
                            <p className="text-sm text-muted-foreground">Can edit and create content</p>
                          </div>
                          <Switch 
                            checked={newMemberPermissions.write} 
                            onCheckedChange={(checked) => setNewMemberPermissions(prev => ({ ...prev, write: checked }))}
                            disabled={newMemberRole === 'viewer'}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base">Admin Access</Label>
                            <p className="text-sm text-muted-foreground">Can manage team members and settings</p>
                          </div>
                          <Switch 
                            checked={newMemberPermissions.admin} 
                            onCheckedChange={(checked) => setNewMemberPermissions(prev => ({ ...prev, admin: checked }))}
                            disabled={newMemberRole === 'viewer' || newMemberRole === 'member'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addMember} disabled={!selectedUserId || isAdding}>
                      {isAdding ? "Adding..." : "Add Member"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Members Table */}
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {searchTerm || roleFilter !== 'all' ? 'No matching members' : 'No team members'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Add team members to start collaborating on this project'
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Added</TableHead>
                    {hasWritePermission && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profiles.avatar_url} />
                            <AvatarFallback>{getInitials(member.profiles.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.profiles.full_name}</p>
                            <p className="text-sm text-muted-foreground">{member.profiles.job_title}</p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(member.role)}
                          <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                            {member.role}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex space-x-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant={member.permissions.read ? "default" : "secondary"} className="text-xs">
                                  R
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Read Access</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant={member.permissions.write ? "default" : "secondary"} className="text-xs">
                                  W
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Write Access</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant={member.permissions.admin ? "default" : "secondary"} className="text-xs">
                                  A
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Admin Access</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(member.created_at)}
                      </TableCell>
                      
                      {hasWritePermission && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Select
                              value={member.role}
                              onValueChange={(newRole) => updateMemberRole(member.id, newRole)}
                              disabled={updating.has(member.id) || member.profiles.id === user?.id}
                            >
                              <SelectTrigger className="w-[100px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            {member.profiles.id !== user?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={updating.has(member.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove {member.profiles.full_name} from this project? 
                                      They will lose all access to project files and data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => removeMember(member.id)}
                                      className="bg-destructive text-destructive-foreground"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamManagementPanel;