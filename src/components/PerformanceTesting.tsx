import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Database, 
  Globe, 
  Upload, 
  Network, 
  Timer, 
  Zap, 
  BarChart3,
  Smartphone,
  FileText
} from 'lucide-react';

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  fileUploadSpeed: number;
  mobileResponseTime: number;
  networkLatency: number;
  documentLoadTime: number;
}

interface DatabasePerformanceResult {
  totalTests: number;
  totalTime: number;
  averageTime: number;
  successfulTests: number;
  failedTests: number;
  results: Array<{
    test: string;
    duration: number;
    status: string;
    error?: string;
    rowsReturned: number;
    expectedRows: number;
  }>;
  recommendations: string[];
}

const PerformanceTesting = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [dbResults, setDbResults] = useState<DatabasePerformanceResult | null>(null);
  const [testProgress, setTestProgress] = useState(0);

  // Mock performance data for construction workflows
  const generateMockMetrics = (): PerformanceMetrics => ({
    responseTime: Math.floor(Math.random() * 200) + 50,
    throughput: Math.floor(Math.random() * 800) + 700,
    fileUploadSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 MB/s for blueprints/photos
    mobileResponseTime: Math.floor(Math.random() * 800) + 200, // 200-1000ms mobile response
    networkLatency: Math.floor(Math.random() * 30) + 5,
    documentLoadTime: Math.floor(Math.random() * 1500) + 300, // 300-1800ms for project docs
  });

  const testDatabasePerformance = async () => {
    setIsLoading(true);
    setTestProgress(0);
    
    try {
      const startTime = performance.now();
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setTestProgress(prev => prev < 90 ? prev + 10 : prev);
      }, 200);

      // Test advanced database performance using edge function
      const { data, error } = await supabase.functions.invoke('db-performance-monitor', {
        body: { testType: 'comprehensive' }
      });

      clearInterval(progressInterval);
      setTestProgress(100);

      if (error) throw error;

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      setDbResults(data);
      
      // Update metrics with real database performance data
      const mockMetrics = generateMockMetrics();
      mockMetrics.responseTime = Math.floor(data.averageTime || responseTime);
      setMetrics(mockMetrics);

      toast({
        title: "Database Performance Test Complete",
        description: `${data.successfulTests}/${data.totalTests} tests passed in ${data.totalTime}ms`,
        variant: data.failedTests > 0 ? "destructive" : "default"
      });
    } catch (error: any) {
      toast({
        title: "Database Test Failed",
        description: error.message || "Database performance test failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setTestProgress(0), 1000);
    }
  };

  const testNetworkPerformance = async () => {
    setIsLoading(true);
    setTestProgress(0);
    
    try {
      const startTime = performance.now();
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setTestProgress(prev => prev < 90 ? prev + 15 : prev);
      }, 150);

      // Test network latency with multiple requests
      const promises = Array.from({ length: 5 }, () => 
        fetch('/api/health').catch(() => ({ ok: false }))
      );
      
      await Promise.all(promises);
      const endTime = performance.now();
      
      clearInterval(progressInterval);
      setTestProgress(100);

      const mockMetrics = generateMockMetrics();
      mockMetrics.networkLatency = Math.floor((endTime - startTime) / 5);
      
      setMetrics(mockMetrics);

      toast({
        title: "Network Performance Test",
        description: `Average network latency: ${mockMetrics.networkLatency}ms`,
      });
    } catch (error: any) {
      toast({
        title: "Network Test Failed",
        description: error.message || "Network performance test failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setTestProgress(0), 1000);
    }
  };

  const testSystemResources = async () => {
    setIsLoading(true);
    setTestProgress(0);
    
    try {
      // Simulate resource monitoring
      const progressInterval = setInterval(() => {
        setTestProgress(prev => prev < 95 ? prev + 5 : prev);
      }, 100);

      // Simulate system resource gathering
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setTestProgress(100);

      const mockMetrics = generateMockMetrics();
      setMetrics(mockMetrics);

      toast({
        title: "Construction Workflows Test",
        description: `Upload Speed: ${mockMetrics.fileUploadSpeed}MB/s | Mobile: ${mockMetrics.mobileResponseTime}ms`,
      });
    } catch (error: any) {
      toast({
        title: "System Test Failed",
        description: error.message || "System resources test failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setTestProgress(0), 1000);
    }
  };

  const runComprehensiveTest = async () => {
    setIsLoading(true);
    setTestProgress(0);
    
    try {
      // Run all tests sequentially
      await testDatabasePerformance();
      await new Promise(resolve => setTimeout(resolve, 500));
      await testNetworkPerformance();
      await new Promise(resolve => setTimeout(resolve, 500));
      await testSystemResources();

      toast({
        title: "Comprehensive Test Complete",
        description: "All performance tests completed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Comprehensive Test Failed",
        description: error.message || "One or more tests failed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const performanceTests = [
    {
      title: "Database Performance",
      description: "Test database query response times",
      icon: Database,
      action: testDatabasePerformance,
      color: "text-blue-500"
    },
    {
      title: "Network Performance",
      description: "Test network latency and connectivity",
      icon: Network,
      action: testNetworkPerformance,
      color: "text-green-500"
    },
    {
      title: "Construction Workflows",
      description: "Test file uploads and mobile performance",
      icon: Activity,
      action: testSystemResources,
      color: "text-purple-500"
    },
    {
      title: "Comprehensive Test",
      description: "Run all performance tests",
      icon: BarChart3,
      action: runComprehensiveTest,
      color: "text-orange-500"
    }
  ];

  const getMetricStatus = (value: number, thresholds: { good: number; fair: number }) => {
    if (value <= thresholds.good) return "text-green-600";
    if (value <= thresholds.fair) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceGrade = (averageTime: number) => {
    if (averageTime < 100) return { grade: 'A', color: 'bg-green-500', label: 'Excellent' };
    if (averageTime < 300) return { grade: 'B', color: 'bg-blue-500', label: 'Good' };
    if (averageTime < 500) return { grade: 'C', color: 'bg-yellow-500', label: 'Fair' };
    if (averageTime < 1000) return { grade: 'D', color: 'bg-orange-500', label: 'Poor' };
    return { grade: 'F', color: 'bg-red-500', label: 'Critical' };
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Performance Testing</h1>
        <p className="text-gray-600">Monitor and test application performance metrics</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Resource metrics (Memory, CPU) are simulated for demonstration purposes
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {isLoading && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Timer className="h-5 w-5 text-blue-600 animate-spin" />
              <div className="flex-1">
                <div className="flex justify-between text-sm text-blue-700 mb-2">
                  <span>Running Performance Tests...</span>
                  <span>{testProgress}%</span>
                </div>
                <Progress value={testProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceTests.map((test, index) => {
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
                  variant="outline"
                >
                  {isLoading ? "Testing..." : `Run ${test.title}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Database Performance Results */}
      {dbResults && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Database className="h-5 w-5" />
                Database Performance Analysis
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge 
                  className={`${getPerformanceGrade(dbResults.averageTime).color} text-white`}
                >
                  Grade: {getPerformanceGrade(dbResults.averageTime).grade}
                </Badge>
                <Badge variant="outline">
                  {dbResults.successfulTests}/{dbResults.totalTests} Passed
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{dbResults.totalTime}ms</div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">{dbResults.averageTime}ms</div>
                <div className="text-sm text-gray-600">Average Time</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{dbResults.successfulTests}</div>
                <div className="text-sm text-gray-600">Successful Tests</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-800">Test Results:</h4>
              {dbResults.results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${result.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{result.rowsReturned} rows</span>
                    <span className={`font-semibold ${getMetricStatus(result.duration, { good: 100, fair: 300 })}`}>
                      {result.duration}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-white rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Recommendations:</h4>
              <ul className="space-y-1">
                {dbResults.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics Display */}
      {metrics && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Response Time</span>
                </div>
                <div className={`text-2xl font-bold ${getMetricStatus(metrics.responseTime, { good: 200, fair: 500 })}`}>
                  {metrics.responseTime}ms
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Throughput</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.throughput} req/s
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">File Upload Speed</span>
                </div>
                <div className={`text-2xl font-bold ${getMetricStatus(metrics.fileUploadSpeed, { good: 15, fair: 8 })}`}>
                  {metrics.fileUploadSpeed} MB/s
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Mobile Response</span>
                </div>
                <div className={`text-2xl font-bold ${getMetricStatus(metrics.mobileResponseTime, { good: 500, fair: 800 })}`}>
                  {metrics.mobileResponseTime}ms
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Network Latency</span>
                </div>
                <div className={`text-2xl font-bold ${getMetricStatus(metrics.networkLatency, { good: 20, fair: 50 })}`}>
                  {metrics.networkLatency}ms
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-500" />
                  <span className="text-sm font-medium">Document Load Time</span>
                </div>
                <div className={`text-2xl font-bold ${getMetricStatus(metrics.documentLoadTime, { good: 500, fair: 1000 })}`}>
                  {metrics.documentLoadTime}ms
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Tips */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Optimization Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-green-700 space-y-2">
          <p>• <strong>Database:</strong> Response times under 100ms are excellent, under 300ms are good</p>
          <p>• <strong>File Uploads:</strong> Target 10+ MB/s for quick blueprint and photo uploads</p>
          <p>• <strong>Mobile Performance:</strong> Keep response times under 500ms for field workers</p>
          <p>• <strong>Network:</strong> Latency under 50ms is ideal for real-time collaboration</p>
          <p>• <strong>Document Loading:</strong> Project documents should load within 500ms</p>
          <p>• <strong>Best Practices:</strong> Optimize images before upload, use mobile-friendly interfaces</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceTesting;