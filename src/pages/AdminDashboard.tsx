
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import UserProfilePopover from '@/components/navigation/UserProfilePopover';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Mail, Shield, User, ChevronDown, LogOut, Settings, Building2, UserCheck, FolderOpen, Crown, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InviteUserDialog } from '@/components/admin/InviteUserDialog';
import { TeamMembersTable } from '@/components/admin/TeamMembersTable';
import { PendingInvitationsTable } from '@/components/admin/PendingInvitationsTable';
import AdminProjectsTable from '@/components/admin/AdminProjectsTable';
import { CustomFieldsManager } from '@/components/admin/CustomFieldsManager';
import { LockedAccountsTable } from '@/components/admin/LockedAccountsTable';
import SecurityTesting from '@/components/SecurityTesting';
import PerformanceTesting from '@/components/PerformanceTesting';

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
    if (!isCompanyAdmin) return;
    
    fetchTeamData();
  }, [isCompanyAdmin]);

  const fetchTeamData = async () => {
    if (!profile?.company_id) return;

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-blue-300/20 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-purple-300/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <Card className="w-96 border-0 bg-white/40 backdrop-blur-sm shadow-2xl">
            <CardContent className="pt-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl backdrop-blur-sm border border-white/20 mb-6">
                <Shield className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
              <p className="text-gray-600 leading-relaxed">
                You need company admin privileges to access this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-blue-300/20 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-purple-300/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Header */}
      <nav className="bg-white/20 backdrop-blur-sm border-b border-white/30 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 bg-white/30 backdrop-blur-sm hover:bg-white/50 transition-all duration-300 border border-white/20 text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-lg">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <UserProfilePopover />
              <Button
                onClick={() => setIsInviteDialogOpen(true)}
                className="group bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 font-semibold relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Add Team Member</span>
                </span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="group relative border-0 bg-white/40 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-600 group-hover:text-blue-600 transition-colors duration-300">Team Members</CardTitle>
              <div className="p-2 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">{teamMembers.length}</div>
              <p className="text-sm text-gray-500 mt-1">
                Active users in your company
              </p>
            </CardContent>
          </Card>

          <Card className="group relative border-0 bg-white/40 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-600 group-hover:text-orange-600 transition-colors duration-300">Pending Invitations</CardTitle>
              <div className="p-2 bg-gradient-to-br from-orange-500/10 to-red-600/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Mail className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-orange-600 group-hover:scale-110 transition-transform duration-300">{pendingInvitations.length}</div>
              <p className="text-sm text-gray-500 mt-1">
                Invitations waiting for acceptance
              </p>
            </CardContent>
          </Card>

          <Card className="group relative border-0 bg-white/40 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-600 group-hover:text-purple-600 transition-colors duration-300">Company Admins</CardTitle>
              <div className="p-2 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-purple-600 group-hover:scale-110 transition-transform duration-300">
                {teamMembers.filter(m => m.company_role === 'company_admin').length}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Users with admin privileges
              </p>
            </CardContent>
          </Card>

          <Card className="group relative border-0 bg-white/40 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-600 group-hover:text-green-600 transition-colors duration-300">Projects</CardTitle>
              <div className="p-2 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <FolderOpen className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-green-600 group-hover:scale-110 transition-transform duration-300">{projects.length}</div>
              <p className="text-sm text-gray-500 mt-1">
                Total company projects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-1 shadow-xl border border-white/30">
          <Tabs defaultValue="team" className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-white/40 backdrop-blur-sm">
              <TabsTrigger value="team" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">Team Members</TabsTrigger>
              <TabsTrigger value="invitations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">Pending Invitations</TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">Projects</TabsTrigger>
              <TabsTrigger value="custom-fields" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">Custom Fields</TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">Security</TabsTrigger>
              <TabsTrigger value="performance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600 data-[state=active]:text-white">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="team" className="space-y-4 mt-6">
              <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-500/5 to-indigo-600/5 rounded-t-lg">
                  <CardTitle className="text-xl font-bold text-gray-800">Team Members</CardTitle>
                  <CardDescription className="text-gray-600">
                    Manage your company's team members and their roles
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <TeamMembersTable 
                    members={teamMembers} 
                    onRefresh={fetchTeamData}
                    loading={loading}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invitations" className="space-y-4 mt-6">
              <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-500/5 to-red-600/5 rounded-t-lg">
                  <CardTitle className="text-xl font-bold text-gray-800">Pending Invitations</CardTitle>
                  <CardDescription className="text-gray-600">
                    View and manage pending user invitations
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <PendingInvitationsTable 
                    invitations={pendingInvitations} 
                    onRefresh={fetchTeamData}
                    loading={loading}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="space-y-4 mt-6">
              <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-500/5 to-emerald-600/5 rounded-t-lg">
                  <CardTitle className="text-xl font-bold text-gray-800">Company Projects</CardTitle>
                  <CardDescription className="text-gray-600">
                    Manage your company's projects and their permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <AdminProjectsTable 
                    projects={projects} 
                    loading={loading}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="custom-fields" className="space-y-4 mt-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-1">
                <CustomFieldsManager />
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4 mt-6">
              <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
                <CardHeader className="bg-gradient-to-r from-red-500/5 to-orange-600/5 rounded-t-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    <CardTitle className="text-xl font-bold text-gray-800">Security Testing</CardTitle>
                  </div>
                  <CardDescription className="text-gray-600">
                    Comprehensive security vulnerability testing and monitoring for construction workflows
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <SecurityTesting />
                </CardContent>
              </Card>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-1 mt-6">
                <LockedAccountsTable />
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 mt-6">
              <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-500/5 to-purple-600/5 rounded-t-lg">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-xl font-bold text-gray-800">System Performance</CardTitle>
                  </div>
                  <CardDescription className="text-gray-600">
                    Monitor construction workflow performance, test system resources, and optimize application speed
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <PerformanceTesting />
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
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
