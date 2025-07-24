import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorkflowStep {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  data: any;
}

interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  data: any;
}

interface GeneratedWorkflow {
  name: string;
  description: string;
  workflow_steps: WorkflowStep[];
  workflow_connections: WorkflowConnection[];
}

interface AIWorkflowGeneratorProps {
  formTemplateId: string;
  formTemplateName: string;
  isOpen: boolean;
  onClose: () => void;
  onWorkflowGenerated: (workflow: GeneratedWorkflow) => void;
}

const industries = [
  { value: "construction", label: "Construction" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "retail", label: "Retail" },
  { value: "government", label: "Government" },
  { value: "general", label: "General Business" }
];

const workflowTypes = [
  { value: "approval", label: "Approval Workflow", description: "Multi-step approval process with conditional routing" },
  { value: "review", label: "Review & Feedback", description: "Collaborative review process with stakeholder input" },
  { value: "compliance", label: "Compliance Check", description: "Regulatory and safety compliance verification" },
  { value: "escalation", label: "Escalation Process", description: "Automatic escalation based on criteria" },
  { value: "notification", label: "Notification Chain", description: "Sequential notification of stakeholders" }
];

export const AIWorkflowGenerator: React.FC<AIWorkflowGeneratorProps> = ({
  formTemplateId,
  formTemplateName,
  isOpen,
  onClose,
  onWorkflowGenerated,
}) => {
  const [industry, setIndustry] = useState("construction");
  const [workflowType, setWorkflowType] = useState("approval");
  const [businessContext, setBusinessContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState<GeneratedWorkflow | null>(null);

  const handleGenerate = async () => {
    if (!businessContext.trim()) {
      toast.error("Please provide business context for the workflow");
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-workflow', {
        body: {
          form_template_id: formTemplateId,
          business_context: businessContext,
          industry: industry,
          workflow_type: workflowType
        }
      });

      if (error) {
        console.error('Error generating workflow:', error);
        toast.error('Failed to generate workflow. Please try again.');
        return;
      }

      if (data?.success && data?.workflow) {
        setGeneratedWorkflow(data.workflow);
        toast.success('Workflow generated successfully!');
      } else {
        toast.error('Failed to generate workflow. Please try again.');
      }
    } catch (error) {
      console.error('Error generating workflow:', error);
      toast.error('Failed to generate workflow. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptWorkflow = () => {
    if (generatedWorkflow) {
      onWorkflowGenerated(generatedWorkflow);
      onClose();
      setGeneratedWorkflow(null);
      setBusinessContext("");
    }
  };

  const handleRegenerate = () => {
    setGeneratedWorkflow(null);
  };

  const handleClose = () => {
    onClose();
    setGeneratedWorkflow(null);
    setBusinessContext("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Workflow Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Generating workflow for:</h3>
            <Badge variant="outline" className="text-sm">
              {formTemplateName}
            </Badge>
          </div>

          {!generatedWorkflow ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind.value} value={ind.value}>
                          {ind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workflow-type">Workflow Type</Label>
                  <Select value={workflowType} onValueChange={setWorkflowType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select workflow type" />
                    </SelectTrigger>
                    <SelectContent>
                      {workflowTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-context">Business Context & Requirements</Label>
                <Textarea
                  id="business-context"
                  placeholder="Describe your approval process, stakeholders involved, approval criteria, compliance requirements, etc. For example: 'Safety forms require supervisor approval, then safety manager review if high-risk activities are involved. Budget requests over $5,000 need additional finance approval.'"
                  value={businessContext}
                  onChange={(e) => setBusinessContext(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workflowTypes.map((type) => (
                  <Card 
                    key={type.value} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      workflowType === type.value ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setWorkflowType(type.value)}
                  >
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">{type.label}</h4>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={isGenerating || !businessContext.trim()}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Workflow
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-green-800">Workflow Generated Successfully!</h3>
                </div>
                <p className="text-sm text-green-700">
                  AI has analyzed your form and created a tailored workflow based on your requirements.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Generated Workflow</h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium">{generatedWorkflow.name}</h4>
                    <p className="text-sm text-muted-foreground">{generatedWorkflow.description}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline">
                        {generatedWorkflow.workflow_steps.length} Steps
                      </Badge>
                      <Badge variant="outline">
                        {generatedWorkflow.workflow_connections.length} Connections
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Workflow Steps Preview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {generatedWorkflow.workflow_steps.map((step) => (
                      <div key={step.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                        <div className={`w-2 h-2 rounded-full ${
                          step.type === 'start' ? 'bg-green-500' :
                          step.type === 'end' ? 'bg-red-500' :
                          step.type === 'approval' ? 'bg-blue-500' :
                          step.type === 'condition' ? 'bg-yellow-500' :
                          step.type === 'notification' ? 'bg-purple-500' : 'bg-gray-500'
                        }`} />
                        <span className="capitalize">{step.type}:</span>
                        <span className="font-medium">{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleRegenerate}>
                  Regenerate
                </Button>
                <Button onClick={handleAcceptWorkflow}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Use This Workflow
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};