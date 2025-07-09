import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Users, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LiveUpdateNotificationProps {
  show: boolean;
  updateType: 'member' | 'audit';
  onDismiss: () => void;
  lastUpdate?: Date;
}

const LiveUpdateNotification: React.FC<LiveUpdateNotificationProps> = ({
  show,
  updateType,
  onDismiss,
  lastUpdate
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for animation to complete
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  const getIcon = () => {
    switch (updateType) {
      case 'member':
        return <Users className="h-4 w-4" />;
      case 'audit':
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getMessage = () => {
    switch (updateType) {
      case 'member':
        return 'Team members updated';
      case 'audit':
        return 'New activity logged';
      default:
        return 'Real-time update received';
    }
  };

  return (
    <div 
      className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <Card className="p-4 shadow-lg border-l-4 border-l-green-500 bg-white">
        <div className="flex items-center justify-between space-x-3">
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              {getIcon()}
            </Badge>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {getMessage()}
              </p>
              {lastUpdate && (
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(lastUpdate, { addSuffix: true })}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
};

export default LiveUpdateNotification;