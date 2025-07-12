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
    console.log('ProductTour useEffect triggered, isActive:', isActive, 'currentStep:', currentStep);
    if (!isActive) return;

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(() => {
      const target = document.querySelector(tourSteps[currentStep].target) as HTMLElement;
      console.log('Looking for target:', tourSteps[currentStep].target, 'Found:', target);
      console.log('All elements with data-tour:', document.querySelectorAll('[data-tour]'));
      setTargetElement(target);

      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.style.position = 'relative';
        target.style.zIndex = '100';
        console.log('Target element styled successfully');
      } else {
        console.warn('Tour target not found:', tourSteps[currentStep].target);
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
      const target = document.querySelector(tourSteps[currentStep].target) as HTMLElement;
      if (target) {
        target.style.position = '';
        target.style.zIndex = '';
      }
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
    if (!targetElement) {
      // Fallback to center of screen if no target element
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const rect = targetElement.getBoundingClientRect();
    const step = tourSteps[currentStep];
    
    // Ensure the tooltip is always visible on screen
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const tooltipWidth = 320; // 80 * 4 = w-80
    const tooltipHeight = 200; // estimated height
    
    switch (step.position) {
      case 'top':
        const topPosition = rect.top - tooltipHeight - 20;
        return {
          top: Math.max(20, topPosition),
          left: Math.min(Math.max(20, rect.left + rect.width / 2), viewportWidth - tooltipWidth - 20),
          transform: 'translate(-50%, 0)'
        };
      case 'bottom':
        const bottomPosition = rect.bottom + 20;
        return {
          top: Math.min(bottomPosition, viewportHeight - tooltipHeight - 20),
          left: Math.min(Math.max(20, rect.left + rect.width / 2), viewportWidth - tooltipWidth - 20),
          transform: 'translate(-50%, 0)'
        };
      case 'left':
        return {
          top: Math.min(Math.max(20, rect.top + rect.height / 2), viewportHeight - tooltipHeight - 20),
          left: Math.max(20, rect.left - tooltipWidth - 20),
          transform: 'translate(0, -50%)'
        };
      case 'right':
        return {
          top: Math.min(Math.max(20, rect.top + rect.height / 2), viewportHeight - tooltipHeight - 20),
          left: Math.min(rect.right + 20, viewportWidth - tooltipWidth - 20),
          transform: 'translate(0, -50%)'
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };

  if (!isActive) return null;

  console.log('ProductTour is active, currentStep:', currentStep);
  console.log('targetElement:', targetElement);
  console.log('tooltipPosition:', getTooltipPosition());

  const currentTourStep = tourSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 pointer-events-auto" style={{ zIndex: 50 }} />
      
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
            zIndex: 51
          }}
        />
      )}

      {/* Tour Card - DEBUG: Added red border to make it visible */}
      <Card 
        className="fixed w-80 p-6 bg-white border-4 border-red-500 pointer-events-auto shadow-2xl"
        style={{
          ...getTooltipPosition(),
          zIndex: 52
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