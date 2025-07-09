
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LogOut, User, ChevronDown, Settings, Building2, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">ProjectPulse</h1>
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
                        
                        {profile?.company_role === 'company_member' && (
                          <div className="bg-blue-50 p-2 rounded-md">
                            <p className="text-xs text-blue-700">
                              <span className="font-medium">Welcome to the team!</span>
                              <br />
                              You were invited to join {profile?.company?.name || 'this company'} by a company administrator.
                            </p>
                          </div>
                        )}
                        
                        {profile?.company_role === 'company_admin' && (
                          <div className="bg-green-50 p-2 rounded-md">
                            <p className="text-xs text-green-700">
                              <span className="font-medium">Administrator Access</span>
                              <br />
                              You have full access to manage company settings and invite team members.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t pt-3 space-y-2">
                      {profile?.company_role === 'company_admin' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate('/admin')}
                          className="w-full flex items-center justify-center space-x-2"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={signOut}
                        className="w-full flex items-center justify-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to ProjectPulse
          </h2>
          <p className="text-gray-600">
            Manage your construction projects with AI-powered insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Manage your construction projects</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create and track your construction projects with timeline management.
              </p>
              <Button className="mt-4" variant="outline">
                View Projects
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Track project tasks and dependencies</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Manage tasks across all your projects with Gantt chart visualization.
              </p>
              <Button className="mt-4" variant="outline">
                View Tasks
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>AI-powered document analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Upload and analyze construction documents with AI insights.
              </p>
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={() => navigate('/files')}
              >
                View Documents
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
