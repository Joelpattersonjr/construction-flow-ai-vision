
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Mail, Shield, User, ChevronDown, LogOut, Settings, Building2, UserCheck, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { TeamMembersTable } from '@/components/admin/TeamMembersTable';
import { PendingInvitationsTable } from '@/components/admin/PendingInvitationsTable';
import AdminProjectsTable from '@/components/admin/AdminProjectsTable';
import { CustomFieldsManager } from '@/components/admin/CustomFieldsManager';
import { LockedAccountsTable } from '@/components/admin/LockedAccountsTable';
import { ArrowLeft } from 'lucide-react';

const AdminDashboard = () => {
  const { user, profile, signOut, clearAuthState } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if user is company admin
  const isCompanyAdmin = profile?.company_role === 'company_admin';

  useEffect(() => {
    console.log('AdminDashboard useEffect triggered', { 
      isCompanyAdmin, 
      profile: profile ? { company_id: profile.company_id, company_role: profile.company_role } : null 
    });
    
    if (!isCompanyAdmin) {
      console.log('User is not company admin, skipping data fetch');
      return;
    }
    
    fetchTeamData();
  }, [isCompanyAdmin]);

  const fetchTeamData = async () => {
    console.log('fetchTeamData called', { profile_company_id: profile?.company_id });
    if (!profile?.company_id) {
      console.log('No company_id found, returning early');
      return;
    }

    try {
      setLoading(true);

      // Fetch team members with custom fields
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, job_title, company_role, updated_at, custom_fields')
        .eq('company_id', profile.company_id);

      if (membersError) throw membersError;

      // Fetch pending invitations
      const { data: invitations, error: invitationsError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('company_id', profile.company_id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (invitationsError) throw invitationsError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, status, created_at, owner_id')
        .eq('company_id', profile.company_id);

      if (projectsError) throw projectsError;

      setTeamMembers(members || []);
      setPendingInvitations(invitations || []);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isCompanyAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You need company admin privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm text-gray-600">
                      {profile?.full_name || user?.email}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="border-b pb-3">
                      <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                        <UserCheck className="h-4 w-4" />
                        <span>Account Information</span>
                      </h3>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-2">
                        <span className="font-medium text-gray-700 min-w-[60px]">Name:</span>
                        <span className="text-gray-600">{profile?.full_name || 'Not provided'}</span>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <span className="font-medium text-gray-700 min-w-[60px]">Email:</span>
                        <span className="text-gray-600 break-all">{user?.email}</span>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <span className="font-medium text-gray-700 min-w-[60px]">Role:</span>
                        <span className="text-gray-600">{profile?.job_title || 'User'}</span>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <span className="font-medium text-gray-700 min-w-[60px]">Status:</span>
                        <span className="text-gray-600 capitalize">
                          {profile?.company_role === 'company_admin' ? 'Company Admin' : 'Team Member'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <h4 className="font-medium text-gray-900">Company Details</h4>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start space-x-2">
                          <span className="font-medium text-gray-700 min-w-[70px]">Company:</span>
                          <span className="text-gray-600">{profile?.company?.name || 'Not provided'}</span>
                        </div>
                        
                        <div className="bg-green-50 p-2 rounded-md">
                          <p className="text-xs text-green-700">
                            <span className="font-medium">Administrator Access</span>
                            <br />
                            You have full access to manage company settings and invite team members.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3 space-y-2">
                      <Button
                        variant="outline" 
                        size="sm" 
                        onClick={signOut}
                        className="w-full flex items-center justify-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearAuthState}
                        className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Clear Auth State</span>
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button 
                onClick={() => setIsInviteDialogOpen(true)}
                className="flex items-center space-x-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Team Member</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.length}</div>
              <p className="text-xs text-muted-foreground">
                Active users in your company
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvitations.length}</div>
              <p className="text-xs text-muted-foreground">
                Invitations waiting for acceptance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Company Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamMembers.filter(m => m.company_role === 'company_admin').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Users with admin privileges
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">
                Total company projects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="team" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="team">Team Members</TabsTrigger>
            <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage your company's team members and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamMembersTable 
                  members={teamMembers} 
                  onRefresh={fetchTeamData}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  View and manage pending user invitations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PendingInvitationsTable 
                  invitations={pendingInvitations} 
                  onRefresh={fetchTeamData}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Projects</CardTitle>
                <CardDescription>
                  Manage your company's projects and their permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminProjectsTable 
                  projects={projects} 
                  loading={loading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom-fields" className="space-y-4">
            <CustomFieldsManager />
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <LockedAccountsTable />
          </TabsContent>
        </Tabs>
      </main>

      <InviteUserDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInviteSent={fetchTeamData}
      />
    </div>
  );
};

export default AdminDashboard;
