import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ currentPath, onNavigate }) => {
  const pathSegments = currentPath ? currentPath.split('/').filter(Boolean) : [];

  const handleNavigate = (index: number) => {
    if (index === -1) {
      onNavigate(''); // Root
    } else {
      const newPath = pathSegments.slice(0, index + 1).join('/');
      onNavigate(newPath);
    }
  };

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleNavigate(-1)}
        className="h-auto p-1 hover:bg-gray-100"
      >
        <Home className="h-4 w-4" />
      </Button>
      
      {pathSegments.length > 0 && (
        <ChevronRight className="h-4 w-4 text-gray-400" />
      )}
      
      {pathSegments.map((segment, index) => (
        <React.Fragment key={index}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigate(index)}
            className="h-auto p-1 hover:bg-gray-100 font-medium"
          >
            {segment}
          </Button>
          {index < pathSegments.length - 1 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;