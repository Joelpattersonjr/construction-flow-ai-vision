import React, { useState, useEffect } from 'react';
import { Play, Square, Clock, Plus, Trash2, Edit3 } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

import { TaskTimeEntry } from '@/types/tasks';
import { taskTimeService } from '@/services/taskTimeService';
import { FeatureGate } from '@/components/subscription/FeatureGate';

interface TaskTimeTrackerProps {
  taskId: number;
  taskTitle: string;
}

export const TaskTimeTracker: React.FC<TaskTimeTrackerProps> = ({
  taskId,
  taskTitle,
}) => {
  const [timeEntries, setTimeEntries] = useState<TaskTimeEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<TaskTimeEntry | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TaskTimeEntry | null>(null);
  const [newDescription, setNewDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadTimeEntries();
    checkActiveTimer();
  }, [taskId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeEntry) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const start = new Date(activeEntry.start_time).getTime();
        setCurrentTime(Math.floor((now - start) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeEntry]);

  const loadTimeEntries = async () => {
    try {
      const entries = await taskTimeService.getTaskTimeEntries(taskId);
      setTimeEntries(entries);
    } catch (error) {
      toast({
        title: 'Error loading time entries',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const checkActiveTimer = async () => {
    try {
      const activeEntries = await taskTimeService.getActiveTimeEntries();
      const activeForThisTask = activeEntries.find(entry => entry.task_id === taskId);
      
      if (activeForThisTask) {
        setActiveEntry(activeForThisTask);
        const now = new Date().getTime();
        const start = new Date(activeForThisTask.start_time).getTime();
        setCurrentTime(Math.floor((now - start) / 1000));
      } else {
        setActiveEntry(null);
        setCurrentTime(0);
      }
    } catch (error) {
      console.error('Error checking active timer:', error);
    }
  };

  const startTimer = async () => {
    setIsLoading(true);
    try {
      const entry = await taskTimeService.startTimeEntry(taskId, description.trim() || undefined);
      setActiveEntry(entry);
      setDescription('');
      setCurrentTime(0);
      toast({ title: 'Timer started successfully' });
    } catch (error) {
      toast({
        title: 'Error starting timer',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopTimer = async () => {
    if (!activeEntry) return;
    
    setIsLoading(true);
    try {
      await taskTimeService.stopTimeEntry(activeEntry.id);
      setActiveEntry(null);
      setCurrentTime(0);
      await loadTimeEntries();
      toast({ title: 'Timer stopped successfully' });
    } catch (error) {
      toast({
        title: 'Error stopping timer',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      await taskTimeService.deleteTimeEntry(entryId);
      await loadTimeEntries();
      toast({ title: 'Time entry deleted successfully' });
    } catch (error) {
      toast({
        title: 'Error deleting time entry',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const updateEntry = async () => {
    if (!editingEntry) return;
    
    try {
      await taskTimeService.updateTimeEntry(editingEntry.id, {
        description: newDescription.trim() || null,
      });
      setEditingEntry(null);
      setNewDescription('');
      await loadTimeEntries();
      toast({ title: 'Time entry updated successfully' });
    } catch (error) {
      toast({
        title: 'Error updating time entry',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTime = timeEntries.reduce((sum, entry) => sum + (entry.duration_seconds || 0), 0) + currentTime;

  return (
    <FeatureGate 
      feature="time_tracking"
      upgradeMessage="Time tracking is available to Pro and Enterprise subscribers. Track your time, generate detailed reports, and gain insights into your productivity."
    >
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracking
          <Badge variant="outline" className="ml-auto">
            Total: {taskTimeService.formatDuration(totalTime)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Controls */}
        <div className="space-y-3">
          {activeEntry ? (
            <div className="text-center space-y-2">
              <div className="text-2xl font-mono font-bold text-primary">
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-muted-foreground">
                Timer running for: {taskTitle}
              </div>
              <Button onClick={stopTimer} disabled={isLoading} className="w-full">
                <Square className="h-4 w-4 mr-2" />
                Stop Timer
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="Optional: Add a description for this time entry..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
              <Button onClick={startTimer} disabled={isLoading} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
            </div>
          )}
        </div>

        {/* Time Entries List */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Recent Time Entries</h4>
          {timeEntries.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No time entries yet. Start a timer to track your work!
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {taskTimeService.formatDuration(entry.duration_seconds)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.start_time), 'MMM d, HH:mm')}
                        {entry.end_time && ` - ${format(new Date(entry.end_time), 'HH:mm')}`}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {entry.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setEditingEntry(entry);
                            setNewDescription(entry.description || '');
                          }}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Time Entry</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={newDescription}
                              onChange={(e) => setNewDescription(e.target.value)}
                              placeholder="Add a description for this time entry..."
                              rows={3}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditingEntry(null)}>
                              Cancel
                            </Button>
                            <Button onClick={updateEntry}>
                              Update
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      onClick={() => deleteEntry(entry.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </FeatureGate>
  );
};