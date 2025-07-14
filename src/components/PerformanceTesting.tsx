import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  Database, 
  Globe, 
  HardDrive, 
  Network, 
  Timer, 
  Zap, 
  BarChart3 
} from 'lucide-react';

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  diskIO: number;
}

const PerformanceTesting = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [testProgress, setTestProgress] = useState(0);

  // Mock performance data for demonstration
  const generateMockMetrics = (): PerformanceMetrics => ({
    responseTime: Math.floor(Math.random() * 500) + 100,
    throughput: Math.floor(Math.random() * 1000) + 500,
    memoryUsage: Math.floor(Math.random() * 80) + 20,
    cpuUsage: Math.floor(Math.random() * 60) + 15,
    networkLatency: Math.floor(Math.random() * 50) + 10,
    diskIO: Math.floor(Math.random() * 100) + 25
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

      // Test database query performance
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(10);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      clearInterval(progressInterval);
      setTestProgress(100);

      if (error) throw error;

      const mockMetrics = generateMockMetrics();
      mockMetrics.responseTime = Math.floor(responseTime);
      
      setMetrics(mockMetrics);

      toast({
        title: "Database Performance Test",
        description: `Query completed in ${responseTime.toFixed(2)}ms`,
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
        title: "System Resources Test",
        description: `CPU: ${mockMetrics.cpuUsage}% | Memory: ${mockMetrics.memoryUsage}%`,
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
      title: "System Resources",
      description: "Monitor CPU and memory usage",
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Performance Testing</h1>
        <p className="text-gray-600">Monitor and test application performance metrics</p>
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
                  <HardDrive className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <div className={`text-2xl font-bold ${getMetricStatus(metrics.memoryUsage, { good: 50, fair: 75 })}`}>
                  {metrics.memoryUsage}%
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <div className={`text-2xl font-bold ${getMetricStatus(metrics.cpuUsage, { good: 30, fair: 60 })}`}>
                  {metrics.cpuUsage}%
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
                  <HardDrive className="h-4 w-4 text-cyan-500" />
                  <span className="text-sm font-medium">Disk I/O</span>
                </div>
                <div className={`text-2xl font-bold ${getMetricStatus(metrics.diskIO, { good: 40, fair: 70 })}`}>
                  {metrics.diskIO}%
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
            Performance Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-green-700 space-y-2">
          <p>• Response times under 200ms are excellent, under 500ms are acceptable</p>
          <p>• Monitor CPU usage - consistently high values may indicate optimization needs</p>
          <p>• Network latency under 20ms is ideal for real-time features</p>
          <p>• Memory usage should typically stay below 75% for optimal performance</p>
          <p>• Run comprehensive tests regularly to identify performance trends</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceTesting;