import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/services/subscriptionService';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  title?: string;
  description?: string;
}

export const UpgradeDialog = ({
  isOpen,
  onClose,
  feature,
  title = "Upgrade Your Plan",
  description = "Unlock advanced features with a Pro or Enterprise plan"
}: UpgradeDialogProps) => {
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const { upgradeSubscription, subscription } = useSubscription();
  const { toast } = useToast();

  const handleUpgrade = async (planId: 'basic' | 'premium' | 'professional' | 'enterprise') => {
    setIsUpgrading(planId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: planId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error creating checkout session',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsUpgrading(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'premium':
        return <Zap className="h-5 w-5 text-blue-600" />;
      case 'professional':
        return <Star className="h-5 w-5 text-indigo-600" />;
      case 'enterprise':
        return <Crown className="h-5 w-5 text-purple-600" />;
      default:
        return <Star className="h-5 w-5 text-gray-600" />;
    }
  };

  const isPlanCurrent = (planId: string) => {
    return subscription?.subscription_tier === planId;
  };

  const getUpgradablePlans = () => {
    const currentTier = subscription?.subscription_tier || 'basic';
    return SUBSCRIPTION_PLANS.filter(plan => {
      if (currentTier === 'trial') return plan.id !== 'trial';
      if (currentTier === 'basic') return ['premium', 'professional', 'enterprise'].includes(plan.id);
      if (currentTier === 'premium') return ['professional', 'enterprise'].includes(plan.id);
      if (currentTier === 'professional') return plan.id === 'enterprise';
      return false;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
            {feature && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Feature: {feature}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This feature requires a Pro or Enterprise subscription
                </p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.popular ? 'border-primary shadow-lg' : ''
              } ${
                isPlanCurrent(plan.id) ? 'bg-muted/50' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  {getPlanIcon(plan.id)}
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  {plan.name}
                  {isPlanCurrent(plan.id) && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </CardTitle>
                <div className="text-2xl font-bold text-primary">{plan.price}</div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Max versions: {plan.limits.max_versions_per_file === -1 ? 'Unlimited' : plan.limits.max_versions_per_file}</div>
                    <div>Max collaborators: {plan.limits.max_collaborators === -1 ? 'Unlimited' : plan.limits.max_collaborators}</div>
                    <div>Version history: {plan.limits.version_history_days === -1 ? 'Unlimited' : `${plan.limits.version_history_days} days`}</div>
                  </div>
                </div>

                {plan.id !== 'trial' && !isPlanCurrent(plan.id) && getUpgradablePlans().some(p => p.id === plan.id) && (
                  <Button
                    className="w-full mt-4"
                    onClick={() => handleUpgrade(plan.id as 'basic' | 'premium' | 'professional' | 'enterprise')}
                    disabled={isUpgrading !== null}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {isUpgrading === plan.id ? 'Upgrading...' : `Upgrade to ${plan.name}`}
                  </Button>
                )}

                {isPlanCurrent(plan.id) && (
                  <Button className="w-full mt-4" variant="secondary" disabled>
                    Current Plan
                  </Button>
                )}

                {plan.id === 'trial' && (
                  <Button className="w-full mt-4" variant="ghost" disabled>
                    Trial Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};