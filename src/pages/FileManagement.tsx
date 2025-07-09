import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FileManager from '@/components/file-management/FileManager';

// Mock project data - replace with actual project data from your API
const MOCK_PROJECTS = [
  { id: '1', name: 'Downtown Office Complex', address: '123 Main St, Downtown' },
  { id: '2', name: 'Residential Tower A', address: '456 Oak Ave, Uptown' },
  { id: '3', name: 'Shopping Mall Renovation', address: '789 Pine Rd, Westside' },
];

const FileManagement = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectedProject = MOCK_PROJECTS.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">File Management</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Project Documents
          </h2>
          <p className="text-gray-600">
            Upload, organize, and manage all your construction project files
          </p>
        </div>

        {!selectedProjectId ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5" />
                <span>Select a Project</span>
              </CardTitle>
              <CardDescription>
                Choose a project to view and manage its files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedProjectId || ''} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_PROJECTS.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-gray-500">{project.address}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="text-center py-8">
                <FolderOpen className="mx-auto h-16 w-16 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No project selected</h3>
                <p className="mt-2 text-gray-500">
                  Select a project from the dropdown above to start managing files
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedProject?.name}</CardTitle>
                    <CardDescription>{selectedProject?.address}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedProjectId(null)}
                  >
                    Change Project
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <FileManager projectId={selectedProjectId} />
          </div>
        )}
      </main>
    </div>
  );
};

export default FileManagement;