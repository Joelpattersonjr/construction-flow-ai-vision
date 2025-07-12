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
    <Card className={`relative border-2 ${isPopular ? 'border-primary' : 'hover:border-primary'} transition-colors ${isPopular ? 'mt-6' : ''}`}>
      {isPopular && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
          <span className="bg-primary text-primary-foreground text-xs px-4 py-2 rounded-full whitespace-nowrap shadow-lg">
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
        <button 
          onClick={onClick}
          className="group w-full text-lg py-4 font-semibold relative overflow-hidden mt-4 bg-primary text-primary-foreground rounded-md h-11 px-8 inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <span className="relative z-10">{buttonText}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
        </button>
      </CardContent>
    </Card>
  );
};