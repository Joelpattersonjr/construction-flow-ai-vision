import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeDialog } from './UpgradeDialog';
import { SubscriptionService } from '@/services/subscriptionService';

interface FeatureGateProps {
  feature: 'version_control' | 'collaboration' | 'advanced_analytics' | 'time_tracking';
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  upgradeMessage?: string;
}

export const FeatureGate = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  upgradeMessage
}: FeatureGateProps) => {
  const { isFeatureEnabled, subscription, loading } = useSubscription();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasAccess = isFeatureEnabled(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const currentTier = subscription?.subscription_tier || 'free';
  const featureDescription = SubscriptionService.getFeatureDescription(feature);

  return (
    <>
      <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <Crown className="h-6 w-6 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Premium Feature</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {upgradeMessage || featureDescription}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline">Current: {currentTier}</Badge>
          <Badge>Required: {feature === 'time_tracking' ? 'Enterprise' : 'Pro or Enterprise'}</Badge>
        </div>

        <Button
          onClick={() => setShowUpgradeDialog(true)}
          className="gap-2"
        >
          <Crown className="h-4 w-4" />
          Upgrade to unlock
        </Button>
      </div>

      <UpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        feature={featureDescription}
        title="Upgrade to Access This Feature"
        description={upgradeMessage || `${featureDescription} is available on Pro and Enterprise plans.`}
      />
    </>
  );
};