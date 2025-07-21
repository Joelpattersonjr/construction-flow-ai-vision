import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  ntp_date?: string;
  original_completion_date?: string;
  current_completion_date?: string;
  contract_duration_days?: number;
}

interface ContractSetupFormProps {
  project: Project;
  onUpdate: () => void;
}

export function ContractSetupForm({ project, onUpdate }: ContractSetupFormProps) {
  const [ntpDate, setNtpDate] = useState<Date | undefined>(
    project.ntp_date ? new Date(project.ntp_date) : undefined
  );
  const [completionDate, setCompletionDate] = useState<Date | undefined>(
    project.original_completion_date ? new Date(project.original_completion_date) : undefined
  );
  const [isNtpCalendarOpen, setIsNtpCalendarOpen] = useState(false);
  const [isCompletionCalendarOpen, setIsCompletionCalendarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!ntpDate || !completionDate) {
      toast({
        title: 'Missing Information',
        description: 'Please select both NTP date and completion date',
        variant: 'destructive'
      });
      return;
    }

    if (completionDate <= ntpDate) {
      toast({
        title: 'Invalid Dates',
        description: 'Completion date must be after NTP date',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);

    try {
      const contractDurationDays = Math.ceil((completionDate.getTime() - ntpDate.getTime()) / (1000 * 60 * 60 * 24));

      const { error } = await supabase
        .from('projects')
        .update({
          ntp_date: format(ntpDate, 'yyyy-MM-dd'),
          original_completion_date: format(completionDate, 'yyyy-MM-dd'),
          current_completion_date: format(completionDate, 'yyyy-MM-dd'),
          contract_duration_days: contractDurationDays
        })
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: 'Contract Dates Saved',
        description: `Contract duration: ${contractDurationDays} days`
      });

      onUpdate();
    } catch (error) {
      console.error('Error saving contract dates:', error);
      toast({
        title: 'Error',
        description: 'Failed to save contract dates',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Contract Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* NTP Date */}
        <div className="space-y-2">
          <Label>Notice to Proceed (NTP) Date</Label>
          <Popover open={isNtpCalendarOpen} onOpenChange={setIsNtpCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !ntpDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {ntpDate ? format(ntpDate, "PPP") : "Select NTP date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={ntpDate}
                onSelect={(date) => {
                  setNtpDate(date);
                  setIsNtpCalendarOpen(false);
                }}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Completion Date */}
        <div className="space-y-2">
          <Label>Original Completion Date</Label>
          <Popover open={isCompletionCalendarOpen} onOpenChange={setIsCompletionCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !completionDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {completionDate ? format(completionDate, "PPP") : "Select completion date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={completionDate}
                onSelect={(date) => {
                  setCompletionDate(date);
                  setIsCompletionCalendarOpen(false);
                }}
                disabled={(date) => ntpDate ? date <= ntpDate : false}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Contract Duration Preview */}
        {ntpDate && completionDate && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Contract Duration Preview</p>
            <p className="text-sm text-muted-foreground">
              {Math.ceil((completionDate.getTime() - ntpDate.getTime()) / (1000 * 60 * 60 * 24))} days
            </p>
          </div>
        )}

        <Button 
          onClick={handleSave} 
          disabled={!ntpDate || !completionDate || isSaving}
          className="w-full"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Contract Dates'}
        </Button>
      </CardContent>
    </Card>
  );
}