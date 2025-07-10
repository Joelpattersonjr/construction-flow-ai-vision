import { useState, useEffect } from 'react';
import { SubscriptionService, SubscriptionInfo } from '@/services/subscriptionService';
import { useToast } from '@/hooks/use-toast';

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const data = await SubscriptionService.getCurrentSubscription();
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  const hasFeature = (featureName: string): boolean => {
    return subscription?.subscription_features?.[featureName as keyof typeof subscription.subscription_features] || false;
  };

  const isFeatureEnabled = (featureName: 'version_control' | 'collaboration' | 'advanced_analytics'): boolean => {
    return hasFeature(featureName);
  };

  const upgradeSubscription = async (newTier: 'pro' | 'enterprise') => {
    try {
      const result = await SubscriptionService.upgradeSubscription(newTier);
      if (result.success) {
        toast({
          title: "Subscription upgraded",
          description: `Successfully upgraded to ${newTier} plan`,
        });
        await loadSubscription(); // Refresh subscription data
        return true;
      } else {
        toast({
          title: "Upgrade failed",
          description: result.error || "Failed to upgrade subscription",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const checkVersionLimit = async (documentId: string) => {
    return await SubscriptionService.checkVersionLimit(documentId);
  };

  const checkCollaboratorLimit = async (documentId: string) => {
    return await SubscriptionService.checkCollaboratorLimit(documentId);
  };

  return {
    subscription,
    loading,
    hasFeature,
    isFeatureEnabled,
    upgradeSubscription,
    checkVersionLimit,
    checkCollaboratorLimit,
    refresh: loadSubscription,
  };
};