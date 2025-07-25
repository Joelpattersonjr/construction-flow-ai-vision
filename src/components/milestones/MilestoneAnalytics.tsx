import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ProjectMilestone } from '@/types/milestones';
import { TrendingUp, Target, Calendar, AlertTriangle } from 'lucide-react';

interface MilestoneAnalyticsProps {
  analytics: any;
  milestones: ProjectMilestone[];
}

export const MilestoneAnalytics: React.FC<MilestoneAnalyticsProps> = ({ analytics, milestones }) => {
  if (!analytics) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={analytics.completion_rate} className="h-3" />
              <p className="text-2xl font-bold">{analytics.completion_rate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Milestone Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.milestone_types_breakdown.map((type: any) => (
                <div key={type.type} className="flex justify-between items-center">
                  <Badge variant="outline" className="capitalize">{type.type}</Badge>
                  <span className="font-medium">{type.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-red-500">Overdue</span>
                <span className="font-bold">{analytics.overdue_milestones}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-500">At Risk</span>
                <span className="font-bold">{analytics.at_risk_milestones}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};