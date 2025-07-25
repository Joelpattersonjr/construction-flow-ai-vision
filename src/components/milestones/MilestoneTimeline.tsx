import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ProjectMilestone } from '@/types/milestones';
import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import { CheckCircle, Clock, AlertTriangle, Calendar, Target } from 'lucide-react';

interface MilestoneTimelineProps {
  milestones: ProjectMilestone[];
  onUpdate: (id: string, updates: any) => void;
}

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({ milestones, onUpdate }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');

  const sortedMilestones = [...milestones].sort((a, b) => 
    new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
  );

  const filteredMilestones = sortedMilestones.filter(milestone => {
    if (filter === 'all') return true;
    return milestone.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'at_risk':
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <Target className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-500 bg-green-50';
      case 'overdue': return 'border-red-500 bg-red-50';
      case 'at_risk': return 'border-orange-500 bg-orange-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const getDaysFromToday = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    return differenceInDays(target, today);
  };

  const calculateProgress = (milestone: ProjectMilestone) => {
    if (milestone.status === 'completed') return 100;
    
    const today = new Date();
    const target = new Date(milestone.target_date);
    const bufferDate = addDays(target, -milestone.buffer_days);
    
    if (isAfter(today, target)) return 100; // Overdue
    if (isBefore(today, bufferDate)) return 25; // Safe zone
    
    // Calculate progress in buffer zone
    const totalBufferDays = milestone.buffer_days;
    const daysIntoBuffer = differenceInDays(today, bufferDate);
    return 25 + (daysIntoBuffer / totalBufferDays) * 75;
  };

  const handleStatusChange = (milestoneId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'completed') {
      updates.actual_date = format(new Date(), 'yyyy-MM-dd');
    }
    onUpdate(milestoneId, updates);
  };

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex gap-2">
        {(['all', 'pending', 'completed', 'overdue'] as const).map((filterOption) => (
          <Button
            key={filterOption}
            variant={filter === filterOption ? 'default' : 'outline'}
            onClick={() => setFilter(filterOption)}
            className="capitalize"
          >
            {filterOption}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
        
        <div className="space-y-6">
          {filteredMilestones.map((milestone, index) => {
            const daysFromToday = getDaysFromToday(milestone.target_date);
            const progress = calculateProgress(milestone);
            
            return (
              <div key={milestone.id} className="relative flex items-start gap-6">
                {/* Timeline dot */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${getStatusColor(milestone.status)}`}>
                  {getStatusIcon(milestone.status)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{milestone.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {milestone.milestone_type}
                            </Badge>
                            <Badge 
                              variant={milestone.importance_level === 'critical' ? 'destructive' : 'secondary'}
                              className="capitalize"
                            >
                              {milestone.importance_level}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(new Date(milestone.target_date), 'MMM dd, yyyy')}
                          </p>
                          <p className={`text-xs ${daysFromToday < 0 ? 'text-red-500' : daysFromToday <= milestone.buffer_days ? 'text-orange-500' : 'text-muted-foreground'}`}>
                            {daysFromToday < 0 
                              ? `${Math.abs(daysFromToday)} days overdue`
                              : daysFromToday === 0 
                                ? 'Due today'
                                : `${daysFromToday} days remaining`
                            }
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {milestone.description && (
                        <p className="text-muted-foreground">{milestone.description}</p>
                      )}
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      
                      {/* Milestone Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <span className="text-muted-foreground">Buffer Days:</span>
                          <span className="ml-2 font-medium">{milestone.buffer_days}</span>
                        </div>
                        
                        {milestone.approval_required && (
                          <div className="space-y-1">
                            <span className="text-muted-foreground">Approval:</span>
                            <Badge variant="outline" className="ml-2">
                              {milestone.approval_status}
                            </Badge>
                          </div>
                        )}
                        
                        {milestone.weather_sensitive && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Weather Sensitive</Badge>
                          </div>
                        )}
                        
                        {milestone.evidence_required && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Evidence Required</Badge>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      {milestone.status !== 'completed' && (
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusChange(milestone.id, 'completed')}
                          >
                            Mark Complete
                          </Button>
                          
                          {milestone.status !== 'at_risk' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusChange(milestone.id, 'at_risk')}
                            >
                              Mark At Risk
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {milestone.actual_date && (
                        <div className="text-sm text-green-600 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Completed on {format(new Date(milestone.actual_date), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredMilestones.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No milestones found</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'No milestones have been created for this project yet.'
                : `No ${filter} milestones found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};