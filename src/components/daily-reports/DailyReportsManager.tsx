import React, { useState, useEffect } from 'react';
import { Calendar, Plus, FileText, TrendingUp, ArrowLeft, Download, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppHeader from '@/components/navigation/AppHeader';
import { DailyReportForm } from './DailyReportForm';
import { DailyReportsList } from './DailyReportsList';
import { DailyReportsAnalytics } from './DailyReportsAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';

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

export function DailyReportsManager() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedView, setSelectedView] = useState<'list' | 'analytics'>('list');
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('current-month');

  useEffect(() => {
    loadProjects();
    loadReports();
  }, [selectedProject, selectedStatus, selectedDateRange]);

  const loadProjects = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // First get the daily reports
      let query = supabase
        .from('daily_reports')
        .select('*')
        .order('report_date', { ascending: false });

      // Apply project filter
      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject);
      }

      // Apply status filter
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      // Apply date range filter
      if (selectedDateRange === 'current-month') {
        const now = new Date();
        query = query
          .gte('report_date', format(startOfMonth(now), 'yyyy-MM-dd'))
          .lte('report_date', format(endOfMonth(now), 'yyyy-MM-dd'));
      }

      const { data: reportsData, error: reportsError } = await query;
      if (reportsError) throw reportsError;

      // If we have reports, get the project and profile data separately
      if (reportsData && reportsData.length > 0) {
        const projectIds = [...new Set(reportsData.map(r => r.project_id))];
        const userIds = [...new Set(reportsData.map(r => r.created_by))];

        // Get project names
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds);

        // Get profile names
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        // Combine the data
        const enrichedReports = reportsData.map(report => ({
          ...report,
          projects: projectsData?.find(p => p.id === report.project_id) || { name: 'Unknown Project' },
          profiles: profilesData?.find(p => p.id === report.created_by) || { full_name: 'Unknown User' }
        }));

        setReports(enrichedReports as unknown as DailyReport[]);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "Error",
        description: "Failed to load daily reports.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportCreated = () => {
    setShowCreateForm(false);
    loadReports();
    toast({
      title: "Success",
      description: "Daily report created successfully.",
    });
  };

  const handleReportUpdated = () => {
    loadReports();
    toast({
      title: "Success",
      description: "Daily report updated successfully.",
    });
  };

  const handleReportDeleted = () => {
    loadReports();
    toast({
      title: "Success",
      description: "Daily report deleted successfully.",
    });
  };

  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    return (
      report.progress_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'submitted': return 'default';
      case 'approved': return 'default';
      default: return 'secondary';
    }
  };

  const exportReports = async () => {
    // Basic CSV export functionality
    const csvContent = [
      ['Date', 'Project', 'Status', 'Progress %', 'Crew Count', 'Safety Incidents', 'Summary'],
      ...filteredReports.map(report => [
        report.report_date,
        report.projects?.name || '',
        report.status,
        report.overall_progress_percentage || 0,
        report.crew_count || 0,
        report.safety_incidents || 0,
        (report.progress_summary || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-reports-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Reports exported successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <AppHeader />
      
      <main className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center space-y-6 animate-fade-in shadow-2xl bg-white/30 backdrop-blur-sm rounded-3xl p-8 border border-white/20 flex-1">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl backdrop-blur-sm border border-white/20 mb-4">
              <FileText className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Daily
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Reports
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Track daily progress, document activities, and monitor project performance with comprehensive daily reporting.
            </p>
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-8 border-0 bg-white/70 backdrop-blur-xl shadow-xl border-white/20">
          <CardHeader>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
                  <SelectTrigger className="w-40 bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Reports List
                      </div>
                    </SelectItem>
                    <SelectItem value="analytics">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Analytics
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-48 bg-white/80">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-40 bg-white/80">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                  <SelectTrigger className="w-48 bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current-month">Current Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 bg-white/80"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={exportReports}
                  className="bg-white/80"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>

                <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-600 hover:to-blue-600">
                      <Plus className="w-4 h-4 mr-2" />
                      New Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Daily Report</DialogTitle>
                    </DialogHeader>
                    <DailyReportForm
                      projects={projects}
                      onSubmit={handleReportCreated}
                      onCancel={() => setShowCreateForm(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 shadow-2xl rounded-2xl p-6 bg-white/10 backdrop-blur-sm border border-white/20">
          <Card className="border-0 bg-white/70 backdrop-blur-xl border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredReports.length}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 backdrop-blur-xl border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredReports.length > 0 
                      ? Math.round(filteredReports.reduce((sum, r) => sum + (r.overall_progress_percentage || 0), 0) / filteredReports.length)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 backdrop-blur-xl border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Safety Incidents</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredReports.reduce((sum, r) => sum + (r.safety_incidents || 0), 0)}
                  </p>
                </div>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">!</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/70 backdrop-blur-xl border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(filteredReports.map(r => r.project_id)).size}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {selectedView === 'list' && (
          <DailyReportsList
            reports={filteredReports}
            loading={loading}
            onReportUpdated={handleReportUpdated}
            onReportDeleted={handleReportDeleted}
            projects={projects}
          />
        )}

        {selectedView === 'analytics' && (
          <DailyReportsAnalytics
            reports={filteredReports}
            projects={projects}
          />
        )}
      </main>
    </div>
  );
}