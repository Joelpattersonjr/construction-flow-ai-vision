import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ArrowLeft, ArrowRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    id: 'hero',
    title: 'Welcome to ProjectSync',
    content: 'Transform your project management with our comprehensive solution designed for modern teams.',
    target: '[data-tour="hero"]',
    position: 'bottom'
  },
  {
    id: 'features',
    title: 'Powerful Features',
    content: 'Discover our core features including task management, team collaboration, and real-time updates.',
    target: '[data-tour="features"]',
    position: 'top'
  },
  {
    id: 'testimonials',
    title: 'Customer Success',
    content: 'See what our customers say about their experience with ProjectSync.',
    target: '[data-tour="testimonials"]',
    position: 'top'
  },
  {
    id: 'pricing',
    title: 'Choose Your Plan',
    content: 'Select the perfect plan for your team size and requirements.',
    target: '[data-tour="pricing"]',
    position: 'top'
  }
];

interface ProductTourProps {
  isActive: boolean;
  onClose: () => void;
}

export function ProductTour({ isActive, onClose }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const updateTarget = () => {
      const target = document.querySelector(tourSteps[currentStep].target) as HTMLElement;
      setTargetElement(target);

      if (target) {
        // Only scroll on initial setup, not during scroll events to prevent feedback loop
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Initial setup with delay
    const timeout = setTimeout(updateTarget, 100);

    // Update spotlight position on scroll without triggering new scrolls
    const handleScroll = () => {
      const target = document.querySelector(tourSteps[currentStep].target) as HTMLElement;
      setTargetElement(target);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentStep, isActive]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTooltipPosition = () => {
    // Always center the tour card on screen for better stability during scrolling
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
  };

  if (!isActive) return null;

  const currentTourStep = tourSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 pointer-events-auto" style={{ zIndex: 9998 }} />
      
      {/* Spotlight effect */}
      {targetElement && (
        <div
          className="fixed pointer-events-none"
          style={{
            top: targetElement.getBoundingClientRect().top - 10,
            left: targetElement.getBoundingClientRect().left - 10,
            width: targetElement.getBoundingClientRect().width + 20,
            height: targetElement.getBoundingClientRect().height + 20,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            borderRadius: '8px',
            zIndex: 9999
          }}
        />
      )}

      {/* Tour Card */}
      <Card 
        className="fixed w-80 p-6 bg-card border shadow-2xl pointer-events-auto animate-scale-in"
        style={{
          ...getTooltipPosition(),
          zIndex: 10000
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{currentTourStep.title}</h3>
            <div className="text-sm text-muted-foreground mt-1">
              Step {currentStep + 1} of {tourSteps.length}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-muted-foreground mb-6">{currentTourStep.content}</p>

        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          <Button size="sm" onClick={handleNext}>
            {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
            {currentStep < tourSteps.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </Card>
    </>
  );
}

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