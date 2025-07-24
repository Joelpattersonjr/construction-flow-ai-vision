import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, AlertCircle } from "lucide-react";

interface FormTemplate {
  id: string;
  name: string;
  category: string;
}

interface FormTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  formTemplates: FormTemplate[];
  onSelectTemplate: (template: FormTemplate) => void;
}

const categoryColors = {
  safety: "bg-red-100 text-red-800",
  quality: "bg-blue-100 text-blue-800", 
  documentation: "bg-green-100 text-green-800",
  compliance: "bg-yellow-100 text-yellow-800",
  inspection: "bg-purple-100 text-purple-800",
  general: "bg-gray-100 text-gray-800"
};

export const FormTemplateSelector: React.FC<FormTemplateSelectorProps> = ({
  isOpen,
  onClose,
  formTemplates,
  onSelectTemplate,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Form Template for AI Workflow</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose a form template to generate an intelligent approval workflow. The AI will analyze your form fields and create appropriate approval steps.
          </p>

          {!formTemplates || formTemplates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Form Templates Found</h3>
                <p className="text-muted-foreground mb-4">
                  You need to create form templates before generating workflows.
                </p>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formTemplates.map((template) => {
                const colorClass = categoryColors[template.category as keyof typeof categoryColors] || categoryColors.general;
                
                return (
                  <Card 
                    key={template.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/50"
                    onClick={() => {
                      onSelectTemplate(template);
                      onClose();
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-base">{template.name}</CardTitle>
                        </div>
                        <Badge className={colorClass}>
                          {template.category.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        Generate workflow for this {template.category} form
                      </p>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTemplate(template);
                          onClose();
                        }}
                      >
                        Generate Workflow
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};