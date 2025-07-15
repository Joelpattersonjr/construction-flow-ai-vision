import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Clock,
  ChevronRight,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileProjectCardProps {
  project: {
    id: string;
    name: string;
    status: string;
    address?: string;
    start_date?: string;
    end_date?: string;
    owner_name?: string;
  };
  taskCount?: number;
  teamCount?: number;
  onSelect: (projectId: string) => void;
  className?: string;
}

export const MobileProjectCard: React.FC<MobileProjectCardProps> = ({
  project,
  taskCount = 0,
  teamCount = 0,
  onSelect,
  className
}) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'in_progress':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'planning':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]",
        "border-l-4 border-l-primary",
        className
      )}
      onClick={() => onSelect(project.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate">
              {project.name || 'Untitled Project'}
            </h3>
            {project.owner_name && (
              <p className="text-sm text-muted-foreground mt-1">
                Owner: {project.owner_name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Badge className={cn("text-xs", getStatusColor(project.status || ''))}>
              <Circle className="w-2 h-2 mr-1 fill-current" />
              {project.status || 'Unknown'}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {project.address && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
            <span className="truncate">{project.address}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formatDate(project.start_date)}</span>
          </div>
          {project.end_date && (
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatDate(project.end_date)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Users className="h-3 w-3 mr-1" />
              <span>{teamCount} members</span>
            </div>
            <div className="flex items-center">
              <Circle className="h-3 w-3 mr-1" />
              <span>{taskCount} tasks</span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(project.id);
            }}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};