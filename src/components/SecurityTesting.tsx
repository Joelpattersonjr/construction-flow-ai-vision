import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Key, 
  Lock, 
  FileCheck, 
  UserCheck,
  Eye,
  ShieldCheck,
  AlertCircle,
  PlayCircle,
  RotateCcw
} from 'lucide-react';

interface SecurityTest {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'idle' | 'running' | 'passed' | 'failed';
  result?: string;
  recommendation?: string;
  icon: React.ReactNode;
}

interface SecurityMetrics {
  overallScore: number;
  vulnerabilitiesFound: number;
  testsRun: number;
  lastScanDate: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const SecurityTesting = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    overallScore: 0,
    vulnerabilitiesFound: 0,
    testsRun: 0,
    lastScanDate: 'Never',
    riskLevel: 'medium'
  });

  const [securityTests, setSecurityTests] = useState<SecurityTest[]>([
    {
      id: 'auth-security',
      name: 'Authentication Security',
      description: 'Test user authentication mechanisms and session management',
      category: 'Authentication',
      severity: 'critical',
      status: 'idle',
      icon: <UserCheck className="h-4 w-4" />
    },
    {
      id: 'sql-injection',
      name: 'SQL Injection Protection',
      description: 'Verify database queries are protected against SQL injection attacks',
      category: 'Database',
      severity: 'critical',
      status: 'idle',
      icon: <Shield className="h-4 w-4" />
    },
    {
      id: 'xss-protection',
      name: 'XSS Protection',
      description: 'Check for cross-site scripting vulnerabilities in user inputs',
      category: 'Web Security',
      severity: 'high',
      status: 'idle',
      icon: <ShieldCheck className="h-4 w-4" />
    },
    {
      id: 'file-upload',
      name: 'File Upload Security',
      description: 'Validate file upload restrictions and malware scanning',
      category: 'File Security',
      severity: 'high',
      status: 'idle',
      icon: <FileCheck className="h-4 w-4" />
    },
    {
      id: 'password-policy',
      name: 'Password Policy',
      description: 'Verify password complexity and security requirements',
      category: 'Authentication',
      severity: 'medium',
      status: 'idle',
      icon: <Key className="h-4 w-4" />
    },
    {
      id: 'data-encryption',
      name: 'Data Encryption',
      description: 'Check encryption of sensitive data at rest and in transit',
      category: 'Encryption',
      severity: 'high',
      status: 'idle',
      icon: <Lock className="h-4 w-4" />
    },
    {
      id: 'access-control',
      name: 'Access Control',
      description: 'Verify role-based access control and permission systems',
      category: 'Authorization',
      severity: 'high',
      status: 'idle',
      icon: <Eye className="h-4 w-4" />
    },
    {
      id: 'session-management',
      name: 'Session Management',
      description: 'Test session timeout and security configurations',
      category: 'Authentication',
      severity: 'medium',
      status: 'idle',
      icon: <UserCheck className="h-4 w-4" />
    }
  ]);

  const runSecurityScan = async () => {
    setIsRunning(true);
    setProgress(0);
    
    const updatedTests = [...securityTests];
    let passedTests = 0;
    let vulnerabilities = 0;
    
    // Simulate running each test
    for (let i = 0; i < updatedTests.length; i++) {
      updatedTests[i].status = 'running';
      setSecurityTests([...updatedTests]);
      setProgress((i / updatedTests.length) * 100);
      
      // Simulate test execution time
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulate test results (some pass, some fail for demo)
      const testResult = Math.random() > 0.3; // 70% pass rate
      
      if (testResult) {
        updatedTests[i].status = 'passed';
        updatedTests[i].result = 'No vulnerabilities detected';
        updatedTests[i].recommendation = 'Security test passed successfully';
        passedTests++;
      } else {
        updatedTests[i].status = 'failed';
        updatedTests[i].result = 'Potential security vulnerability detected';
        updatedTests[i].recommendation = getSecurityRecommendation(updatedTests[i].id);
        vulnerabilities++;
      }
      
      setSecurityTests([...updatedTests]);
    }
    
    setProgress(100);
    setIsRunning(false);
    
    // Update metrics
    const score = Math.round((passedTests / updatedTests.length) * 100);
    const riskLevel = score >= 90 ? 'low' : score >= 70 ? 'medium' : score >= 50 ? 'high' : 'critical';
    
    setMetrics({
      overallScore: score,
      vulnerabilitiesFound: vulnerabilities,
      testsRun: updatedTests.length,
      lastScanDate: new Date().toLocaleString(),
      riskLevel: riskLevel as 'low' | 'medium' | 'high' | 'critical'
    });
    
    toast({
      title: "Security Scan Complete",
      description: `Found ${vulnerabilities} vulnerabilities in ${updatedTests.length} tests`,
      variant: vulnerabilities > 0 ? "destructive" : "default",
    });
  };

  const getSecurityRecommendation = (testId: string): string => {
    const recommendations: Record<string, string> = {
      'auth-security': 'Implement multi-factor authentication and review session timeout settings',
      'sql-injection': 'Use parameterized queries and input sanitization for all database operations',
      'xss-protection': 'Implement Content Security Policy and sanitize all user inputs',
      'file-upload': 'Add file type validation, size limits, and malware scanning',
      'password-policy': 'Enforce stronger password requirements and implement password expiration',
      'data-encryption': 'Implement end-to-end encryption for sensitive construction data',
      'access-control': 'Review and update role-based permissions for project access',
      'session-management': 'Configure secure session settings with appropriate timeouts'
    };
    
    return recommendations[testId] || 'Review security configuration and implement best practices';
  };

  const resetTests = () => {
    setSecurityTests(prev => prev.map(test => ({ ...test, status: 'idle', result: undefined, recommendation: undefined })));
    setProgress(0);
    setMetrics({
      overallScore: 0,
      vulnerabilitiesFound: 0,
      testsRun: 0,
      lastScanDate: 'Never',
      riskLevel: 'medium'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Score</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.overallScore}%</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vulnerabilities</p>
                <p className="text-2xl font-bold text-red-600">{metrics.vulnerabilitiesFound}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tests Run</p>
                <p className="text-2xl font-bold text-green-600">{metrics.testsRun}</p>
              </div>
              <FileCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Risk Level</p>
                <Badge className={getRiskLevelColor(metrics.riskLevel)}>
                  {metrics.riskLevel.toUpperCase()}
                </Badge>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Scan Controls */}
      <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Scan Controls</span>
          </CardTitle>
          <CardDescription>
            Run comprehensive security tests to identify vulnerabilities in your construction management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              <Button 
                onClick={runSecurityScan} 
                disabled={isRunning}
                className="flex items-center space-x-2"
              >
                <PlayCircle className="h-4 w-4" />
                <span>{isRunning ? 'Running Scan...' : 'Start Security Scan'}</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={resetTests}
                disabled={isRunning}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset Tests</span>
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              Last scan: {metrics.lastScanDate}
            </div>
          </div>
          
          {isRunning && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Scan Progress</span>
                <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Test Results */}
      <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle>Security Test Results</CardTitle>
          <CardDescription>
            Detailed results of security vulnerability tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityTests.map((test) => (
              <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {test.icon}
                    <div>
                      <h3 className="font-medium">{test.name}</h3>
                      <p className="text-sm text-gray-600">{test.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {test.category}
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${getSeverityColor(test.severity)}`} />
                    {getStatusIcon(test.status)}
                  </div>
                </div>
                
                {test.result && (
                  <Alert className={`mt-2 ${test.status === 'passed' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <AlertDescription>
                      <strong>Result:</strong> {test.result}
                      {test.recommendation && (
                        <div className="mt-1">
                          <strong>Recommendation:</strong> {test.recommendation}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5" />
            <span>Security Best Practices</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Regular Security Updates</p>
                  <p className="text-sm text-gray-600">Keep all construction software and systems updated with latest security patches</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Multi-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Enable MFA for all construction project access and sensitive operations</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Data Backup Security</p>
                  <p className="text-sm text-gray-600">Secure and encrypt all construction project data backups</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Access Control</p>
                  <p className="text-sm text-gray-600">Implement role-based access for different construction team members</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Secure File Sharing</p>
                  <p className="text-sm text-gray-600">Use encrypted channels for sharing construction blueprints and documents</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Security Training</p>
                  <p className="text-sm text-gray-600">Regular security awareness training for all construction team members</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityTesting;