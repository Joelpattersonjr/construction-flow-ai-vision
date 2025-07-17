import React, { ReactNode, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Crown, AlertCircle } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionUpgradeDialog } from './SubscriptionUpgradeDialog';
import { SubscriptionService } from '@/services/subscriptionService';

interface LimitGateProps {
  limitType: 'projects' | 'users' | 'storage' | 'versions' | 'collaborators';
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  customMessage?: string;
}

export const LimitGate = ({
  limitType,
  children,
  fallback,
  showUpgradePrompt = true,
  customMessage
}: LimitGateProps) => {
  const { subscription, loading } = useSubscription();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [limitCheck, setLimitCheck] = useState<{ allowed: boolean; current: number; limit: number } | null>(null);

  // Check limits on mount
  useEffect(() => {
    const checkLimit = async () => {
      if (!subscription) return;

      let result;
      switch (limitType) {
        case 'projects':
          result = await SubscriptionService.checkProjectLimit();
          break;
        case 'users':
          result = await SubscriptionService.checkUserLimit();
          break;
        case 'storage':
          result = await SubscriptionService.checkStorageLimit();
          break;
        default:
          return;
      }
      setLimitCheck(result);
    };

    checkLimit();
  }, [limitType, subscription]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!limitCheck) {
    return <>{children}</>;
  }

  const { allowed, current, limit } = limitCheck;

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const currentTier = subscription?.subscription_tier || 'free';
  const limitLabels = {
    projects: 'Projects',
    users: 'Team Members',
    storage: 'Storage (GB)',
    versions: 'File Versions',
    collaborators: 'Collaborators'
  };

  const upgradeMessages = {
    projects: 'Create unlimited projects and manage complex construction workflows',
    users: 'Add unlimited team members and scale your construction team',
    storage: 'Get unlimited storage for all your construction documents and files',
    versions: 'Keep unlimited file versions with complete version history',
    collaborators: 'Collaborate with unlimited team members on your projects'
  };

  const progressValue = limit === -1 ? 0 : (current / limit) * 100;

  return (
    <>
      <div className="border-2 border-dashed border-destructive/30 rounded-lg p-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-destructive">Limit Reached</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {customMessage || `You've reached your ${limitLabels[limitType].toLowerCase()} limit.`}
          </p>
        </div>

        {limit !== -1 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{limitLabels[limitType]}</span>
              <span>{current}/{limit === -1 ? '∞' : limit}</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge variant="outline">Current: {currentTier}</Badge>
          <Badge>Upgrade for more {limitLabels[limitType].toLowerCase()}</Badge>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {upgradeMessages[limitType]}
          </p>
          <Button
            onClick={() => setShowUpgradeDialog(true)}
            className="gap-2"
          >
            <Crown className="h-4 w-4" />
            Upgrade Plan
          </Button>
        </div>
      </div>

      <SubscriptionUpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        feature={upgradeMessages[limitType]}
        requiredTier="professional"
      />
    </>
  );
};