import { supabase } from '@/integrations/supabase/client';

export interface SecurityTestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  details?: any;
}

export interface SecurityMetrics {
  overallScore: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  criticalIssues: number;
  highIssues: number;
}

export interface SecurityScanResponse {
  success: boolean;
  timestamp: string;
  metrics: SecurityMetrics;
  results: SecurityTestResult[];
  recommendations: string[];
  error?: string;
}

export class SecurityTestingService {
  static async runComprehensiveSecurityScan(): Promise<SecurityScanResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('security-scanner', {
        body: { testType: 'comprehensive' }
      });

      if (error) {
        throw new Error(error.message || 'Security scan failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Security scan returned error');
      }

      return data;
    } catch (error: any) {
      console.error('Security scan error:', error);
      throw new Error(error.message || 'Failed to perform security scan');
    }
  }

  static async runAuthenticationTest(): Promise<SecurityTestResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('security-scanner', {
        body: { testType: 'authentication' }
      });

      if (error) throw error;
      return data.results.filter((r: SecurityTestResult) => 
        r.test.toLowerCase().includes('authentication')
      );
    } catch (error: any) {
      console.error('Authentication test error:', error);
      return [{
        test: 'Authentication Security',
        status: 'fail',
        severity: 'critical',
        description: 'Failed to run authentication security test',
        recommendation: 'Check system configuration and try again'
      }];
    }
  }

  static async runDatabaseSecurityTest(): Promise<SecurityTestResult[]> {
    try {
      // Test basic database access patterns
      const results: SecurityTestResult[] = [];

      // Test 1: Check if we can access other companies' data (should fail)
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Not authenticated');

        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', userData.user.id)
          .single();

        if (!profile) throw new Error('Profile not found');

        // Try to access projects from a different company (should be blocked by RLS)
        const { data: otherProjects, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .neq('company_id', profile.company_id)
          .limit(1);

        if (projectError || !otherProjects || otherProjects.length === 0) {
          results.push({
            test: 'Database Isolation',
            status: 'pass',
            severity: 'critical',
            description: 'Row Level Security is properly preventing cross-company data access',
            recommendation: 'Continue monitoring database access patterns and RLS policy effectiveness'
          });
        } else {
          results.push({
            test: 'Database Isolation',
            status: 'fail',
            severity: 'critical',
            description: 'Potential data leak detected - can access other companies\' data',
            recommendation: 'URGENT: Review and fix Row Level Security policies immediately'
          });
        }
      } catch (error) {
        results.push({
          test: 'Database Isolation',
          status: 'warning',
          severity: 'medium',
          description: 'Could not verify database isolation (may be properly secured)',
          recommendation: 'Manually verify RLS policies are correctly configured'
        });
      }

      return results;
    } catch (error: any) {
      return [{
        test: 'Database Security',
        status: 'fail',
        severity: 'high',
        description: 'Failed to run database security test',
        recommendation: 'Check database configuration and access permissions'
      }];
    }
  }

  static async runFileUploadSecurityTest(): Promise<SecurityTestResult[]> {
    try {
      const results: SecurityTestResult[] = [];

      // Test storage bucket policies
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

      if (bucketsError) {
        results.push({
          test: 'File Upload Security',
          status: 'fail',
          severity: 'high',
          description: 'Unable to verify storage bucket configuration',
          recommendation: 'Check storage bucket setup and permissions'
        });
      } else {
        const protectedBuckets = ['project-documents', 'blueprints', 'task-attachments'];
        const publicBuckets = buckets.filter(b => b.public && protectedBuckets.includes(b.name));

        if (publicBuckets.length === 0) {
          results.push({
            test: 'File Upload Security',
            status: 'pass',
            severity: 'high',
            description: 'Sensitive file storage buckets are properly secured (non-public)',
            recommendation: 'Continue monitoring file upload patterns and implement file type restrictions'
          });
        } else {
          results.push({
            test: 'File Upload Security',
            status: 'fail',
            severity: 'high',
            description: `Sensitive storage buckets are public: ${publicBuckets.map(b => b.name).join(', ')}`,
            recommendation: 'Make sensitive storage buckets private and implement proper access controls'
          });
        }
      }

      return results;
    } catch (error: any) {
      return [{
        test: 'File Upload Security',
        status: 'fail',
        severity: 'medium',
        description: 'Failed to verify file upload security configuration',
        recommendation: 'Review storage bucket policies and file upload restrictions'
      }];
    }
  }

  static formatSecurityReport(scanResponse: SecurityScanResponse): string {
    const { metrics, results, recommendations } = scanResponse;
    
    let report = `# Security Scan Report\n\n`;
    report += `**Generated:** ${new Date(scanResponse.timestamp).toLocaleString()}\n`;
    report += `**Overall Score:** ${metrics.overallScore}%\n`;
    report += `**Risk Level:** ${metrics.overallRisk.toUpperCase()}\n\n`;

    report += `## Summary\n`;
    report += `- Total Tests: ${metrics.totalTests}\n`;
    report += `- Passed: ${metrics.passedTests}\n`;
    report += `- Failed: ${metrics.failedTests}\n`;
    report += `- Warnings: ${metrics.warningTests}\n`;
    report += `- Critical Issues: ${metrics.criticalIssues}\n`;
    report += `- High Priority Issues: ${metrics.highIssues}\n\n`;

    report += `## Test Results\n\n`;
    results.forEach((result, index) => {
      const statusIcon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      const severityBadge = `[${result.severity.toUpperCase()}]`;
      
      report += `### ${index + 1}. ${result.test} ${statusIcon} ${severityBadge}\n`;
      report += `**Description:** ${result.description}\n`;
      report += `**Recommendation:** ${result.recommendation}\n\n`;
    });

    report += `## Recommendations\n\n`;
    recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });

    return report;
  }

  static getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  static getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  }
}