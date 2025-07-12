import React, { useState } from 'react';
import { Crown, Check, Loader2 } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { SUBSCRIPTION_PLANS } from '@/services/subscriptionService';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionUpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requiredTier?: 'pro' | 'enterprise';
  feature?: string;
}

export const SubscriptionUpgradeDialog: React.FC<SubscriptionUpgradeDialogProps> = ({
  isOpen,
  onClose,
  requiredTier,
  feature,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpgrade = async (tier: 'pro' | 'enterprise') => {
    setLoading(tier);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier },
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
      setLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Upgrade Your Subscription
          </DialogTitle>
          {feature && (
            <p className="text-muted-foreground">
              {feature} requires a {requiredTier === 'enterprise' ? 'Enterprise' : 'Pro or Enterprise'} subscription.
            </p>
          )}
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4">
          {SUBSCRIPTION_PLANS.filter(plan => plan.id !== 'free').map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-primary' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  <span className="text-2xl font-bold">{plan.price}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(plan.id as 'pro' | 'enterprise')}
                  disabled={loading !== null}
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to {plan.name}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};