import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PricingCardProps {
  title: string;
  price: string;
  features: string[];
  buttonText: string;
  buttonVariant?: 'default' | 'outline';
  isPopular?: boolean;
  subtitle?: string;
  onClick: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  features,
  buttonText,
  buttonVariant = 'default',
  isPopular = false,
  subtitle,
  onClick,
}) => {
  return (
    <Card className={`relative border-2 ${isPopular ? 'border-primary' : 'hover:border-primary'} transition-colors`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="text-2xl font-bold">{price}<span className="text-sm font-normal">/month</span></div>
        {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {features.map((feature, index) => (
            <li key={index}>• {feature}</li>
          ))}
        </ul>
        <Button 
          className="w-full mt-4" 
          variant={buttonVariant}
          onClick={onClick}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
};