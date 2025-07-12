import { TourStep } from './types';

export const tourSteps: TourStep[] = [
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