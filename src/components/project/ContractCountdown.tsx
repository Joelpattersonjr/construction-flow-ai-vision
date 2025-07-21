import { useState } from 'react';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { Calendar, Clock, AlertTriangle, CheckCircle, Plus, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  ntp_date?: string;
  original_completion_date?: string;
  current_completion_date?: string;
  contract_duration_days?: number;
  total_extensions_days?: number;
  extension_history?: any[];
}

interface ContractCountdownProps {
  project: Project;
  onUpdate: () => void;
}

export function ContractCountdown({ project, onUpdate }: ContractCountdownProps) {
  const [isExtensionDialogOpen, setIsExtensionDialogOpen] = useState(false);
  const [extensionDays, setExtensionDays] = useState('');
  const [extensionReason, setExtensionReason] = useState('');
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const { toast } = useToast();

  const ntpDate = project.ntp_date ? new Date(project.ntp_date) : null;
  const originalCompletionDate = project.original_completion_date ? new Date(project.original_completion_date) : null;
  const currentCompletionDate = project.current_completion_date ? new Date(project.current_completion_date) : null;
  const today = new Date();

  // Calculate days remaining
  const daysRemaining = currentCompletionDate ? differenceInDays(currentCompletionDate, today) : null;
  const isOverdue = currentCompletionDate ? isPast(currentCompletionDate) && !isToday(currentCompletionDate) : false;
  const isDueToday = currentCompletionDate ? isToday(currentCompletionDate) : false;

  // Calculate progress
  const totalDays = ntpDate && currentCompletionDate ? differenceInDays(currentCompletionDate, ntpDate) : null;
  const daysElapsed = ntpDate ? differenceInDays(today, ntpDate) : null;
  const progressPercentage = totalDays && daysElapsed ? Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100) : 0;

  const getStatusColor = () => {
    if (isOverdue) return 'destructive';
    if (isDueToday) return 'secondary';
    if (daysRemaining && daysRemaining <= 7) return 'secondary';
    if (daysRemaining && daysRemaining <= 30) return 'outline';
    return 'default';
  };

  const getStatusText = () => {
    if (isOverdue) return `${Math.abs(daysRemaining!)} days overdue`;
    if (isDueToday) return 'Due today';
    if (daysRemaining) return `${daysRemaining} days remaining`;
    return 'No completion date set';
  };

  const handleAddExtension = async () => {
    if (!extensionDays || !extensionReason || !currentCompletionDate) return;

    try {
      const days = parseInt(extensionDays);
      const newCompletionDate = new Date(currentCompletionDate);
      newCompletionDate.setDate(newCompletionDate.getDate() + days);

      const newExtension = {
        date: format(today, 'yyyy-MM-dd'),
        days,
        reason: extensionReason,
        previous_completion_date: format(currentCompletionDate, 'yyyy-MM-dd'),
        new_completion_date: format(newCompletionDate, 'yyyy-MM-dd')
      };

      const updatedHistory = [...(project.extension_history || []), newExtension];

      const { error } = await supabase
        .from('projects')
        .update({
          current_completion_date: format(newCompletionDate, 'yyyy-MM-dd'),
          total_extensions_days: (project.total_extensions_days || 0) + days,
          extension_history: updatedHistory
        })
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: 'Extension Added',
        description: `Contract extended by ${days} days until ${format(newCompletionDate, 'PPP')}`
      });

      setIsExtensionDialogOpen(false);
      setExtensionDays('');
      setExtensionReason('');
      onUpdate();
    } catch (error) {
      console.error('Error adding extension:', error);
      toast({
        title: 'Error',
        description: 'Failed to add extension',
        variant: 'destructive'
      });
    }
  };

  if (!ntpDate || !currentCompletionDate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Contract Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Contract dates not configured. Please set NTP date and completion date in project settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Contract Countdown
          </div>
          <div className="flex gap-2">
            <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-1" />
                  History
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Extension History</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {project.extension_history && project.extension_history.length > 0 ? (
                    project.extension_history.map((ext: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline">+{ext.days} days</Badge>
                          <span className="text-sm text-muted-foreground">{format(new Date(ext.date), 'PPP')}</span>
                        </div>
                        <p className="text-sm mb-2">{ext.reason}</p>
                        <div className="text-xs text-muted-foreground">
                          From: {format(new Date(ext.previous_completion_date), 'PPP')} → {format(new Date(ext.new_completion_date), 'PPP')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No extensions recorded</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isExtensionDialogOpen} onOpenChange={setIsExtensionDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Extend
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Contract Extension</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="extension-days">Extension Days</Label>
                    <Input
                      id="extension-days"
                      type="number"
                      value={extensionDays}
                      onChange={(e) => setExtensionDays(e.target.value)}
                      placeholder="Number of days"
                    />
                  </div>
                  <div>
                    <Label htmlFor="extension-reason">Reason for Extension</Label>
                    <Textarea
                      id="extension-reason"
                      value={extensionReason}
                      onChange={(e) => setExtensionReason(e.target.value)}
                      placeholder="Explain the reason for this extension..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddExtension} disabled={!extensionDays || !extensionReason}>
                      Add Extension
                    </Button>
                    <Button variant="outline" onClick={() => setIsExtensionDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
            {getStatusText()}
          </Badge>
          {(project.total_extensions_days || 0) > 0 && (
            <Badge variant="outline">
              +{project.total_extensions_days} days extended
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Key Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">NTP Date</p>
              <p className="text-muted-foreground">{format(ntpDate, 'PPP')}</p>
            </div>
          </div>
          
          {originalCompletionDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Original Completion</p>
                <p className="text-muted-foreground">{format(originalCompletionDate, 'PPP')}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Current Completion</p>
              <p className="text-muted-foreground">{format(currentCompletionDate, 'PPP')}</p>
            </div>
          </div>
        </div>

        {/* Contract Duration Info */}
        {totalDays && (
          <div className="text-sm text-muted-foreground">
            <p>Total contract duration: {totalDays} days</p>
            {daysElapsed && <p>Days elapsed: {daysElapsed}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}