import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Users, FolderOpen, HardDrive, FileText, GitBranch } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useState } from 'react';
import { SubscriptionUpgradeDialog } from './SubscriptionUpgradeDialog';

export const UsageDashboard = () => {
  const { subscription, loading } = useSubscription();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
          <CardDescription>Loading your subscription usage...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return null;
  }

  const { limits, usage, subscription_tier } = subscription;

  const formatLimit = (limit: number) => limit === -1 ? '∞' : limit.toString();
  const getProgressValue = (current: number, limit: number) => 
    limit === -1 ? 0 : Math.min((current / limit) * 100, 100);

  const getProgressColor = (current: number, limit: number) => {
    if (limit === -1) return '';
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 75) return 'bg-warning';
    return '';
  };

  const usageItems = [
    {
      icon: FolderOpen,
      label: 'Projects',
      current: usage.current_projects,
      limit: limits.max_projects,
      description: 'Active construction projects'
    },
    {
      icon: Users,
      label: 'Team Members',
      current: usage.current_users,
      limit: limits.max_users,
      description: 'Users in your organization'
    },
    {
      icon: HardDrive,
      label: 'Storage',
      current: Math.round(usage.current_storage_gb * 100) / 100,
      limit: limits.max_storage_gb,
      description: 'Document and file storage',
      unit: 'GB'
    },
    {
      icon: FileText,
      label: 'Files per Project',
      current: 0, // This would need to be calculated differently
      limit: limits.max_files_per_project,
      description: 'Maximum files per project'
    },
    {
      icon: GitBranch,
      label: 'File Versions',
      current: 0, // This would need to be calculated differently
      limit: limits.max_versions_per_file,
      description: 'Version history per file'
    }
  ];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>Your current plan usage and limits</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {subscription_tier} Plan
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpgradeDialog(true)}
              className="gap-2"
            >
              <Crown className="h-4 w-4" />
              Upgrade
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {usageItems.map((item) => {
              const Icon = item.icon;
              const progressValue = getProgressValue(item.current, item.limit);
              const progressColor = getProgressColor(item.current, item.limit);
              
              return (
                <div key={item.label} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.description}</span>
                      <span className="font-medium">
                        {item.current}{item.unit || ''} / {formatLimit(item.limit)}{item.unit || ''}
                      </span>
                    </div>
                    
                    {item.limit !== -1 && (
                      <Progress 
                        value={progressValue} 
                        className={`h-2 ${progressColor}`}
                      />
                    )}
                    
                    {item.limit !== -1 && progressValue >= 90 && (
                      <p className="text-xs text-destructive">
                        Approaching limit - consider upgrading
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <SubscriptionUpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        feature="Get higher limits and unlock advanced features"
        requiredTier="pro"
      />
    </>
  );
};