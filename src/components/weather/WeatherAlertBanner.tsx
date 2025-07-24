import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Thermometer, Wind, Cloud, Clock, X, Check } from 'lucide-react';
import { useWeatherAlerts, WeatherAlert } from '@/hooks/useWeatherAlerts';
import { cn } from '@/lib/utils';

interface WeatherAlertBannerProps {
  projectId: string;
  className?: string;
}

const getAlertIcon = (alertType: WeatherAlert['alert_type']) => {
  switch (alertType) {
    case 'temperature_extreme':
      return Thermometer;
    case 'high_wind':
      return Wind;
    case 'severe_weather':
      return Cloud;
    case 'data_stale':
      return Clock;
    default:
      return AlertTriangle;
  }
};

const getSeverityColor = (severity: WeatherAlert['severity']) => {
  switch (severity) {
    case 'critical':
      return 'border-destructive bg-destructive/10 text-destructive';
    case 'high':
      return 'border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400';
    case 'medium':
      return 'border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    case 'low':
      return 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400';
    default:
      return 'border-gray-500 bg-gray-500/10 text-gray-700 dark:text-gray-400';
  }
};

const AlertItem: React.FC<{ 
  alert: WeatherAlert; 
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
}> = ({ alert, onAcknowledge, onDismiss }) => {
  const IconComponent = getAlertIcon(alert.alert_type);
  const severityColor = getSeverityColor(alert.severity);

  return (
    <Alert className={cn('animate-fade-in', severityColor)}>
      <IconComponent className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{alert.message}</span>
          <Badge variant="outline" className="text-xs">
            {alert.severity}
          </Badge>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {!alert.acknowledged_at && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAcknowledge(alert.id)}
              className="h-6 px-2 text-xs"
              title="Acknowledge alert"
            >
              <Check className="h-3 w-3 mr-1" />
              Ack
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(alert.id)}
            className="h-6 w-6 p-0"
            title="Dismiss alert"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export const WeatherAlertBanner: React.FC<WeatherAlertBannerProps> = ({ 
  projectId, 
  className 
}) => {
  const { alerts, loading, acknowledgeAlert, dismissAlert } = useWeatherAlerts(projectId);

  if (loading || alerts.length === 0) {
    return null;
  }

  // Show only unacknowledged alerts, limit to 3 most recent
  const activeAlerts = alerts
    .filter(alert => !alert.acknowledged_at)
    .slice(0, 3);

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {activeAlerts.map((alert) => (
        <AlertItem
          key={alert.id}
          alert={alert}
          onAcknowledge={acknowledgeAlert}
          onDismiss={dismissAlert}
        />
      ))}
    </div>
  );
};