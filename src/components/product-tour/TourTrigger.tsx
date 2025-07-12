import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { ProductTour } from './ProductTour';

export function TourTrigger() {
  const [isActive, setIsActive] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsActive(true)}
        className="fixed bottom-4 left-4 z-50 shadow-lg"
      >
        <Play className="h-4 w-4 mr-2" />
        Take Tour
      </Button>
      
      <ProductTour isActive={isActive} onClose={() => setIsActive(false)} />
    </>
  );
}