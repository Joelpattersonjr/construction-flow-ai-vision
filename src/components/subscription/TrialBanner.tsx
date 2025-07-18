import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, Rocket } from 'lucide-react';
import { SubscriptionInfo } from '@/services/subscriptionService';
import { useNavigate } from 'react-router-dom';

interface TrialBannerProps {
  subscriptionInfo: SubscriptionInfo;
  onUpgrade?: () => void;
}

export const TrialBanner = ({ subscriptionInfo, onUpgrade }: TrialBannerProps) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState('');

  const trialInfo = subscriptionInfo.trial_info;
  
  // Don't show banner if not on trial or trial expired
  if (!trialInfo?.is_trial_active) {
    return null;
  }

  useEffect(() => {
    if (!trialInfo?.trial_ends_at) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const endDate = new Date(trialInfo.trial_ends_at!);
      const timeDiff = endDate.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        setTimeLeft('Trial expired');
        return;
      }
      
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        setTimeLeft(`${days} day${days === 1 ? '' : 's'} left`);
      } else {
        setTimeLeft(`${hours} hour${hours === 1 ? '' : 's'} left`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000 * 60 * 60); // Update every hour

    return () => clearInterval(interval);
  }, [trialInfo?.trial_ends_at]);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Scroll to pricing section on landing page
      navigate('/#pricing');
    }
  };

  const getUrgencyColor = () => {
    const daysLeft = trialInfo?.days_remaining || 0;
    if (daysLeft <= 3) return 'destructive';
    if (daysLeft <= 7) return 'outline';
    return 'secondary';
  };

  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <Badge variant="secondary" className="font-semibold">
                30-Day Trial
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Badge variant={getUrgencyColor()}>
                {timeLeft || `${trialInfo?.days_remaining || 0} days left`}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              You're enjoying all premium features for free!
            </div>
            
            <Button onClick={handleUpgrade} className="gap-2">
              <Rocket className="h-4 w-4" />
              Upgrade Now
            </Button>
          </div>
        </div>

        {trialInfo?.days_remaining && trialInfo.days_remaining <= 7 && (
          <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <strong>Trial ending soon!</strong> Don't lose access to collaboration features, version control, and more. 
              Upgrade now to continue with uninterrupted service.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};