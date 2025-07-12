import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { exportUtils, TaskExportData, ProjectExportData, ExportOptions } from '@/utils/exportUtils';

interface ExportDialogProps {
  tasks?: TaskExportData[];
  projects?: ProjectExportData[];
  title?: string;
  children?: React.ReactNode;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  tasks = [],
  projects = [],
  title = "Export Data",
  children
}) => {
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState<'tasks' | 'projects' | 'combined'>('combined');
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('excel');
  const [customFilename, setCustomFilename] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const getFormatIcon = (formatType: string) => {
    switch (formatType) {
      case 'csv': return File;
      case 'excel': return FileSpreadsheet;
      case 'pdf': return FileText;
      default: return FileText;
    }
  };

  const getFormatColor = (formatType: string) => {
    switch (formatType) {
      case 'csv': return 'bg-blue-500';
      case 'excel': return 'bg-green-500';
      case 'pdf': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const options: ExportOptions = {
        format,
        filename: customFilename || undefined,
        title: title
      };

      switch (exportType) {
        case 'tasks':
          if (tasks.length === 0) {
            toast({
              title: "No data to export",
              description: "There are no tasks to export.",
              variant: "destructive",
            });
            return;
          }
          exportUtils.exportTasks(tasks, options);
          break;

        case 'projects':
          if (projects.length === 0) {
            toast({
              title: "No data to export",
              description: "There are no projects to export.",
              variant: "destructive",
            });
            return;
          }
          exportUtils.exportProjects(projects, options);
          break;

        case 'combined':
          if (tasks.length === 0 && projects.length === 0) {
            toast({
              title: "No data to export",
              description: "There are no tasks or projects to export.",
              variant: "destructive",
            });
            return;
          }
          exportUtils.exportCombinedReport(tasks, projects, options);
          break;
      }

      toast({
        title: "Export successful",
        description: `Your ${exportType} data has been exported as ${format.toUpperCase()}.`,
      });

      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getExportPreview = () => {
    switch (exportType) {
      case 'tasks':
        return {
          count: tasks.length,
          type: 'tasks',
          description: 'Export all task data including titles, status, priority, assignees, and dates.'
        };
      case 'projects':
        return {
          count: projects.length,
          type: 'projects',
          description: 'Export all project data including details, status, dates, and owner information.'
        };
      case 'combined':
        return {
          count: tasks.length + projects.length,
          type: 'items',
          description: 'Export both tasks and projects data in a comprehensive report.'
        };
    }
  };

  const preview = getExportPreview();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What would you like to export?</Label>
            <div className="grid grid-cols-1 gap-3">
              {tasks.length > 0 && (
                <Card 
                  className={`cursor-pointer transition-all ${
                    exportType === 'tasks' ? 'ring-2 ring-primary' : 'hover:shadow-md'
                  }`}
                  onClick={() => setExportType('tasks')}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Tasks Only
                      <Badge variant="secondary">{tasks.length} items</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs">
                      Export task data including titles, status, priority, and assignments.
                    </CardDescription>
                  </CardContent>
                </Card>
              )}

              {projects.length > 0 && (
                <Card 
                  className={`cursor-pointer transition-all ${
                    exportType === 'projects' ? 'ring-2 ring-primary' : 'hover:shadow-md'
                  }`}
                  onClick={() => setExportType('projects')}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Projects Only
                      <Badge variant="secondary">{projects.length} items</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs">
                      Export project data including details, status, and owner information.
                    </CardDescription>
                  </CardContent>
                </Card>
              )}

              {tasks.length > 0 && projects.length > 0 && (
                <Card 
                  className={`cursor-pointer transition-all ${
                    exportType === 'combined' ? 'ring-2 ring-primary' : 'hover:shadow-md'
                  }`}
                  onClick={() => setExportType('combined')}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      Combined Report
                      <Badge variant="secondary">{tasks.length + projects.length} items</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs">
                      Export both tasks and projects in a comprehensive report.
                    </CardDescription>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Separator />

          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-3 gap-3">
              {(['csv', 'excel', 'pdf'] as const).map((formatOption) => {
                const Icon = getFormatIcon(formatOption);
                const colorClass = getFormatColor(formatOption);
                
                return (
                  <Card 
                    key={formatOption}
                    className={`cursor-pointer transition-all ${
                      format === formatOption ? 'ring-2 ring-primary' : 'hover:shadow-md'
                    }`}
                    onClick={() => setFormat(formatOption)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-8 h-8 rounded mx-auto mb-2 flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-sm font-medium">{formatOption.toUpperCase()}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatOption === 'csv' && 'Spreadsheet data'}
                        {formatOption === 'excel' && 'Excel workbook'}
                        {formatOption === 'pdf' && 'PDF document'}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Custom Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename" className="text-sm font-medium">
              Custom Filename (optional)
            </Label>
            <Input
              id="filename"
              placeholder={`e.g., my_${exportType}_export`}
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use auto-generated filename with current date
            </p>
          </div>

          {/* Export Preview */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">
                    Ready to export {preview.count} {preview.type}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {preview.description}
                  </div>
                </div>
                <Badge variant="outline">
                  {format.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};