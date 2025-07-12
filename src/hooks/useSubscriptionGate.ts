import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type SubscriptionStatus = 'loading' | 'free' | 'subscribed' | 'needs_subscription';
type SubscriptionTier = 'basic' | 'pro' | 'enterprise';

export const useSubscriptionGate = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('loading');
  const [showSubscriptionSelection, setShowSubscriptionSelection] = useState(false);
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

  const handleSubscriptionChoice = async (tier: SubscriptionTier) => {
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

  const handleSkip = () => {
    setShowSubscriptionSelection(false);
    setSubscriptionStatus('free');
  };

  return {
    subscriptionStatus,
    showSubscriptionSelection,
    handleSubscriptionChoice,
    handleSkip,
  };
};
