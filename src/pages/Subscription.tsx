import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSubscription } from '@/hooks/useSubscription';
import { PricingCard } from '@/components/subscription/PricingCard';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  CreditCard, 
  Calendar,
  Users,
  HardDrive,
  Shield,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Subscription() {
  const navigate = useNavigate();
  const { subscription, loading, upgradeSubscription } = useSubscription();
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const currentTier = subscription?.subscription_tier?.toLowerCase() || 'free';
  const subscriptionEnd = subscription?.subscription_expires_at;

  const handleUpgrade = async (newTier: 'basic' | 'premium' | 'professional' | 'enterprise') => {
    setUpgrading(newTier);
    try {
      const success = await upgradeSubscription(newTier);
      if (success) {
        toast({
          title: "Subscription Updated",
          description: `Successfully upgraded to ${newTier} plan!`,
        });
      }
    } catch (error) {
      toast({
        title: "Upgrade Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageBilling = () => {
    // TODO: Implement Stripe customer portal integration
    toast({
      title: "Coming Soon",
      description: "Billing management will be available soon.",
    });
  };

  const plans = [
    {
      id: 'basic',
      title: 'Basic',
      price: '$69.99',
      subtitle: 'Per month',
      features: [
        'Basic File Management',
        '5 Projects',
        '5 Team Members',
        'Basic Support',
        'Limited Storage (1GB)',
        'Email Support'
      ],
      popular: false
    },
    {
      id: 'premium',
      title: 'Premium',
      price: '$199.99',
      subtitle: 'Per month',
      features: [
        'Advanced File Management',
        '10 Projects',
        '50 Team Members',
        'Real-time Collaboration',
        'Version Control (50 versions)',
        'Priority Support',
        'Advanced Analytics',
        '100GB Storage'
      ],
      popular: true
    },
    {
      id: 'professional',
      title: 'Professional',
      price: '$399.99',
      subtitle: 'Per month',
      features: [
        'Everything in Premium',
        '20 Projects',
        '50 Team Members',
        'Advanced Integrations',
        'Custom Workflows',
        'Enhanced Security',
        '500GB Storage',
        'Phone Support'
      ],
      popular: false
    },
    {
      id: 'enterprise',
      title: 'Enterprise',
      price: '$499.99',
      subtitle: 'Per month',
      features: [
        'Everything in Professional',
        'Unlimited Projects',
        'Unlimited Team Members',
        'Unlimited Storage',
        'Advanced Security',
        'Custom Integrations',
        'Dedicated Support',
        'Custom Branding',
        'SLA Guarantee'
      ],
      popular: false
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Subscription Management</h1>
            <p className="text-muted-foreground">Manage your subscription plan and billing</p>
          </div>
        </div>

        {/* Current Subscription */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Current Subscription
            </CardTitle>
            <CardDescription>
              Your current plan and subscription details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">Current Plan</h3>
                    <Badge variant={currentTier === 'free' ? 'secondary' : 'default'} className="capitalize">
                      {currentTier}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {currentTier === 'free' 
                      ? 'You are currently on our free plan with limited features.'
                      : `You have access to all ${currentTier} plan features.`
                    }
                  </p>
                </div>

                {subscriptionEnd && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Next billing: {new Date(subscriptionEnd).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  {currentTier !== 'free' && (
                    <Button variant="outline" onClick={handleManageBilling}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Billing
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Current Plan Features</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {currentTier === 'free' ? '3 Members' :
                       currentTier === 'basic' ? '5 Members' :
                       currentTier === 'premium' ? '50 Members' :
                       'Unlimited Members'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {currentTier === 'free' ? '500MB Storage' :
                       currentTier === 'basic' ? '1GB Storage' :
                       currentTier === 'premium' ? '100GB Storage' :
                       currentTier === 'professional' ? '500GB Storage' :
                       'Unlimited Storage'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {currentTier === 'free' ? 'Basic Security' :
                       currentTier === 'basic' ? 'Basic Security' :
                       'Advanced Security'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {currentTier === 'free' ? 'Basic Features' :
                       currentTier === 'basic' ? 'Basic Features' :
                       'Advanced Features'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Choose the plan that best fits your team's needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => {
                const isCurrentPlan = plan.id === currentTier;
                const canUpgrade = plan.id !== currentTier;
                
                return (
                  <div key={plan.id} className="relative">
                    {plan.popular && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                        Most Popular
                      </Badge>
                    )}
                    <PricingCard
                      title={plan.title}
                      price={plan.price}
                      subtitle={plan.subtitle}
                      features={plan.features}
                      buttonText={
                        isCurrentPlan 
                          ? 'Current Plan' 
                          : upgrading === plan.id 
                            ? 'Upgrading...' 
                            : `Upgrade to ${plan.title}`
                      }
                      buttonVariant={isCurrentPlan ? 'outline' : 'default'}
                      isPopular={plan.popular}
                      onClick={() => canUpgrade && handleUpgrade(plan.id as any)}
                    />
                    {isCurrentPlan && (
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Separator className="my-8" />

            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Need a custom solution?</h3>
              <p className="text-muted-foreground">
                Contact our sales team for enterprise pricing and custom features tailored to your organization.
              </p>
              <Button variant="outline">
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}