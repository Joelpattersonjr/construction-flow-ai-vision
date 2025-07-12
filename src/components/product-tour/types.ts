export interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface ProductTourProps {
  isActive: boolean;
  onClose: () => void;
}