import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, Target, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { scheduleService } from '@/services/scheduleService';
import { ScheduleAnalytics as ScheduleAnalyticsType } from '@/types/scheduling';
import { format, subDays, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface ScheduleAnalyticsProps {
  date: Date;
}

interface WeeklyAnalytics {
  date: string;
  analytics: ScheduleAnalyticsType | null;
}

export function ScheduleAnalytics({ date }: ScheduleAnalyticsProps) {
  const [currentAnalytics, setCurrentAnalytics] = useState<ScheduleAnalyticsType | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyAnalytics[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [date]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const userId = user.user.id;
      const dateStr = format(date, 'yyyy-MM-dd');

      // Update analytics for current date first
      await scheduleService.updateScheduleAnalytics(userId, dateStr);

      // Load current day analytics
      const analytics = await scheduleService.getScheduleAnalytics(userId, dateStr);
      setCurrentAnalytics(analytics);

      // Load weekly data (7 days including current)
      const weeklyPromises = [];
      for (let i = -6; i <= 0; i++) {
        const targetDate = addDays(date, i);
        const targetDateStr = format(targetDate, 'yyyy-MM-dd');
        weeklyPromises.push(
          scheduleService.getScheduleAnalytics(userId, targetDateStr)
            .then(analytics => ({ date: targetDateStr, analytics }))
        );
      }

      const weekly = await Promise.all(weeklyPromises);
      setWeeklyData(weekly);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyAverages = () => {
    const validDays = weeklyData.filter(day => day.analytics);
    if (validDays.length === 0) return null;

    const totalScheduled = validDays.reduce((sum, day) => sum + (day.analytics?.scheduled_hours || 0), 0);
    const totalActual = validDays.reduce((sum, day) => sum + (day.analytics?.actual_hours || 0), 0);
    const totalEfficiency = validDays.reduce((sum, day) => sum + (day.analytics?.efficiency_score || 0), 0);
    const totalTasks = validDays.reduce((sum, day) => sum + (day.analytics?.tasks_scheduled || 0), 0);
    const totalCompleted = validDays.reduce((sum, day) => sum + (day.analytics?.tasks_completed || 0), 0);

    return {
      avgScheduledHours: totalScheduled / validDays.length,
      avgActualHours: totalActual / validDays.length,
      avgEfficiency: totalEfficiency / validDays.length,
      totalTasks,
      totalCompleted,
      completionRate: totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0
    };
  };

  const weeklyStats = calculateWeeklyAverages();

  const getEfficiencyColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getEfficiencyLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Schedule Analytics - {format(date, 'EEEE, MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Daily Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Scheduled Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {currentAnalytics?.scheduled_hours?.toFixed(1) || '0.0'}h
            </div>
            <p className="text-xs text-gray-500 mt-1">Planned for today</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Actual Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {currentAnalytics?.actual_hours?.toFixed(1) || '0.0'}h
            </div>
            <p className="text-xs text-gray-500 mt-1">Time worked</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {currentAnalytics?.efficiency_score?.toFixed(0) || '0'}%
              </div>
              <Badge className={`text-xs ${getEfficiencyColor(currentAnalytics?.efficiency_score || 0)}`}>
                {getEfficiencyLabel(currentAnalytics?.efficiency_score || 0)}
              </Badge>
            </div>
            <Progress 
              value={currentAnalytics?.efficiency_score || 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Task Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {currentAnalytics?.tasks_completed || 0}/{currentAnalytics?.tasks_scheduled || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Tasks completed</p>
            {(currentAnalytics?.tasks_scheduled || 0) > 0 && (
              <Progress 
                value={(currentAnalytics?.tasks_completed || 0) / (currentAnalytics?.tasks_scheduled || 1) * 100} 
                className="mt-2 h-2"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Overview */}
      {weeklyStats && (
        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Overview (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700">Average Daily Hours</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Scheduled:</span>
                  <span className="font-medium">{weeklyStats.avgScheduledHours.toFixed(1)}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Actual:</span>
                  <span className="font-medium">{weeklyStats.avgActualHours.toFixed(1)}h</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700">Task Completion</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Tasks:</span>
                  <span className="font-medium">{weeklyStats.totalTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed:</span>
                  <span className="font-medium">{weeklyStats.totalCompleted}</span>
                </div>
                <Progress value={weeklyStats.completionRate} className="mt-2 h-2" />
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700">Weekly Efficiency</h4>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">
                    {weeklyStats.avgEfficiency.toFixed(0)}%
                  </div>
                  <Badge className={`${getEfficiencyColor(weeklyStats.avgEfficiency)}`}>
                    {getEfficiencyLabel(weeklyStats.avgEfficiency)}
                  </Badge>
                </div>
                <Progress value={weeklyStats.avgEfficiency} className="mt-2 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Breakdown */}
      <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">7-Day Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyData.map((day) => (
              <div
                key={day.date}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  day.date === format(date, 'yyyy-MM-dd')
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-white/60 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-medium">
                    {format(new Date(day.date), 'EEE, MMM d')}
                  </span>
                </div>
                
                {day.analytics ? (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      {day.analytics.scheduled_hours.toFixed(1)}h planned
                    </span>
                    <span className="text-gray-600">
                      {day.analytics.actual_hours.toFixed(1)}h worked
                    </span>
                    <Badge className={`text-xs ${getEfficiencyColor(day.analytics.efficiency_score)}`}>
                      {day.analytics.efficiency_score.toFixed(0)}%
                    </Badge>
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">No data</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}