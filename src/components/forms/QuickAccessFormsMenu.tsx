import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Eye, Grid, History, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FormTemplate {
  id: string;
  name: string;
  category?: string;
  created_at: string;
}

const QuickAccessFormsMenu: React.FC = () => {
  const navigate = useNavigate();

  // Get recent/popular forms
  const { data: popularForms } = useQuery({
    queryKey: ['popular-forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_templates')
        .select('id, name, category, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as FormTemplate[];
    }
  });

  const quickActions = [
    {
      label: 'Forms Gallery',
      icon: Grid,
      action: () => navigate('/forms/gallery'),
      description: 'Browse all forms'
    },
    {
      label: 'Create Form',
      icon: Plus,
      action: () => navigate('/forms?create=true'),
      description: 'Build new form'
    },
    {
      label: 'My Forms',
      icon: History,
      action: () => navigate('/forms'),
      description: 'Recent activity'
    }
  ];

  const handleFormAccess = (formId: string) => {
    navigate(`/public/forms/${formId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Forms</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem key={action.label} onClick={action.action}>
              <div className="flex items-center space-x-3 w-full">
                <Icon className="h-4 w-4" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Popular Forms</DropdownMenuLabel>
        
        {popularForms && popularForms.length > 0 ? (
          popularForms.map((form) => (
            <DropdownMenuItem 
              key={form.id} 
              onClick={() => handleFormAccess(form.id)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <Eye className="h-4 w-4" />
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate max-w-48">
                      {form.name}
                    </p>
                    {form.category && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {form.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>
            <div className="text-sm text-muted-foreground">
              No forms available
            </div>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/forms')}>
          <div className="flex items-center space-x-2 w-full">
            <FileText className="h-4 w-4" />
            <span className="text-sm">View All Forms</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QuickAccessFormsMenu;