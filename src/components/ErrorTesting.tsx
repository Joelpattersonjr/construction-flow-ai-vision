import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Bug, Database, Bolt } from 'lucide-react';

const ErrorTesting = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const testNetworkError = async () => {
    setIsLoading(true);
    try {
      // Try to fetch with a malformed query to trigger a network error
      const { error } = await supabase
        .from('projects')
        .select('nonexistent_column');
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Network Error Test",
        description: error.message || "Database connection failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testJavaScriptError = () => {
    try {
      // Intentionally trigger a JavaScript error
      const obj: any = null;
      obj.nonexistentMethod();
    } catch (error: any) {
      toast({
        title: "JavaScript Error Test",
        description: error.message || "Unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const testToastError = () => {
    toast({
      title: "Toast Error Test",
      description: "This is a test error message to verify toast notifications are working",
      variant: "destructive"
    });
  };

  const testAsyncError = async () => {
    setIsLoading(true);
    try {
      // Simulate an async operation that fails
      await new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Async operation failed")), 1000);
      });
    } catch (error: any) {
      toast({
        title: "Async Error Test",
        description: error.message || "Async operation failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testPermissionError = async () => {
    setIsLoading(true);
    try {
      // Simulate a permission error by throwing it directly
      // This ensures the test always works regardless of user permissions
      throw new Error("Access denied: Insufficient permissions to access this resource");
    } catch (error: any) {
      toast({
        title: "Permission Error Test",
        description: error.message || "Access denied",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testSuccessToast = () => {
    toast({
      title: "Success Test",
      description: "This is a success message to verify toast notifications are working",
    });
  };

  const errorTests = [
    {
      title: "Network Error",
      description: "Test database connection error",
      icon: Database,
      action: testNetworkError,
      color: "text-red-500"
    },
    {
      title: "JavaScript Error",
      description: "Test runtime JavaScript error",
      icon: Bug,
      action: testJavaScriptError,
      color: "text-orange-500"
    },
    {
      title: "Toast Error",
      description: "Test error toast notification",
      icon: AlertTriangle,
      action: testToastError,
      color: "text-yellow-500"
    },
    {
      title: "Async Error",
      description: "Test asynchronous operation error",
      icon: Bolt,
      action: testAsyncError,
      color: "text-purple-500"
    },
    {
      title: "Permission Error",
      description: "Test permission denied error",
      icon: Database,
      action: testPermissionError,
      color: "text-pink-500"
    },
    {
      title: "Success Toast",
      description: "Test success notification",
      icon: Bolt,
      action: testSuccessToast,
      color: "text-green-500"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Error Handling Tests</h1>
        <p className="text-gray-600">Test various error scenarios to verify error handling is working properly</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {errorTests.map((test, index) => {
          const IconComponent = test.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <IconComponent className={`h-5 w-5 ${test.color}`} />
                  <CardTitle className="text-lg">{test.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">{test.description}</p>
                <Button 
                  onClick={test.action}
                  disabled={isLoading}
                  className="w-full"
                  variant={test.title === "Success Toast" ? "default" : "destructive"}
                >
                  {isLoading ? "Testing..." : `Test ${test.title}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700 space-y-2">
          <p>• These tests are designed to trigger controlled errors to verify error handling</p>
          <p>• Error messages should appear as toast notifications</p>
          <p>• Check the browser console for additional error details</p>
          <p>• All errors are intentional and safe for testing</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorTesting;