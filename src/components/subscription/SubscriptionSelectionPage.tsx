import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PricingCard } from './PricingCard';

interface SubscriptionSelectionPageProps {
  onSubscriptionChoice: (tier: 'basic' | 'pro' | 'enterprise') => void;
  onSkip: () => void;
}

export const SubscriptionSelectionPage: React.FC<SubscriptionSelectionPageProps> = ({
  onSubscriptionChoice,
  onSkip,
}) => {
  const basicFeatures = [
    'Basic File Management',
    '3 Projects',
    '5 Team Members',
    'Basic Support',
    'Limited Storage (1GB)',
  ];

  const proFeatures = [
    'Advanced File Management',
    'Unlimited Projects',
    '50 Team Members',
    'Real-time Collaboration',
    'Version Control (50 versions)',
    'Priority Support',
    'Advanced Analytics',
    '100GB Storage',
  ];

  const enterpriseFeatures = [
    'Everything in Pro',
    'Unlimited Team Members',
    'Unlimited Storage',
    'Advanced Security',
    'Custom Integrations',
    'Dedicated Support',
    'Custom Branding',
    'SLA Guarantee',
  ];

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
            <PricingCard
              title="Basic"
              price="$69.99"
              subtitle="30-day free trial"
              features={basicFeatures}
              buttonText="Start 30-Day Trial"
              buttonVariant="outline"
              onClick={() => onSubscriptionChoice('basic')}
            />

            <PricingCard
              title="Pro"
              price="$99.99"
              features={proFeatures}
              buttonText="Choose Pro"
              isPopular={true}
              onClick={() => onSubscriptionChoice('pro')}
            />

            <PricingCard
              title="Enterprise"
              price="$199.99"
              features={enterpriseFeatures}
              buttonText="Choose Enterprise"
              onClick={() => onSubscriptionChoice('enterprise')}
            />
          </div>

          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={onSkip}>
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};