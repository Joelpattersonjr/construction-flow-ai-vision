import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  Users, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Info
} from 'lucide-react';
import { exportUtils } from '@/utils/exportUtils';
import { importUtils } from '@/utils/importUtils';
import { useToast } from '@/hooks/use-toast';

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  profiles: {
    full_name: string;
    job_title: string;
  };
  created_at?: string;
}

interface PermissionTemplate {
  id: string;
  name: string;
  description?: string;
  role: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  is_default: boolean;
  created_at: string;
}

interface AuditLogEntry {
  id: string;
  action_type: string;
  created_at: string;
  metadata?: any;
  profiles?: { full_name: string | null } | null;
  target_profiles?: { full_name: string | null } | null;
}

interface ExportImportDialogProps {
  projectId: string;
  projectName: string;
  members: ProjectMember[];
  templates: PermissionTemplate[];
  auditLogs: AuditLogEntry[];
  onImportComplete: () => void;
}

const ExportImportDialog: React.FC<ExportImportDialogProps> = ({
  projectId,
  projectName,
  members,
  templates,
  auditLogs,
  onImportComplete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportType, setExportType] = useState<'members' | 'templates' | 'audit'>('members');
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'json' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      switch (exportType) {
        case 'members':
          if (exportFormat === 'csv') {
            exportUtils.exportMembersToCSV(members, projectName);
          } else if (exportFormat === 'excel') {
            exportUtils.exportMembersToExcel(members, projectName);
          }
          break;
        case 'templates':
          exportUtils.exportTemplatesToJSON(templates, projectName);
          break;
        case 'audit':
          const range = dateRange.start && dateRange.end 
            ? { start: new Date(dateRange.start), end: new Date(dateRange.end) }
            : undefined;
          
          if (exportFormat === 'csv') {
            exportUtils.exportAuditLogsToCSV(auditLogs, projectName, range);
          } else if (exportFormat === 'pdf') {
            exportUtils.exportAuditLogsToPDF(auditLogs, projectName, range);
          }
          break;
      }
      
      toast({
        title: "Export successful",
        description: `${exportType} exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgress(0);
    setImportResults(null);

    try {
      if (exportType === 'members') {
        // Handle CSV/Excel import for members
        let data: any[] = [];
        
        if (file.type === 'text/csv') {
          const text = await file.text();
          data = importUtils.parseCSV(text);
        } else if (file.type.includes('sheet')) {
          data = await importUtils.parseExcel(file);
        }

        setImportProgress(30);
        
        const result = await importUtils.importMembers(data);
        setImportProgress(100);
        setImportResults(result);
        
        if (result.success) {
          toast({
            title: "Import successful",
            description: `${result.data?.length || 0} members imported successfully`,
          });
          onImportComplete();
        }
      } else if (exportType === 'templates') {
        // Handle JSON import for templates
        const text = await file.text();
        setImportProgress(30);
        
        const result = await importUtils.importTemplates(text);
        setImportProgress(100);
        setImportResults(result);
        
        if (result.success) {
          toast({
            title: "Import successful",
            description: `${result.data?.length || 0} templates imported successfully`,
          });
          onImportComplete();
        }
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    if (exportType === 'members') {
      const template = importUtils.generateMemberImportTemplate();
      const blob = new Blob([template], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'member_import_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportType === 'templates') {
      const template = importUtils.generateTemplateImportTemplate();
      const blob = new Blob([template], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_import_template.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getExportFormatOptions = () => {
    switch (exportType) {
      case 'members':
        return [
          { value: 'csv', label: 'CSV', icon: FileText },
          { value: 'excel', label: 'Excel', icon: FileSpreadsheet },
        ];
      case 'templates':
        return [
          { value: 'json', label: 'JSON', icon: FileText },
        ];
      case 'audit':
        return [
          { value: 'csv', label: 'CSV', icon: FileText },
          { value: 'pdf', label: 'PDF', icon: FileText },
        ];
      default:
        return [];
    }
  };

  const getAcceptedFileTypes = () => {
    switch (exportType) {
      case 'members':
        return '.csv,.xlsx,.xls';
      case 'templates':
        return '.json';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export/Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export/Import Data</DialogTitle>
          <DialogDescription>
            Export project data or import data from external sources
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Data
                </CardTitle>
                <CardDescription>
                  Export your project data in various formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exportType">Data Type</Label>
                    <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="members">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Project Members ({members.length})
                          </div>
                        </SelectItem>
                        <SelectItem value="templates">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Permission Templates ({templates.length})
                          </div>
                        </SelectItem>
                        <SelectItem value="audit">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Audit Logs ({auditLogs.length})
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="exportFormat">Format</Label>
                    <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getExportFormatOptions().map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {exportType === 'audit' && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <Label>Date Range (Optional)</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <Label htmlFor="startDate" className="text-sm">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="endDate" className="text-sm">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={handleExport} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export {exportType}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Data
                </CardTitle>
                <CardDescription>
                  Import data from external files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="importType">Data Type</Label>
                  <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="members">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Project Members
                        </div>
                      </SelectItem>
                      <SelectItem value="templates">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Permission Templates
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Download the template file to see the required format for importing.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="importFile">Select File</Label>
                  <Input
                    id="importFile"
                    type="file"
                    accept={getAcceptedFileTypes()}
                    onChange={handleImport}
                    disabled={importing}
                    ref={fileInputRef}
                  />
                </div>

                {importing && (
                  <div className="space-y-2">
                    <Label>Import Progress</Label>
                    <Progress value={importProgress} className="w-full" />
                  </div>
                )}

                {importResults && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <Label>Import Results</Label>
                      <div className="mt-2 space-y-2">
                        {importResults.success ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Successfully imported {importResults.data?.length || 0} items</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>Import failed</span>
                          </div>
                        )}

                        {importResults.errors.length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-red-600">Errors:</Label>
                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              {importResults.errors.map((error: string, index: number) => (
                                <div key={index}>• {error}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        {importResults.warnings.length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-yellow-600">Warnings:</Label>
                            <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                              {importResults.warnings.map((warning: string, index: number) => (
                                <div key={index}>• {warning}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ExportImportDialog;