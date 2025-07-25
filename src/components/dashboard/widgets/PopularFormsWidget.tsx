import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PopularForm {
  id: string;
  name: string;
  category?: string;
  submission_count: number;
}

export const PopularFormsWidget: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: forms, isLoading } = useQuery({
    queryKey: ['popular-forms-widget'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_templates')
        .select(`
          id,
          name,
          category,
          form_submissions (count)
        `)
        .eq('is_active', true)
        .limit(5);

      if (error) throw error;
      
      // Process the data to include submission counts
      const formsWithCounts = data.map(form => ({
        id: form.id,
        name: form.name,
        category: form.category,
        submission_count: form.form_submissions?.length || 0
      }));
      
      // Sort by submission count
      return formsWithCounts
        .sort((a, b) => b.submission_count - a.submission_count)
        .slice(0, 5) as PopularForm[];
    },
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-muted rounded w-full mb-1"></div>
            <div className="h-3 bg-muted rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!forms || forms.length === 0) {
    return (
      <div className="text-center py-6">
        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No forms available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-4 w-4 text-green-600" />
        <span className="font-semibold text-sm">Most Popular</span>
      </div>

      {/* Forms List */}
      <div className="space-y-2">
        {forms.map((form, index) => (
          <div 
            key={form.id}
            className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => navigate(`/public/forms/${form.id}`)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-muted-foreground w-4">
                  #{index + 1}
                </span>
                <p className="text-sm font-medium truncate">{form.name}</p>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {form.category && (
                  <Badge variant="outline" className="text-xs">
                    {form.category}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {form.submission_count} submissions
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full"
        onClick={() => navigate('/forms/gallery')}
      >
        View All Forms
      </Button>
    </div>
  );
};