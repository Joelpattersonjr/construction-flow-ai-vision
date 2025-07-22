import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Download, Search, Filter, Calendar, User, FileText } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { PDFGenerator, usePDFGenerator } from './PDFGenerator';

interface FormSubmission {
  id: string;
  form_template_id: string;
  project_id: string;
  submitted_by: string;
  submitted_at: string;
  status: string;
  submission_data: any;
  form_templates: {
    name: string;
    category: string;
  };
  projects: {
    name: string;
  };
  profiles: {
    full_name: string;
  };
}

const statusColors = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  needs_info: "bg-orange-100 text-orange-800",
};

export const FormSubmissions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const { generateBulkPDF } = usePDFGenerator();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['form-submissions', searchTerm, statusFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('form_submissions')
        .select(`
          *,
          form_templates(name, category),
          projects(name),
          profiles(full_name)
        `)
        .order('submitted_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data as FormSubmission[];

      if (searchTerm) {
        filteredData = filteredData.filter(submission =>
          submission.form_templates?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.projects?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (categoryFilter !== 'all') {
        filteredData = filteredData.filter(submission =>
          submission.form_templates?.category === categoryFilter
        );
      }

      return filteredData;
    },
  });

  const handleViewSubmission = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
  };

  const handleExportAll = () => {
    if (submissions && submissions.length > 0) {
      generateBulkPDF(submissions);
      toast.success('Bulk PDF export completed');
    } else {
      toast.error('No submissions to export');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="needs_info">Needs Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="daily_log">Daily Log</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="rfi">RFI</SelectItem>
                <SelectItem value="incident">Incident</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full" onClick={handleExportAll}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <div className="space-y-4">
        {!submissions || submissions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No submissions found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Form submissions will appear here once users start filling out your forms.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {submission.form_templates?.name}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {submission.profiles?.full_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(submission.submitted_at), 'MMM dd, yyyy')}
                      </span>
                      {submission.projects?.name && (
                        <span>Project: {submission.projects.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={statusColors[submission.status as keyof typeof statusColors] || statusColors.submitted}
                    >
                      {submission.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">
                      {submission.form_templates?.category?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Submitted {formatDistanceToNow(new Date(submission.submitted_at))} ago
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSubmission(submission)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <PDFGenerator 
                      submission={submission}
                      onGenerate={() => toast.success('PDF generated successfully')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Submission Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => {
        if (!open) setSelectedSubmission(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedSubmission?.form_templates?.name} - Submission Details
            </DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Submission Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submitted By</p>
                  <p>{selectedSubmission.profiles.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date Submitted</p>
                  <p>{format(new Date(selectedSubmission.submitted_at), 'PPP')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedSubmission.status as keyof typeof statusColors]}>
                    {selectedSubmission.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project</p>
                  <p>{selectedSubmission.projects?.name || 'No project assigned'}</p>
                </div>
              </div>

              {/* Form Data */}
              <div>
                <h3 className="text-lg font-medium mb-4">Form Responses</h3>
                <div className="space-y-3">
                  {Object.entries(selectedSubmission.submission_data).map(([key, value]) => {
                    if (key === 'signatures' || key === 'geolocation' || key === 'attachments') return null;
                    
                    return (
                      <div key={key} className="flex justify-between items-start p-3 bg-muted/30 rounded">
                        <span className="font-medium text-sm text-muted-foreground min-w-[150px]">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                        </span>
                        <span className="text-sm flex-1 text-right">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || 'N/A')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Signatures */}
              {selectedSubmission.submission_data.signatures && Object.keys(selectedSubmission.submission_data.signatures).length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Digital Signatures</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedSubmission.submission_data.signatures).map(([fieldId, signature]) => (
                      <div key={fieldId} className="flex justify-between items-center p-3 bg-muted/30 rounded">
                        <span className="font-medium text-sm">{fieldId}:</span>
                        <span className="text-sm font-mono">{signature as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              {selectedSubmission.submission_data.geolocation && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Location Information</h3>
                  <div className="p-3 bg-muted/30 rounded">
                    <p className="text-sm">
                      <strong>Coordinates:</strong> {selectedSubmission.submission_data.geolocation.lat}, {selectedSubmission.submission_data.geolocation.lng}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <PDFGenerator 
                  submission={selectedSubmission}
                  onGenerate={() => toast.success('PDF generated successfully')}
                />
                <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};