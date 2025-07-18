import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DailyReportForm } from './DailyReportForm';
import { DailyReportView } from './DailyReportView';
import { Edit, Eye, Trash2, Calendar, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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

interface DailyReportsListProps {
  reports: DailyReport[];
  loading: boolean;
  onReportUpdated: () => void;
  onReportDeleted: () => void;
  projects: Project[];
}

export function DailyReportsList({ reports, loading, onReportUpdated, onReportDeleted, projects }: DailyReportsListProps) {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [editingReport, setEditingReport] = useState<string | null>(null);
  const [deletingReport, setDeletingReport] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<string | null>(null);

  const handleDelete = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('daily_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      setDeletingReport(null);
      onReportDeleted();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Error",
        description: "Failed to delete report.",
        variant: "destructive",
      });
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-0 bg-white/40 backdrop-blur-sm shadow-lg animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
        <CardContent className="p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Daily Reports</h3>
          <p className="text-gray-600 mb-6">
            Start documenting daily progress by creating your first report.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="border-0 bg-white/40 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                    {report.projects?.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {format(new Date(report.report_date), 'EEEE, MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(report.status)} className={getStatusColor(report.status)}>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Progress Summary */}
                {report.progress_summary && (
                  <div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {report.progress_summary}
                    </p>
                  </div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-600">Progress</p>
                      <p className="text-sm font-semibold">{report.overall_progress_percentage || 0}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Crew</p>
                      <p className="text-sm font-semibold">{report.crew_count || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Safety Incidents */}
                {(report.safety_incidents || 0) > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">
                      {report.safety_incidents} safety incident{report.safety_incidents !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Created By */}
                <div className="text-xs text-gray-500">
                  Created by {report.profiles?.full_name || 'Unknown'} on{' '}
                  {format(new Date(report.created_at), 'MMM d, h:mm a')}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingReport(report.id)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingReport(report.id)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingReport(report.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingReport} onOpenChange={() => setEditingReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Daily Report</DialogTitle>
          </DialogHeader>
          {editingReport && (
            <DailyReportForm
              projects={projects}
              reportId={editingReport}
              onSubmit={() => {
                setEditingReport(null);
                onReportUpdated();
              }}
              onCancel={() => setEditingReport(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daily Report Details</DialogTitle>
          </DialogHeader>
          {viewingReport && (
            <DailyReportView reportId={viewingReport} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingReport} onOpenChange={() => setDeletingReport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Daily Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this daily report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingReport && handleDelete(deletingReport)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}