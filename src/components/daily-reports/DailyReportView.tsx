import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Users, TrendingUp, AlertTriangle, Thermometer, Camera, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface DailyReportViewProps {
  reportId: string;
}

interface ReportData {
  id: string;
  project_id: string;
  report_date: string;
  status: string;
  weather_conditions: string;
  temperature_high: number;
  temperature_low: number;
  work_hours_start: string;
  work_hours_end: string;
  crew_count: number;
  safety_incidents: number;
  progress_summary: string;
  work_completed: string;
  delays_issues: string;
  materials_delivered: string;
  equipment_status: string;
  visitors: string;
  photos_taken: number;
  overall_progress_percentage: number;
  created_at: string;
  projects: { name: string };
  profiles: { full_name: string };
  daily_report_team_members: Array<{
    user_id: string;
    hours_worked: number;
    role_description: string;
    tasks_completed: string;
    profiles: { full_name: string };
  }>;
}

export function DailyReportView({ reportId }: DailyReportViewProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
          projects:project_id (name),
          profiles:created_by (full_name),
          daily_report_team_members (
            *,
            profiles:user_id (full_name)
          )
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;
      setReport(data as unknown as ReportData);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'submitted': return 'default';
      case 'approved': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600';
      case 'submitted': return 'text-blue-600';
      case 'approved': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Report not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{report.projects?.name}</h2>
          <p className="text-gray-600 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(new Date(report.report_date), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Badge variant={getStatusBadgeVariant(report.status)} className={getStatusColor(report.status)}>
          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
        </Badge>
      </div>

      <Separator />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-xl font-bold">{report.overall_progress_percentage || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Crew Count</p>
                <p className="text-xl font-bold">{report.crew_count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Safety Incidents</p>
                <p className="text-xl font-bold">{report.safety_incidents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Photos Taken</p>
                <p className="text-xl font-bold">{report.photos_taken || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weather & Work Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Weather Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.weather_conditions && (
                <div>
                  <p className="text-sm text-gray-600">Conditions</p>
                  <p className="font-medium capitalize">{report.weather_conditions}</p>
                </div>
              )}
              {(report.temperature_high || report.temperature_low) && (
                <div className="grid grid-cols-2 gap-4">
                  {report.temperature_high && (
                    <div>
                      <p className="text-sm text-gray-600">High</p>
                      <p className="font-medium">{report.temperature_high}°F</p>
                    </div>
                  )}
                  {report.temperature_low && (
                    <div>
                      <p className="text-sm text-gray-600">Low</p>
                      <p className="font-medium">{report.temperature_low}°F</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Work Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.work_hours_start && (
                <div>
                  <p className="text-sm text-gray-600">Start Time</p>
                  <p className="font-medium">{report.work_hours_start}</p>
                </div>
              )}
              {report.work_hours_end && (
                <div>
                  <p className="text-sm text-gray-600">End Time</p>
                  <p className="font-medium">{report.work_hours_end}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      {report.daily_report_team_members && report.daily_report_team_members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members ({report.daily_report_team_members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.daily_report_team_members.map((member, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Team Member</p>
                      <p className="font-medium">{member.profiles?.full_name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Hours Worked</p>
                      <p className="font-medium">{member.hours_worked} hours</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <p className="font-medium">{member.role_description || 'N/A'}</p>
                    </div>
                  </div>
                  {member.tasks_completed && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Tasks Completed</p>
                      <p className="text-sm">{member.tasks_completed}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress & Work Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Progress Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.progress_summary && (
                <div>
                  <p className="text-sm text-gray-600">Overall Progress</p>
                  <p className="whitespace-pre-wrap">{report.progress_summary}</p>
                </div>
              )}
              {report.work_completed && (
                <div>
                  <p className="text-sm text-gray-600">Work Completed</p>
                  <p className="whitespace-pre-wrap">{report.work_completed}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issues & Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.delays_issues && (
                <div>
                  <p className="text-sm text-gray-600">Delays & Issues</p>
                  <p className="whitespace-pre-wrap">{report.delays_issues}</p>
                </div>
              )}
              {report.materials_delivered && (
                <div>
                  <p className="text-sm text-gray-600">Materials Delivered</p>
                  <p className="whitespace-pre-wrap">{report.materials_delivered}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.equipment_status && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Equipment Status</p>
                <p className="whitespace-pre-wrap">{report.equipment_status}</p>
              </div>
            )}
            {report.visitors && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Visitors</p>
                <p className="whitespace-pre-wrap">{report.visitors}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Metadata */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-600">
            Created by {report.profiles?.full_name || 'Unknown'} on{' '}
            {format(new Date(report.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}