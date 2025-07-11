
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppHeader from '@/components/navigation/AppHeader';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

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
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={() => navigate('/projects')}
              >
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
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={() => navigate('/tasks')}
              >
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
                Manage Files
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
