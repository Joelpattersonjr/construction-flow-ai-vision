import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, FileText, Clock } from 'lucide-react';

interface SubmissionStats {
  total: number;
  today: number;
  pending: number;
  approved: number;
  trend: number;
}

export const FormsSubmissionsSummaryWidget: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['forms-submissions-summary'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Get total submissions
      const { count: total } = await supabase
        .from('form_submissions')
        .select('*', { count: 'exact', head: true });
      
      // Get today's submissions
      const { count: todayCount } = await supabase
        .from('form_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', today);
      
      // Get pending workflow executions
      const { count: pending } = await supabase
        .from('workflow_executions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      // Get approved workflow executions
      const { count: approved } = await supabase
        .from('workflow_executions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      
      // Calculate trend (week over week)
      const { count: lastWeek } = await supabase
        .from('form_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', weekAgo)
        .lt('submitted_at', today);
      
      const trend = lastWeek ? ((todayCount || 0) / lastWeek) * 100 - 100 : 0;
      
      return {
        total: total || 0,
        today: todayCount || 0,
        pending: pending || 0,
        approved: approved || 0,
        trend: Math.round(trend)
      } as SubmissionStats;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-1"></div>
            <div className="h-6 bg-muted rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Submissions',
      value: stats.total,
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      label: 'Today',
      value: stats.today,
      icon: Clock,
      color: 'text-green-600'
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      label: 'Approved',
      value: stats.approved,
      icon: TrendingUp,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="space-y-3">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <IconComponent className={`h-4 w-4 ${stat.color}`} />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <span className="font-semibold">{stat.value}</span>
          </div>
        );
      })}
      
      {/* Trend indicator */}
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-xs text-muted-foreground">Week trend</span>
        <div className="flex items-center space-x-1">
          {stats.trend >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-600" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-600" />
          )}
          <span className={`text-xs font-medium ${
            stats.trend >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {Math.abs(stats.trend)}%
          </span>
        </div>
      </div>
    </div>
  );
};