import { TestingPanel } from "@/components/testing/TestingPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Users, FileText, Settings } from "lucide-react";

export default function Testing() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">System Testing Dashboard</h1>
        <p className="text-muted-foreground">
          Verify all functionality works correctly after security updates
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <TestingPanel />
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Test Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>XSS Vulnerability Fix</span>
                <Badge variant="default" className="bg-green-500">Fixed</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Input Sanitization</span>
                <Badge variant="default" className="bg-green-500">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>CSS Injection Prevention</span>
                <Badge variant="default" className="bg-green-500">Active</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Role Testing
              </CardTitle>
              <CardDescription>Test different user permission levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-1">
                <div><strong>Company Admin:</strong> Full access to all features</div>
                <div><strong>Company Member:</strong> Limited to assigned projects</div>
                <div><strong>Project Owner:</strong> Manage specific projects</div>
                <div><strong>Project Member:</strong> View and edit assigned tasks</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Critical Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>User Registration & Company Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Project Creation & Member Invitation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>File Upload & Collaborative Editing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Task Management & Time Tracking</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Manual Testing Required
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-800">
          <div className="space-y-2 text-sm">
            <p><strong>Multi-User Testing:</strong> Test with multiple browser sessions to verify permission isolation</p>
            <p><strong>File Operations:</strong> Upload different file types and verify download/preview functionality</p>
            <p><strong>Edge Cases:</strong> Test with empty states, large files, and permission edge cases</p>
            <p><strong>Mobile Testing:</strong> Verify responsive design and touch interactions work properly</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}