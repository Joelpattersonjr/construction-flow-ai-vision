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
  disabled?: boolean;
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
  disabled = false,
}) => {
  return (
    <Card className={`relative border-2 ${isPopular ? 'border-primary' : 'hover:border-primary'} transition-colors`}>
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
          className="w-full mt-4 group relative overflow-hidden bg-black text-white border-black hover:bg-black hover:text-white" 
          onClick={onClick}
          disabled={disabled}
          variant={buttonVariant}
        >
          <span className="relative z-10">{buttonText}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
        </Button>
      </CardContent>
    </Card>
  );
};