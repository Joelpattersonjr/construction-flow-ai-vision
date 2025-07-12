import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<'loading' | 'free' | 'subscribed' | 'needs_subscription'>('loading');
  const [showSubscriptionSelection, setShowSubscriptionSelection] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        // If check fails, allow access (fallback)
        setSubscriptionStatus('free');
        return;
      }

      // Check if user has any subscription or if they're on free tier
      if (data?.subscribed) {
        setSubscriptionStatus('subscribed');
      } else {
        // Check if this is a new user who hasn't chosen a subscription yet
        const { data: profile } = await supabase
          .from('profiles')
          .select('updated_at')
          .single();
        
        if (profile) {
          const accountAge = Date.now() - new Date(profile.updated_at).getTime();
          const isNewUser = accountAge < 5 * 60 * 1000; // 5 minutes
          
          if (isNewUser) {
            setSubscriptionStatus('needs_subscription');
            setShowSubscriptionSelection(true);
          } else {
            // Existing user on free tier
            setSubscriptionStatus('free');
          }
        } else {
          setSubscriptionStatus('free');
        }
      }
    } catch (error) {
      console.error('Subscription check error:', error);
      setSubscriptionStatus('free');
    }
  };

  const handleSubscriptionChoice = async (tier: 'free' | 'pro' | 'enterprise') => {
    if (tier === 'free') {
      setSubscriptionStatus('free');
      setShowSubscriptionSelection(false);
      toast({
        title: "Welcome!",
        description: "You're now on the free plan. You can upgrade anytime from your profile.",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to checkout",
          description: "Complete your payment in the new tab to activate your subscription.",
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error creating checkout session',
        description: error.message || 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  if (subscriptionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  if (showSubscriptionSelection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-4xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Choose Your Plan</CardTitle>
            <CardDescription>
              Select a subscription plan to get started with ConexusPM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free Plan */}
              <Card className="relative border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">Free</CardTitle>
                  <div className="text-2xl font-bold">$0<span className="text-sm font-normal">/month</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Basic File Management</li>
                    <li>• 3 Projects</li>
                    <li>• 5 Team Members</li>
                    <li>• Basic Support</li>
                    <li>• Limited Storage (1GB)</li>
                  </ul>
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => handleSubscriptionChoice('free')}
                  >
                    Start Free
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="relative border-2 border-primary">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">Pro</CardTitle>
                  <div className="text-2xl font-bold">$99.99<span className="text-sm font-normal">/month</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Advanced File Management</li>
                    <li>• Unlimited Projects</li>
                    <li>• 50 Team Members</li>
                    <li>• Real-time Collaboration</li>
                    <li>• Version Control (50 versions)</li>
                    <li>• Priority Support</li>
                    <li>• Advanced Analytics</li>
                    <li>• 100GB Storage</li>
                  </ul>
                  <Button 
                    className="w-full mt-4"
                    onClick={() => handleSubscriptionChoice('pro')}
                  >
                    Choose Pro
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className="relative border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">Enterprise</CardTitle>
                  <div className="text-2xl font-bold">$199.99<span className="text-sm font-normal">/month</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Everything in Pro</li>
                    <li>• Unlimited Team Members</li>
                    <li>• Unlimited Storage</li>
                    <li>• Advanced Security</li>
                    <li>• Custom Integrations</li>
                    <li>• Dedicated Support</li>
                    <li>• Custom Branding</li>
                    <li>• SLA Guarantee</li>
                  </ul>
                  <Button 
                    className="w-full mt-4"
                    onClick={() => handleSubscriptionChoice('enterprise')}
                  >
                    Choose Enterprise
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 text-center">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowSubscriptionSelection(false);
                  setSubscriptionStatus('free');
                }}
              >
                Skip for now (Free Plan)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGate;
