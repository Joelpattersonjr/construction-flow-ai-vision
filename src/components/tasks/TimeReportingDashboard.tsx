import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BarChart3, Users, TrendingUp } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

import { taskTimeService } from '@/services/taskTimeService';
import { TaskTimeEntry } from '@/types/tasks';
import { FeatureGate } from '@/components/subscription/FeatureGate';

export const TimeReportingDashboard: React.FC = () => {
  const [timeStats, setTimeStats] = useState<any>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'custom'>('week');
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfWeek(new Date()));
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [activeEntries, setActiveEntries] = useState<TaskTimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    updateDateRange(dateRange);
  }, [dateRange]);

  useEffect(() => {
    loadTimeStats();
    loadActiveEntries();
  }, [startDate, endDate]);

  const updateDateRange = (range: 'week' | 'month' | 'custom') => {
    const now = new Date();
    switch (range) {
      case 'week':
        setStartDate(startOfWeek(now));
        setEndDate(endOfWeek(now));
        break;
      case 'month':
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          setStartDate(customStartDate);
          setEndDate(customEndDate);
        }
        break;
    }
  };

  const loadTimeStats = async () => {
    setLoading(true);
    try {
      const stats = await taskTimeService.getUserTimeStats(startDate, endDate);
      setTimeStats(stats);
    } catch (error) {
      toast({
        title: 'Error loading time statistics',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadActiveEntries = async () => {
    try {
      const entries = await taskTimeService.getActiveTimeEntries();
      setActiveEntries(entries);
    } catch (error) {
      console.error('Error loading active entries:', error);
    }
  };

  const stopActiveTimer = async (entryId: string) => {
    try {
      await taskTimeService.stopTimeEntry(entryId);
      await loadActiveEntries();
      await loadTimeStats();
      toast({ title: 'Timer stopped successfully' });
    } catch (error) {
      toast({
        title: 'Error stopping timer',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <FeatureGate 
      feature="time_tracking"
      upgradeMessage="Advanced time reporting and analytics are available to Pro and Enterprise subscribers. Get detailed insights into your team's productivity and time allocation."
    >
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Time Reporting</h2>
          <p className="text-muted-foreground">
            Track and analyze your time across tasks and projects
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={(value: 'week' | 'month' | 'custom') => setDateRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          {dateRange === 'custom' && (
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    {customStartDate ? format(customStartDate, 'MMM d') : 'Start Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    {customEndDate ? format(customEndDate, 'MMM d') : 'End Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Button 
                onClick={() => updateDateRange('custom')}
                disabled={!customStartDate || !customEndDate}
              >
                Apply
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Active Timers */}
      {activeEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Active Timers ({activeEntries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {activeEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-medium">{(entry as any).task?.title || 'Unknown Task'}</p>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground">{entry.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Started: {format(new Date(entry.start_time), 'HH:mm')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      Running
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => stopActiveTimer(entry.id)}
                    >
                      Stop
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : timeStats?.totalHours.toFixed(1) || '0.0'}h
            </div>
            <p className="text-xs text-muted-foreground">
              {format(startDate, 'MMM d')} - {format(endDate, 'MMM d')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Entries</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : timeStats?.entriesCount || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Recording sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Session</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : timeStats?.entriesCount > 0 
                ? formatDuration((timeStats.totalHours * 3600) / timeStats.entriesCount)
                : '0m'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Per time entry
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : timeStats?.taskBreakdown?.length || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Tasks with time logged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Breakdown */}
      {timeStats?.taskBreakdown && timeStats.taskBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Time by Task</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeStats.taskBreakdown
                .sort((a: any, b: any) => b.totalSeconds - a.totalSeconds)
                .map((task: any) => (
                  <div key={task.taskId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{task.taskTitle}</p>
                      <div className="w-full bg-background rounded-full h-2 mt-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${(task.totalSeconds / (timeStats.totalHours * 3600)) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <Badge variant="secondary">
                        {formatDuration(task.totalSeconds)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((task.totalSeconds / (timeStats.totalHours * 3600)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </FeatureGate>
  );
};