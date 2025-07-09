import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Settings,
  Target,
  Activity
} from 'lucide-react';

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  profiles: {
    full_name: string;
    job_title: string;
  };
  created_at?: string;
}

interface PermissionTemplate {
  id: string;
  name: string;
  description?: string;
  role: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  is_default: boolean;
  usage_count?: number;
}

interface RoleAnalyticsProps {
  members: ProjectMember[];
  templates: PermissionTemplate[];
  projectId: string;
}

interface RoleDistribution {
  role: string;
  count: number;
  percentage: number;
}

interface PermissionAnalysis {
  permission: string;
  granted: number;
  denied: number;
  percentage: number;
}

interface RoleConflict {
  type: 'over_privileged' | 'under_privileged' | 'inconsistent';
  member: string;
  description: string;
  suggestion: string;
}

const RoleAnalytics: React.FC<RoleAnalyticsProps> = ({
  members,
  templates,
  projectId,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Calculate role distribution
  const roleDistribution = useMemo(() => {
    const roleCounts = members.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = members.length;
    
    return Object.entries(roleCounts).map(([role, count]) => ({
      role,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }, [members]);

  // Calculate permission analysis
  const permissionAnalysis = useMemo(() => {
    const total = members.length;
    
    return ['read', 'write', 'admin'].map(permission => {
      const granted = members.filter(m => m.permissions[permission as keyof typeof m.permissions]).length;
      const denied = total - granted;
      
      return {
        permission,
        granted,
        denied,
        percentage: Math.round((granted / total) * 100)
      };
    });
  }, [members]);

  // Detect role conflicts and optimization opportunities
  const roleConflicts = useMemo(() => {
    const conflicts: RoleConflict[] = [];
    
    members.forEach(member => {
      const { role, permissions } = member;
      
      // Check for over-privileged users
      if (role === 'viewer' && (permissions.write || permissions.admin)) {
        conflicts.push({
          type: 'over_privileged',
          member: member.profiles.full_name,
          description: 'Viewer with write/admin permissions',
          suggestion: 'Consider upgrading to Member or Manager role'
        });
      }
      
      // Check for under-privileged users
      if (role === 'manager' && !permissions.admin) {
        conflicts.push({
          type: 'under_privileged',
          member: member.profiles.full_name,
          description: 'Manager without admin permissions',
          suggestion: 'Consider granting admin permissions or downgrading role'
        });
      }
      
      // Check for inconsistent permissions
      if (permissions.admin && !permissions.write) {
        conflicts.push({
          type: 'inconsistent',
          member: member.profiles.full_name,
          description: 'Admin access without write permissions',
          suggestion: 'Admin users should have write permissions'
        });
      }
    });
    
    return conflicts;
  }, [members]);

  // Template usage analysis
  const templateUsage = useMemo(() => {
    return templates.map(template => ({
      name: template.name,
      role: template.role,
      usage_count: template.usage_count || 0,
      is_default: template.is_default
    })).sort((a, b) => b.usage_count - a.usage_count);
  }, [templates]);

  // Get color for role
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner': return '#8B5CF6';
      case 'manager': return '#EF4444';
      case 'member': return '#3B82F6';
      case 'viewer': return '#6B7280';
      default: return '#10B981';
    }
  };

  // Get color for conflict type
  const getConflictColor = (type: string) => {
    switch (type) {
      case 'over_privileged': return 'bg-red-100 text-red-800';
      case 'under_privileged': return 'bg-yellow-100 text-yellow-800';
      case 'inconsistent': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'over_privileged': return AlertTriangle;
      case 'under_privileged': return Target;
      case 'inconsistent': return Settings;
      default: return Info;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role Conflicts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleConflicts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter(m => m.permissions.admin).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="distribution" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="distribution">Role Distribution</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
                <CardDescription>
                  Distribution of roles across team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ role, percentage }) => `${role} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getRoleColor(entry.role)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Breakdown</CardTitle>
                <CardDescription>
                  Detailed breakdown of each role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {roleDistribution.map(({ role, count, percentage }) => (
                  <div key={role} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getRoleColor(role) }}
                        />
                        <span className="font-medium capitalize">{role}</span>
                      </div>
                      <Badge variant="outline">{count} members</Badge>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Analysis</CardTitle>
              <CardDescription>
                Analysis of permission distribution across team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={permissionAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="permission" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="granted" fill="#10B981" name="Granted" />
                  <Bar dataKey="denied" fill="#EF4444" name="Denied" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {permissionAnalysis.map(({ permission, granted, denied, percentage }) => (
              <Card key={permission}>
                <CardHeader>
                  <CardTitle className="capitalize">{permission} Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Granted</span>
                      <span>{granted} ({percentage}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="text-sm text-gray-500">
                      {denied} members without {permission} access
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Role Conflicts & Optimization
              </CardTitle>
              <CardDescription>
                Detected conflicts and suggestions for role optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {roleConflicts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium text-green-900">No Conflicts Detected</h3>
                  <p className="text-green-600">All roles and permissions are properly configured.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {roleConflicts.map((conflict, index) => {
                    const ConflictIcon = getConflictIcon(conflict.type);
                    return (
                      <Alert key={index}>
                        <ConflictIcon className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{conflict.member}</span>
                              <Badge className={getConflictColor(conflict.type)}>
                                {conflict.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{conflict.description}</p>
                            <p className="text-sm font-medium text-blue-600">
                              💡 {conflict.suggestion}
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Usage</CardTitle>
              <CardDescription>
                Analysis of permission template usage and effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templateUsage.map(template => (
                  <div key={template.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{template.name}</span>
                        {template.is_default && (
                          <Badge variant="default">Default</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Role: {template.role}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{template.usage_count}</div>
                      <div className="text-sm text-gray-500">uses</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoleAnalytics;