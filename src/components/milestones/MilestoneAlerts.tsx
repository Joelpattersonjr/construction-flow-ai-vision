import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProjectMilestone, MilestoneAlert } from '@/types/milestones';
import { milestoneService } from '@/services/milestoneService';
import { AlertTriangle, Clock, CloudRain, GitBranch } from 'lucide-react';

interface MilestoneAlertsProps {
  projectId: string;
  milestones: ProjectMilestone[];
}

export const MilestoneAlerts: React.FC<MilestoneAlertsProps> = ({ projectId, milestones }) => {
  const [alerts, setAlerts] = useState<MilestoneAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [milestones]);

  const loadAlerts = async () => {
    try {
      const allAlerts: MilestoneAlert[] = [];
      for (const milestone of milestones) {
        const milestoneAlerts = await milestoneService.getMilestoneAlerts(milestone.id);
        allAlerts.push(...milestoneAlerts);
      }
      setAlerts(allAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <Clock className="h-5 w-5 text-orange-500" />;
      case 'weather': return <CloudRain className="h-5 w-5 text-blue-500" />;
      case 'dependency': return <GitBranch className="h-5 w-5 text-purple-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading alerts...</div>;
  }

  const activeAlerts = alerts.filter(alert => !alert.resolved_at);

  return (
    <div className="space-y-4">
      {activeAlerts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Active Alerts</h3>
            <p className="text-muted-foreground">All milestones are on track with no alerts.</p>
          </CardContent>
        </Card>
      ) : (
        activeAlerts.map((alert) => (
          <Card key={alert.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.alert_type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {alert.alert_type}
                    </Badge>
                  </div>
                  <p className="text-foreground">{alert.message}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Triggered {new Date(alert.triggered_at).toLocaleDateString()}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => milestoneService.resolveAlert(alert.id)}
                >
                  Resolve
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};