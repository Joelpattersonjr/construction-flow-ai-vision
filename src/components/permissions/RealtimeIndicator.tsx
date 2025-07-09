import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Activity, Wifi, WifiOff } from 'lucide-react';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastUpdate?: Date;
  className?: string;
}

const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({ 
  isConnected, 
  lastUpdate, 
  className = "" 
}) => {
  const [showPulse, setShowPulse] = useState(false);

  // Show pulse animation when there's an update
  useEffect(() => {
    if (lastUpdate) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  if (!isConnected) {
    return (
      <Badge variant="secondary" className={`flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-200 ${className}`}>
        <WifiOff className="h-3 w-3" />
        Offline
      </Badge>
    );
  }

  return (
    <Badge 
      variant="default" 
      className={`flex items-center gap-1 bg-green-100 text-green-800 border-green-200 transition-all duration-300 ${
        showPulse ? 'animate-pulse scale-105' : ''
      } ${className}`}
    >
      {showPulse ? (
        <Activity className="h-3 w-3 animate-pulse" />
      ) : (
        <Wifi className="h-3 w-3" />
      )}
      {showPulse ? 'Updating...' : 'Live'}
    </Badge>
  );
};

export default RealtimeIndicator;