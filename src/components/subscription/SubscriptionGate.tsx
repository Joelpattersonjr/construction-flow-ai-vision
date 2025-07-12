import React from 'react';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { LoadingState } from './LoadingState';
import { SubscriptionSelectionPage } from './SubscriptionSelectionPage';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ children }) => {
  const {
    subscriptionStatus,
    showSubscriptionSelection,
    handleSubscriptionChoice,
    handleSkip,
  } = useSubscriptionGate();

  if (subscriptionStatus === 'loading') {
    return <LoadingState />;
  }

  if (showSubscriptionSelection) {
    return (
      <SubscriptionSelectionPage
        onSubscriptionChoice={handleSubscriptionChoice}
        onSkip={handleSkip}
      />
    );
  }

  return <>{children}</>;
};

export default SubscriptionGate;