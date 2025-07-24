import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, User, Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import { WorkflowVisualization } from "./WorkflowVisualization";

interface WorkflowStep {
  id: string;
  type: 'start' | 'approval' | 'notification' | 'condition' | 'end';
  label: string;
  assignee?: string;
  action?: string;
  description?: string;
  position: { x: number; y: number };
  order: number;
}

interface WorkflowConnection {
  source: string;
  target: string;
  condition_field?: string;
  condition_operator?: string;
  condition_value?: string;
  label?: string;
}

interface WorkflowPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: {
    id: string;
    name: string;
    description?: string;
    workflow_steps: WorkflowStep[];
    workflow_connections: WorkflowConnection[];
    form_templates?: {
      name: string;
    };
    profiles?: {
      full_name: string;
    };
    created_at: string;
    updated_at: string;
  } | null;
}

const getStepIcon = (type: string) => {
  switch (type) {
    case 'start':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'approval':
      return <User className="h-4 w-4 text-primary" />;
    case 'notification':
      return <Mail className="h-4 w-4 text-blue-500" />;
    case 'condition':
      return <span className="text-orange-500 font-bold text-sm">?</span>;
    case 'end':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStepTypeLabel = (type: string) => {
  switch (type) {
    case 'start': return 'Start';
    case 'approval': return 'Approval';
    case 'notification': return 'Notification';
    case 'condition': return 'Condition';
    case 'end': return 'End';
    default: return 'Step';
  }
};

export const WorkflowPreviewDialog: React.FC<WorkflowPreviewDialogProps> = ({
  isOpen,
  onClose,
  workflow,
}) => {
  if (!workflow) return null;

  // Add safety checks for workflow properties
  const workflowSteps = workflow.workflow_steps || [];
  const workflowConnections = workflow.workflow_connections || [];
  const sortedSteps = [...workflowSteps].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <DialogTitle>Workflow Preview: {workflow.name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex h-full overflow-hidden">
          {/* Workflow Visualization */}
          <div className="flex-1 p-4">
            <WorkflowVisualization 
              steps={workflowSteps}
              connections={workflowConnections}
            />
          </div>

          {/* Workflow Details Sidebar */}
          <div className="w-80 border-l bg-muted/20 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Workflow Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Workflow Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">{workflow.name}</p>
                    {workflow.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {workflow.description}
                      </p>
                    )}
                  </div>
                  
                  {workflow.form_templates && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Form Template</p>
                      <p className="text-sm">{workflow.form_templates.name}</p>
                    </div>
                  )}

                  {workflow.profiles && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Created By</p>
                      <p className="text-sm">{workflow.profiles.full_name}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Created</p>
                    <p className="text-sm">
                      {new Date(workflow.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Steps */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Workflow Steps ({sortedSteps.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sortedSteps.map((step, index) => (
                      <div key={step.id} className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background border text-xs font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getStepIcon(step.type)}
                              <Badge variant="outline" className="text-xs">
                                {getStepTypeLabel(step.type)}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{step.label}</p>
                            {step.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {step.description}
                              </p>
                            )}
                            {step.assignee && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Assignee: {step.assignee}
                              </p>
                            )}
                            {step.action && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Action: {step.action}
                              </p>
                            )}
                          </div>
                        </div>
                        {index < sortedSteps.length - 1 && (
                          <Separator className="ml-9" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Connections */}
              {workflowConnections.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Connections ({workflowConnections.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {workflowConnections.map((connection, index) => (
                        <div key={index} className="text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>Step {connection.source}</span>
                            <span>→</span>
                            <span>Step {connection.target}</span>
                          </div>
                          {connection.label && (
                            <p className="text-muted-foreground mt-1">
                              Label: {connection.label}
                            </p>
                          )}
                          {connection.condition_field && (
                            <p className="text-muted-foreground mt-1">
                              Condition: {connection.condition_field} {connection.condition_operator} {connection.condition_value}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};