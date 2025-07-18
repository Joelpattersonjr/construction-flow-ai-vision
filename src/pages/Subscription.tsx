import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSubscription } from '@/hooks/useSubscription';
import { PricingCard } from '@/components/subscription/PricingCard';
import { ContactSalesDialog } from '@/components/subscription/ContactSalesDialog';
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
  Bolt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Subscription() {
  const navigate = useNavigate();
  const { subscription, loading, upgradeSubscription } = useSubscription();
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [showContactSales, setShowContactSales] = useState(false);

  const currentTier = subscription?.subscription_tier?.toLowerCase() || 'free';
  const subscriptionEnd = subscription?.subscription_expires_at;

  const handleUpgrade = async (newTier: 'starter' | 'pro' | 'enterprise') => {
    if (newTier === 'enterprise') {
      setShowContactSales(true);
      return;
    }

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
      id: 'free',
      title: 'Free',
      price: 'Free',
      subtitle: 'Forever',
      features: [
        '3 Projects',
        '5 Team Members',
        '1 GB Storage',
        '100 Files per Project',
        '50 Tasks per Project',
        '5 File Versions',
        'Basic Support'
      ],
      popular: false
    },
    {
      id: 'starter',
      title: 'Starter',
      price: '$39.99',
      subtitle: 'Per month',
      features: [
        '10 Projects',
        '15 Team Members',
        '5 GB Storage',
        '500 Files per Project',
        '200 Tasks per Project',
        '20 File Versions',
        'Real-time Collaboration',
        'Basic Analytics',
        'Email Support'
      ],
      popular: false
    },
    {
      id: 'pro',
      title: 'Pro',
      price: '$69.99',
      subtitle: 'Per month',
      features: [
        '50 Projects',
        '50 Team Members',
        '25 GB Storage',
        '2,000 Files per Project',
        '1,000 Tasks per Project',
        '50 File Versions',
        'Advanced Collaboration',
        'Full Analytics Suite',
        'Priority Support',
        'Time Tracking'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      title: 'Enterprise',
      price: 'Custom',
      subtitle: 'Contact Sales',
      features: [
        'Unlimited Projects',
        'Unlimited Team Members',
        'Unlimited Storage',
        'Unlimited Files & Tasks',
        'Unlimited File Versions',
        'Advanced Security',
        'Custom Integrations',
        'Dedicated Support',
        'SLA Guarantee',
        'Custom Features'
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
                       {currentTier === 'free' ? '5 Members' :
                        currentTier === 'starter' ? '15 Members' :
                        currentTier === 'pro' ? '50 Members' :
                        'Unlimited Members'}
                     </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-muted-foreground" />
                     <span>
                       {currentTier === 'free' ? '1 GB Storage' :
                        currentTier === 'starter' ? '5 GB Storage' :
                        currentTier === 'pro' ? '25 GB Storage' :
                        'Unlimited Storage'}
                     </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {currentTier === 'free' ? 'Basic Security' :
                       'Advanced Security'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bolt className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {currentTier === 'free' ? 'Basic Features' :
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
                       <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10 bg-primary text-primary-foreground px-3 py-1 rounded-full shadow-lg">
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
                            : plan.id === 'enterprise' 
                              ? 'Contact Sales'
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

        <ContactSalesDialog 
          isOpen={showContactSales} 
          onClose={() => setShowContactSales(false)} 
        />
      </div>
    </div>
  );
}