import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, Edit, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RecentFormActivity {
  id: string;
  type: 'submission' | 'template_view' | 'template_edit';
  form_template_id: string;
  form_name: string;
  activity_date: string;
  status?: string;
}

const RecentFormsHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get recent form submissions by user
  const { data: recentSubmissions } = useQuery({
    queryKey: ['recent-form-submissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('form_submissions')
        .select(`
          id,
          form_template_id,
          submitted_at,
          status,
          form_templates!inner(name)
        `)
        .eq('submitted_by', user.id)
        .order('submitted_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      return data.map(submission => ({
        id: submission.id,
        type: 'submission' as const,
        form_template_id: submission.form_template_id,
        form_name: (submission as any).form_templates.name,
        activity_date: submission.submitted_at,
        status: submission.status
      }));
    },
    enabled: !!user?.id
  });

  // Get recently viewed/edited templates (simulated - would need tracking table)
  const { data: recentTemplates } = useQuery({
    queryKey: ['recent-form-templates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('form_templates')
        .select('id, name, updated_at, created_by')
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      return data.map(template => ({
        id: template.id,
        type: 'template_edit' as const,
        form_template_id: template.id,
        form_name: template.name,
        activity_date: template.updated_at,
        status: undefined
      }));
    },
    enabled: !!user?.id
  });

  // Combine and sort all activities
  const allActivities = React.useMemo(() => {
    const combined = [
      ...(recentSubmissions || []),
      ...(recentTemplates || [])
    ];
    
    return combined.sort((a, b) => 
      new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
    ).slice(0, 10);
  }, [recentSubmissions, recentTemplates]);

  const handleViewForm = (formId: string) => {
    navigate(`/public/forms/${formId}`);
  };

  const handleEditForm = (formId: string) => {
    navigate(`/forms?edit=${formId}`);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission':
        return <FileText className="h-4 w-4" />;
      case 'template_view':
        return <Eye className="h-4 w-4" />;
      case 'template_edit':
        return <Edit className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'submission':
        return 'Submitted';
      case 'template_view':
        return 'Viewed';
      case 'template_edit':
        return 'Edited';
      default:
        return 'Activity';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  if (!allActivities || allActivities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Forms Activity</span>
          </CardTitle>
          <CardDescription>Your recent form interactions will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent form activity</p>
            <p className="text-sm">Start by creating or filling out a form!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full min-h-fit">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Recent Forms Activity</span>
        </CardTitle>
        <CardDescription>Your latest form interactions and submissions</CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <div className="space-y-4">
          {allActivities.map((activity) => (
             <div key={`${activity.type}-${activity.id}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
               <div className="flex items-center space-x-3 flex-1 min-w-0">
                 <div className="flex-shrink-0">
                   {getActivityIcon(activity.type)}
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center space-x-2 flex-wrap">
                     <p className="text-sm font-medium truncate">
                       {activity.form_name}
                     </p>
                     <Badge variant="outline" className="text-xs whitespace-nowrap">
                       {getActivityLabel(activity.type)}
                     </Badge>
                     {activity.status && (
                       <Badge variant={getStatusColor(activity.status) as any} className="text-xs whitespace-nowrap">
                         {activity.status}
                       </Badge>
                     )}
                   </div>
                   <p className="text-xs text-muted-foreground">
                     {new Date(activity.activity_date).toLocaleDateString()} at{' '}
                     {new Date(activity.activity_date).toLocaleTimeString([], { 
                       hour: '2-digit', 
                       minute: '2-digit' 
                     })}
                   </p>
                 </div>
               </div>
               
               <div className="flex items-center space-x-2 flex-shrink-0">
                 <Button
                   size="sm"
                   variant="ghost"
                   onClick={() => handleViewForm(activity.form_template_id)}
                   title="View Form"
                 >
                   <Eye className="h-4 w-4" />
                 </Button>
                 <Button
                   size="sm"
                   variant="ghost"
                   onClick={() => handleEditForm(activity.form_template_id)}
                   title="Edit Form"
                 >
                   <Edit className="h-4 w-4" />
                 </Button>
               </div>
             </div>
          ))}
        </div>
        
        {allActivities.length >= 10 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" onClick={() => navigate('/forms')}>
              View All Activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentFormsHistory;