import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, AlertTriangle, CheckCircle, Clock, Plus, Filter, TrendingUp } from 'lucide-react';
import { ProjectMilestone } from '@/types/milestones';
import { milestoneService } from '@/services/milestoneService';
import { MilestoneForm } from './MilestoneForm';
import { MilestoneTimeline } from './MilestoneTimeline';
import { MilestoneAnalytics } from './MilestoneAnalytics';
import { MilestoneAlerts } from './MilestoneAlerts';
import { useToast } from '@/hooks/use-toast';

interface MilestoneManagerProps {
  projectId: string;
  projectName?: string;
}

export const MilestoneManager: React.FC<MilestoneManagerProps> = ({ projectId, projectName }) => {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestone | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMilestones();
    loadAnalytics();
  }, [projectId]);

  const loadMilestones = async () => {
    try {
      const data = await milestoneService.getProjectMilestones(projectId);
      setMilestones(data);
    } catch (error) {
      console.error('Error loading milestones:', error);
      toast({
        title: "Error",
        description: "Failed to load milestones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await milestoneService.getMilestoneAnalytics(projectId);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleCreateMilestone = async (milestoneData: any) => {
    try {
      await milestoneService.createMilestone({
        ...milestoneData,
        project_id: projectId
      });
      
      toast({
        title: "Success",
        description: "Milestone created successfully",
      });
      
      loadMilestones();
      loadAnalytics();
      setShowForm(false);
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast({
        title: "Error",
        description: "Failed to create milestone",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMilestone = async (id: string, updates: any) => {
    try {
      await milestoneService.updateMilestone(id, updates);
      
      toast({
        title: "Success",
        description: "Milestone updated successfully",
      });
      
      loadMilestones();
      loadAnalytics();
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast({
        title: "Error",
        description: "Failed to update milestone",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    try {
      await milestoneService.deleteMilestone(id);
      
      toast({
        title: "Success",
        description: "Milestone deleted successfully",
      });
      
      loadMilestones();
      loadAnalytics();
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast({
        title: "Error",
        description: "Failed to delete milestone",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'overdue': return 'bg-red-500';
      case 'at_risk': return 'bg-orange-500';
      case 'pending': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getImportanceColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Milestone Management</h2>
          {projectName && (
            <p className="text-muted-foreground">Managing milestones for {projectName}</p>
          )}
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      {/* Quick Stats */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{analytics.total_milestones}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{analytics.completed_milestones}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">At Risk</p>
                  <p className="text-2xl font-bold">{analytics.at_risk_milestones}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold">{analytics.overdue_milestones}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list">Milestone List</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-4">
            {milestones.map((milestone) => (
              <Card key={milestone.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{milestone.title}</h3>
                        <Badge className={getImportanceColor(milestone.importance_level)}>
                          {milestone.importance_level}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {milestone.milestone_type}
                        </Badge>
                      </div>
                      
                      {milestone.description && (
                        <p className="text-muted-foreground mb-3">{milestone.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Target: {new Date(milestone.target_date).toLocaleDateString()}</span>
                        {milestone.buffer_days > 0 && (
                          <span>Buffer: {milestone.buffer_days} days</span>
                        )}
                        {milestone.weather_sensitive && (
                          <Badge variant="secondary">Weather Sensitive</Badge>
                        )}
                        {milestone.approval_required && (
                          <Badge variant="secondary">Approval Required</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(milestone.status)}`}></div>
                      <span className="capitalize text-sm">{milestone.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <MilestoneTimeline milestones={milestones} onUpdate={handleUpdateMilestone} />
        </TabsContent>

        <TabsContent value="analytics">
          <MilestoneAnalytics analytics={analytics} milestones={milestones} />
        </TabsContent>

        <TabsContent value="alerts">
          <MilestoneAlerts projectId={projectId} milestones={milestones} />
        </TabsContent>
      </Tabs>

      {/* Milestone Form Dialog */}
      {showForm && (
        <MilestoneForm
          onSubmit={handleCreateMilestone}
          onCancel={() => setShowForm(false)}
          projectId={projectId}
        />
      )}
    </div>
  );
};