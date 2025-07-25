import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface PendingApproval {
  id: string;
  step_id: string;
  created_at: string;
  expires_at?: string;
  workflow_executions: {
    workflows: {
      name: string;
    };
  };
}

export const PendingApprovalsWidget: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: approvals, isLoading } = useQuery({
    queryKey: ['pending-approvals-widget'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('workflow_approvals')
        .select(`
          id,
          step_id,
          created_at,
          expires_at,
          workflow_executions (
            workflows (
              name
            )
          )
        `)
        .eq('status', 'pending')
        .or(`assignee_id.eq.${user.user.id},assignee_email.eq.${user.user.email}`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as PendingApproval[];
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-muted rounded w-full mb-1"></div>
            <div className="h-3 bg-muted rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!approvals || approvals.length === 0) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No pending approvals</p>
      </div>
    );
  }

  const urgentCount = approvals.filter(approval => {
    if (!approval.expires_at) return false;
    const hoursUntilExpiry = (new Date(approval.expires_at).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 24;
  }).length;

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-blue-600" />
          <span className="font-semibold">{approvals.length}</span>
          <span className="text-sm text-muted-foreground">pending</span>
        </div>
        {urgentCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {urgentCount} urgent
          </Badge>
        )}
      </div>

      {/* Approval List */}
      <div className="space-y-2">
        {approvals.map(approval => {
          const isUrgent = approval.expires_at && 
            (new Date(approval.expires_at).getTime() - Date.now()) / (1000 * 60 * 60) <= 24;
          
          return (
            <div 
              key={approval.id}
              className={`p-2 rounded border cursor-pointer hover:bg-muted/50 transition-colors ${
                isUrgent ? 'border-red-200 bg-red-50/50' : ''
              }`}
              onClick={() => navigate('/approvals')}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {approval.workflow_executions.workflows.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(approval.created_at), 'MMM d')}
                    {approval.expires_at && (
                      <span className={isUrgent ? 'text-red-600 font-medium' : ''}>
                        {' • Expires '}{format(new Date(approval.expires_at), 'MMM d')}
                      </span>
                    )}
                  </p>
                </div>
                {isUrgent && (
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full"
        onClick={() => navigate('/approvals')}
      >
        View All Approvals
      </Button>
    </div>
  );
};