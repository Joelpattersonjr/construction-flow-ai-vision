import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, AlertTriangle, Calendar, Target, Clock } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays } from 'date-fns';

interface Project {
  id: string;
  name: string;
}

interface DailyReport {
  id: string;
  project_id: string;
  report_date: string;
  status: 'draft' | 'submitted' | 'approved';
  progress_summary: string;
  overall_progress_percentage: number;
  crew_count: number;
  safety_incidents: number;
  created_by: string;
  created_at: string;
  projects: { name: string };
  profiles: { full_name: string };
}

interface DailyReportsAnalyticsProps {
  reports: DailyReport[];
  projects: Project[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

export function DailyReportsAnalytics({ reports, projects }: DailyReportsAnalyticsProps) {
  const analytics = useMemo(() => {
    // Progress trend over time
    const progressTrend = reports
      .filter(r => r.overall_progress_percentage > 0)
      .sort((a, b) => new Date(a.report_date).getTime() - new Date(b.report_date).getTime())
      .map(report => ({
        date: format(parseISO(report.report_date), 'MMM dd'),
        progress: report.overall_progress_percentage,
        project: report.projects?.name || 'Unknown',
        crew: report.crew_count
      }));

    // Safety incidents by project
    const safetyByProject = projects.map(project => {
      const projectReports = reports.filter(r => r.project_id === project.id);
      const totalIncidents = projectReports.reduce((sum, r) => sum + (r.safety_incidents || 0), 0);
      return {
        project: project.name,
        incidents: totalIncidents,
        reports: projectReports.length
      };
    }).filter(p => p.reports > 0);

    // Crew utilization over time
    const crewUtilization = reports
      .sort((a, b) => new Date(a.report_date).getTime() - new Date(b.report_date).getTime())
      .map(report => ({
        date: format(parseISO(report.report_date), 'MMM dd'),
        crew: report.crew_count || 0,
        project: report.projects?.name || 'Unknown'
      }));

    // Status distribution
    const statusDistribution = [
      { name: 'Draft', value: reports.filter(r => r.status === 'draft').length, color: '#8884d8' },
      { name: 'Submitted', value: reports.filter(r => r.status === 'submitted').length, color: '#82ca9d' },
      { name: 'Approved', value: reports.filter(r => r.status === 'approved').length, color: '#ffc658' }
    ].filter(s => s.value > 0);

    // Daily report frequency
    const reportFrequency = reports.reduce((acc, report) => {
      const date = format(parseISO(report.report_date), 'MMM dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const frequencyData = Object.entries(reportFrequency)
      .map(([date, count]) => ({ date, reports: count }))
      .sort((a, b) => new Date(a.date + ', 2024').getTime() - new Date(b.date + ', 2024').getTime());

    // Project progress comparison
    const projectProgress = projects.map(project => {
      const projectReports = reports.filter(r => r.project_id === project.id);
      const avgProgress = projectReports.length > 0
        ? projectReports.reduce((sum, r) => sum + (r.overall_progress_percentage || 0), 0) / projectReports.length
        : 0;
      const totalCrew = projectReports.reduce((sum, r) => sum + (r.crew_count || 0), 0);
      return {
        project: project.name,
        avgProgress: Math.round(avgProgress),
        totalReports: projectReports.length,
        totalCrew
      };
    }).filter(p => p.totalReports > 0);

    // Weekly summary
    const weeklyData = reports.reduce((acc, report) => {
      const weekStart = format(startOfWeek(parseISO(report.report_date)), 'MMM dd');
      if (!acc[weekStart]) {
        acc[weekStart] = {
          week: weekStart,
          reports: 0,
          avgProgress: 0,
          totalCrew: 0,
          safetyIncidents: 0,
          progressSum: 0
        };
      }
      acc[weekStart].reports += 1;
      acc[weekStart].totalCrew += report.crew_count || 0;
      acc[weekStart].safetyIncidents += report.safety_incidents || 0;
      acc[weekStart].progressSum += report.overall_progress_percentage || 0;
      acc[weekStart].avgProgress = Math.round(acc[weekStart].progressSum / acc[weekStart].reports);
      return acc;
    }, {} as Record<string, any>);

    const weeklyStats = Object.values(weeklyData);

    return {
      progressTrend,
      safetyByProject,
      crewUtilization,
      statusDistribution,
      frequencyData,
      projectProgress,
      weeklyStats
    };
  }, [reports, projects]);

  const totalReports = reports.length;
  const avgProgress = reports.length > 0
    ? Math.round(reports.reduce((sum, r) => sum + (r.overall_progress_percentage || 0), 0) / reports.length)
    : 0;
  const totalSafetyIncidents = reports.reduce((sum, r) => sum + (r.safety_incidents || 0), 0);
  const avgCrewSize = reports.length > 0
    ? Math.round(reports.reduce((sum, r) => sum + (r.crew_count || 0), 0) / reports.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{totalReports}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900">{avgProgress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Safety Incidents</p>
                <p className="text-2xl font-bold text-gray-900">{totalSafetyIncidents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Crew Size</p>
                <p className="text-2xl font-bold text-gray-900">{avgCrewSize}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Trend */}
        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress Trend Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.progressTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value}%`,
                    name === 'progress' ? 'Progress' : name
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="progress" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Report Status Distribution */}
        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Report Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Safety Incidents by Project */}
        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Safety Incidents by Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.safetyByProject}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="project" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="incidents" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Crew Utilization */}
        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Crew Utilization Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.crewUtilization}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="crew" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Project Comparison */}
      <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Project Progress Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.projectProgress} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="project" type="category" width={120} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'avgProgress' ? `${value}%` : value,
                  name === 'avgProgress' ? 'Avg Progress' : 
                  name === 'totalReports' ? 'Total Reports' : 'Total Crew'
                ]}
              />
              <Bar dataKey="avgProgress" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      {analytics.weeklyStats.length > 0 && (
        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="reports" fill="#8884d8" name="Reports" />
                <Bar yAxisId="right" dataKey="avgProgress" fill="#82ca9d" name="Avg Progress %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}