import React, { useState, useEffect } from 'react';
import { Users, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { scheduleService } from '@/services/scheduleService';
import { ScheduleSlot } from '@/types/scheduling';
import { format } from 'date-fns';

interface TeamScheduleViewProps {
  date: Date;
}

interface TeamMemberSchedule {
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  slots: ScheduleSlot[];
  totalHours: number;
}

export function TeamScheduleView({ date }: TeamScheduleViewProps) {
  const [teamSchedules, setTeamSchedules] = useState<TeamMemberSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeamSchedule();
  }, [date]);

  const loadTeamSchedule = async () => {
    try {
      setLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      const allSlots = await scheduleService.getTeamSchedule(dateStr);
      
      // Group slots by user
      const userMap = new Map<string, TeamMemberSchedule>();
      
      allSlots.forEach(slot => {
        if (slot.user) {
          const userId = slot.user.id;
          if (!userMap.has(userId)) {
            userMap.set(userId, {
              user: slot.user,
              slots: [],
              totalHours: 0
            });
          }
          
          const userSchedule = userMap.get(userId)!;
          userSchedule.slots.push(slot);
          userSchedule.totalHours += slot.duration_minutes / 60;
        }
      });
      
      // Sort by total hours (busiest first)
      const schedules = Array.from(userMap.values())
        .sort((a, b) => b.totalHours - a.totalHours);
      
      setTeamSchedules(schedules);
    } catch (error) {
      console.error('Error loading team schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getInitials = (name: string | null, email: string | null): string => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team schedule...</p>
        </CardContent>
      </Card>
    );
  }

  if (teamSchedules.length === 0) {
    return (
      <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No team members have scheduled tasks for this day.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Schedule - {format(date, 'EEEE, MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {teamSchedules.map((memberSchedule) => (
          <Card key={memberSchedule.user.id} className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white font-semibold">
                      {getInitials(memberSchedule.user.full_name, memberSchedule.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {memberSchedule.user.full_name || memberSchedule.user.email}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {memberSchedule.user.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {memberSchedule.totalHours.toFixed(1)}h scheduled
                  </div>
                  <div className="text-xs text-gray-600">
                    {memberSchedule.slots.length} tasks
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {memberSchedule.slots
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 bg-white/60 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(slot.task?.priority || null)}`} />
                        <div>
                          <h4 className="font-medium text-sm">
                            {slot.task?.title || 'Untitled Task'}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </span>
                            <span>
                              {Math.round(slot.duration_minutes / 60 * 10) / 10}h
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {slot.task?.status || 'todo'}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            slot.task?.priority === 'critical' || slot.task?.priority === 'high' 
                              ? 'border-red-300 text-red-700' 
                              : slot.task?.priority === 'medium'
                              ? 'border-orange-300 text-orange-700'
                              : 'border-blue-300 text-blue-700'
                          }`}
                        >
                          {slot.task?.priority || 'medium'}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}