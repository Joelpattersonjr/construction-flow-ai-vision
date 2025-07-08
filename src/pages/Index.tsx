
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LogOut, User, ChevronDown, Settings } from 'lucide-react';
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
                  <div className="space-y-3">
                    <div className="border-b pb-3">
                      <h3 className="font-semibold text-gray-900">Account Information</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Name:</span>
                        <span className="ml-2 text-gray-600">{profile?.full_name || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Email:</span>
                        <span className="ml-2 text-gray-600">{user?.email}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Company:</span>
                        <span className="ml-2 text-gray-600">{profile?.company_name || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Role:</span>
                        <span className="ml-2 text-gray-600">{profile?.job_title || 'User'}</span>
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
              <Button className="mt-4" variant="outline">
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
