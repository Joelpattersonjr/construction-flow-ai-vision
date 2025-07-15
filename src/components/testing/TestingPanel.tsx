import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TestResult {
  name: string;
  status: 'pending' | 'pass' | 'fail' | 'warning';
  message?: string;
}

export function TestingPanel() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Authentication State", status: 'pending' },
    { name: "User Profile Access", status: 'pending' },
    { name: "Company Data Access", status: 'pending' },
    { name: "Project Permissions", status: 'pending' },
    { name: "File Upload Test", status: 'pending' },
    { name: "Task Management", status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const updateTestResult = (testName: string, status: TestResult['status'], message?: string) => {
    setTests(prev => prev.map(test => 
      test.name === testName ? { ...test, status, message } : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    toast({ title: "Running tests...", description: "This may take a few moments" });

    try {
      // Test 1: Authentication State
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        updateTestResult("Authentication State", 'pass', `Logged in as ${session.user.email}`);
      } else {
        updateTestResult("Authentication State", 'fail', "No active session found");
      }

      // Test 2: User Profile Access
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          updateTestResult("User Profile Access", 'fail', `Profile error: ${error.message}`);
        } else if (profile) {
          updateTestResult("User Profile Access", 'pass', `Profile loaded: ${profile.full_name || 'No name'}`);
        }
      }

      // Test 3: Company Data Access
      if (session?.user) {
        const { data: companies, error } = await supabase
          .from('companies')
          .select('*');
        
        if (error) {
          updateTestResult("Company Data Access", 'fail', `Company error: ${error.message}`);
        } else {
          updateTestResult("Company Data Access", 'pass', `Found ${companies?.length || 0} companies`);
        }
      }

      // Test 4: Project Permissions
      if (session?.user) {
        const { data: projects, error } = await supabase
          .from('projects')
          .select('*');
        
        if (error) {
          updateTestResult("Project Permissions", 'fail', `Project error: ${error.message}`);
        } else {
          updateTestResult("Project Permissions", 'pass', `Found ${projects?.length || 0} projects`);
        }
      }

      // Test 5: File Upload Test (just check bucket access)
      if (session?.user) {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
          updateTestResult("File Upload Test", 'fail', `Storage error: ${error.message}`);
        } else {
          updateTestResult("File Upload Test", 'pass', `Storage accessible, ${buckets?.length || 0} buckets`);
        }
      }

      // Test 6: Task Management
      if (session?.user) {
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('*')
          .limit(1);
        
        if (error) {
          updateTestResult("Task Management", 'fail', `Task error: ${error.message}`);
        } else {
          updateTestResult("Task Management", 'pass', "Task access working");
        }
      }

    } catch (error) {
      toast({ 
        title: "Test Error", 
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pass': return <Badge variant="default" className="bg-green-500">Pass</Badge>;
      case 'fail': return <Badge variant="destructive">Fail</Badge>;
      case 'warning': return <Badge variant="secondary">Warning</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          System Health Check
        </CardTitle>
        <CardDescription>
          Quick tests to verify core functionality after security updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? "Running Tests..." : "Run Health Check"}
        </Button>

        <div className="space-y-2">
          {tests.map((test) => (
            <div key={test.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <div className="font-medium">{test.name}</div>
                  {test.message && (
                    <div className="text-sm text-muted-foreground">{test.message}</div>
                  )}
                </div>
              </div>
              {getStatusBadge(test.status)}
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Manual Testing Checklist:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Try creating a new project</li>
            <li>• Upload a file to a project</li>
            <li>• Create and assign a task</li>
            <li>• Test with different user roles</li>
            <li>• Verify file permissions work correctly</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}