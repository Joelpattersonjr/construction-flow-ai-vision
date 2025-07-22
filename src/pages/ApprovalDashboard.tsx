import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Eye, Calendar, User, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { AppLayout } from '@/components/layout/AppLayout';

interface WorkflowApproval {
  id: string;
  step_id: string;
  status: string;
  assignee_email: string;
  decision_reason?: string;
  decision_made_at?: string;
  decision_made_by?: string;
  expires_at?: string;
  created_at: string;
  workflow_executions: {
    id: string;
    status: string;
    execution_data: any;
    form_submissions: {
      id: string;
      submission_data: any;
      submitted_at: string;
      profiles: {
        full_name: string;
        email: string;
      };
    };
    workflows: {
      id: string;
      name: string;
      description?: string;
      workflow_config: any;
    };
  };
}

export const ApprovalDashboard: React.FC = () => {
  const [approvals, setApprovals] = useState<WorkflowApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<WorkflowApproval | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('workflow_approvals')
        .select(`
          *,
          workflow_executions (
            id,
            status,
            execution_data,
            workflows (
              id,
              name,
              description,
              workflow_config
            ),
            form_submissions (
              id,
              submission_data,
              submitted_at,
              profiles (
                full_name,
                email
              )
            )
          )
        `)
        .or(`assignee_id.eq.${user.user.id},assignee_email.eq.${user.user.email}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApprovals(data || []);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast.error('Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (approvalId: string, decision: 'approved' | 'rejected') => {
    if (!decisionReason.trim()) {
      toast.error('Please provide a reason for your decision');
      return;
    }

    setSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('handle-approval', {
        body: {
          approval_id: approvalId,
          decision,
          reason: decisionReason,
          user_id: user.user.id
        }
      });

      if (error) throw error;

      toast.success(`Approval ${decision} successfully`);
      setSelectedApproval(null);
      setDecisionReason('');
      await fetchApprovals();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Failed to process approval');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getWorkflowStep = (approval: WorkflowApproval) => {
    const config = approval.workflow_executions.workflows.workflow_config;
    const step = config?.workflow_steps?.find((s: any) => s.id === approval.step_id);
    return step?.label || `Step ${approval.step_id}`;
  };

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const completedApprovals = approvals.filter(a => a.status !== 'pending');

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4 w-64"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <CheckCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Approval Dashboard</h1>
          <p className="text-muted-foreground">Manage workflow approvals and reviews</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            History ({completedApprovals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No pending approvals</h3>
                <p className="text-muted-foreground">You're all caught up! No workflows are waiting for your approval.</p>
              </CardContent>
            </Card>
          ) : (
            pendingApprovals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onSelect={setSelectedApproval}
                getStatusBadge={getStatusBadge}
                getWorkflowStep={getWorkflowStep}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {completedApprovals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No approval history</h3>
                <p className="text-muted-foreground">Your approval history will appear here once you start processing workflows.</p>
              </CardContent>
            </Card>
          ) : (
            completedApprovals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onSelect={setSelectedApproval}
                getStatusBadge={getStatusBadge}
                getWorkflowStep={getWorkflowStep}
                isHistory
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Approval Detail Dialog */}
      {selectedApproval && (
        <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Approval Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Workflow Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Workflow Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Workflow</Label>
                      <p className="text-sm">{selectedApproval.workflow_executions.workflows.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Step</Label>
                      <p className="text-sm">{getWorkflowStep(selectedApproval)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="pt-1">{getStatusBadge(selectedApproval.status)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Submitted</Label>
                      <p className="text-sm">{format(new Date(selectedApproval.created_at), 'PPpp')}</p>
                    </div>
                  </div>
                  {selectedApproval.workflow_executions.workflows.description && (
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground">{selectedApproval.workflow_executions.workflows.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Form Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Form Submission Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="text-sm font-medium">Submitted By</Label>
                        <p className="text-sm">{selectedApproval.workflow_executions.form_submissions.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{selectedApproval.workflow_executions.form_submissions.profiles?.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Submitted At</Label>
                        <p className="text-sm">{format(new Date(selectedApproval.workflow_executions.form_submissions.submitted_at), 'PPpp')}</p>
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4">
                      <Label className="text-sm font-medium mb-2 block">Submission Data</Label>
                      <pre className="text-xs overflow-x-auto bg-background rounded p-3 border">
                        {JSON.stringify(selectedApproval.workflow_executions.form_submissions.submission_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Decision Section */}
              {selectedApproval.status === 'pending' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Make Decision</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="decision-reason">Reason for Decision</Label>
                      <Textarea
                        id="decision-reason"
                        value={decisionReason}
                        onChange={(e) => setDecisionReason(e.target.value)}
                        placeholder="Please provide a reason for your approval or rejection..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleDecision(selectedApproval.id, 'approved')}
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleDecision(selectedApproval.id, 'rejected')}
                        disabled={submitting}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Decision History */}
              {selectedApproval.status !== 'pending' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Decision Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Decision</Label>
                        <div className="pt-1">{getStatusBadge(selectedApproval.status)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Decision Date</Label>
                        <p className="text-sm">{selectedApproval.decision_made_at ? format(new Date(selectedApproval.decision_made_at), 'PPpp') : 'N/A'}</p>
                      </div>
                    </div>
                    {selectedApproval.decision_reason && (
                      <div>
                        <Label className="text-sm font-medium">Reason</Label>
                        <p className="text-sm bg-muted/50 rounded p-3 mt-1">{selectedApproval.decision_reason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </AppLayout>
  );
};

interface ApprovalCardProps {
  approval: WorkflowApproval;
  onSelect: (approval: WorkflowApproval) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getWorkflowStep: (approval: WorkflowApproval) => string;
  isHistory?: boolean;
}

const ApprovalCard: React.FC<ApprovalCardProps> = ({
  approval,
  onSelect,
  getStatusBadge,
  getWorkflowStep,
  isHistory = false
}) => {
  const isExpired = approval.expires_at && new Date(approval.expires_at) < new Date();
  
  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      approval.status === 'pending' && !isExpired ? 'border-primary/50' : ''
    } ${isExpired ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">{approval.workflow_executions.workflows.name}</h3>
              {getStatusBadge(approval.status)}
              {isExpired && <Badge variant="destructive">Expired</Badge>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Step:</span>
                <span>{getWorkflowStep(approval)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Created:</span>
                <span>{format(new Date(approval.created_at), 'MMM d, yyyy')}</span>
              </div>
              {approval.expires_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Expires:</span>
                  <span className={isExpired ? 'text-destructive' : ''}>
                    {format(new Date(approval.expires_at), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
            
            {approval.workflow_executions.workflows.description && (
              <p className="text-sm text-muted-foreground">
                {approval.workflow_executions.workflows.description}
              </p>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(approval)}
            className="ml-4"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};