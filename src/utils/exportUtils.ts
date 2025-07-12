import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Type definitions for existing permissions exports
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

// New type definitions for comprehensive exports
export interface TaskExportData {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: {
    full_name: string;
  };
  project?: {
    name: string;
  };
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectExportData {
  id: string;
  name: string;
  project_number?: string;
  address?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  owner_name?: string;
  owner_company?: string;
  created_at: string;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filename?: string;
  title?: string;
}

export const exportUtils = {
  // Export project members to CSV
  exportMembersToCSV(members: ProjectMember[], projectName: string) {
    const csvData = members.map(member => ({
      'Full Name': member.profiles?.full_name || 'Unknown',
      'Job Title': member.profiles?.job_title || '',
      'Role': member.role,
      'Read Access': member.permissions.read ? 'Yes' : 'No',
      'Write Access': member.permissions.write ? 'Yes' : 'No',
      'Admin Access': member.permissions.admin ? 'Yes' : 'No',
      'Join Date': member.created_at ? new Date(member.created_at).toLocaleDateString() : '',
    }));

    const csv = this.convertToCSV(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${projectName}_members_${new Date().toISOString().split('T')[0]}.csv`);
  },

  // Export project members to Excel
  exportMembersToExcel(members: ProjectMember[], projectName: string) {
    const wsData = [
      ['Project Members Export'],
      ['Project:', projectName],
      ['Export Date:', new Date().toLocaleDateString()],
      ['Total Members:', members.length.toString()],
      [],
      ['Full Name', 'Job Title', 'Role', 'Read Access', 'Write Access', 'Admin Access', 'Join Date'],
      ...members.map(member => [
        member.profiles?.full_name || 'Unknown',
        member.profiles?.job_title || '',
        member.role,
        member.permissions.read ? 'Yes' : 'No',
        member.permissions.write ? 'Yes' : 'No',
        member.permissions.admin ? 'Yes' : 'No',
        member.created_at ? new Date(member.created_at).toLocaleDateString() : '',
      ])
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Style the header
    ws['!cols'] = [
      { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    XLSX.writeFile(wb, `${projectName}_members_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  // Export permission templates to JSON
  exportTemplatesToJSON(templates: PermissionTemplate[], companyName: string) {
    const exportData = {
      export_info: {
        company_name: companyName,
        export_date: new Date().toISOString(),
        total_templates: templates.length,
        version: '1.0'
      },
      templates: templates.map(template => ({
        name: template.name,
        description: template.description,
        role: template.role,
        permissions: template.permissions,
        is_default: template.is_default,
        created_at: template.created_at,
      }))
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    saveAs(blob, `permission_templates_${new Date().toISOString().split('T')[0]}.json`);
  },

  // Export audit logs to CSV
  exportAuditLogsToCSV(auditLogs: AuditLogEntry[], projectName: string, dateRange?: { start: Date; end: Date }) {
    const csvData = auditLogs.map(log => ({
      'Date & Time': new Date(log.created_at).toLocaleString(),
      'Action': this.formatActionType(log.action_type),
      'Performed By': log.profiles?.full_name || 'Unknown User',
      'Target User': log.target_profiles?.full_name || 'N/A',
      'Details': this.formatLogDetails(log),
    }));

    const csv = this.convertToCSV(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    const dateRangeStr = dateRange 
      ? `_${dateRange.start.toISOString().split('T')[0]}_to_${dateRange.end.toISOString().split('T')[0]}`
      : `_${new Date().toISOString().split('T')[0]}`;
    
    saveAs(blob, `${projectName}_audit_logs${dateRangeStr}.csv`);
  },

  // Export audit logs to PDF
  exportAuditLogsToPDF(auditLogs: AuditLogEntry[], projectName: string, dateRange?: { start: Date; end: Date }) {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Audit Log Report', 20, 20);
    
    // Project info
    doc.setFontSize(12);
    doc.text(`Project: ${projectName}`, 20, 35);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, 45);
    
    if (dateRange) {
      doc.text(`Date Range: ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`, 20, 55);
    }
    
    doc.text(`Total Entries: ${auditLogs.length}`, 20, 65);

    // Table data
    const tableData = auditLogs.map(log => [
      new Date(log.created_at).toLocaleDateString(),
      new Date(log.created_at).toLocaleTimeString(),
      this.formatActionType(log.action_type),
      log.profiles?.full_name || 'Unknown User',
      log.target_profiles?.full_name || 'N/A',
      this.formatLogDetails(log),
    ]);

    // Create table
    autoTable(doc, {
      head: [['Date', 'Time', 'Action', 'Performed By', 'Target User', 'Details']],
      body: tableData,
      startY: 75,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 40 },
        4: { cellWidth: 40 },
        5: { cellWidth: 50 },
      },
    });

    const dateRangeStr = dateRange 
      ? `_${dateRange.start.toISOString().split('T')[0]}_to_${dateRange.end.toISOString().split('T')[0]}`
      : `_${new Date().toISOString().split('T')[0]}`;
    
    doc.save(`${projectName}_audit_logs${dateRangeStr}.pdf`);
  },

  // Helper functions
  convertToCSV(data: any[]) {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]?.toString() || '';
          // Escape commas and quotes
          return value.includes(',') || value.includes('"') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  },

  formatActionType(actionType: string) {
    switch (actionType) {
      case 'member_added': return 'Member Added';
      case 'member_removed': return 'Member Removed';
      case 'role_changed': return 'Role Changed';
      case 'permissions_updated': return 'Permissions Updated';
      default: return actionType;
    }
  },

  formatLogDetails(log: AuditLogEntry) {
    const metadata = log.metadata || {};
    switch (log.action_type) {
      case 'member_added':
        return `Added ${metadata.memberName || 'member'} with role: ${metadata.role || 'unknown'}`;
      case 'member_removed':
        return `Removed ${metadata.memberName || 'member'}`;
      case 'role_changed':
        return `Changed role from ${metadata.oldRole || 'unknown'} to ${metadata.newRole || 'unknown'}`;
      case 'permissions_updated':
        return `Updated permissions for ${metadata.memberName || 'member'}`;
      default:
        return 'Activity logged';
    }
  },

  // === NEW COMPREHENSIVE EXPORT FUNCTIONS ===

  // Helper function to format dates
  formatDate(dateString?: string): string {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch {
      return dateString;
    }
  },

  formatDateTime(dateString?: string): string {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
    } catch {
      return dateString;
    }
  },

  generateFilename(baseName: string, format: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = format === 'excel' ? 'xlsx' : format;
    return `${baseName}_${timestamp}.${extension}`;
  },

  // Export Tasks
  exportTasks(tasks: TaskExportData[], options: ExportOptions): void {
    const filename = options.filename || this.generateFilename('tasks', options.format);
    
    // Prepare data for export
    const exportData = tasks.map(task => ({
      'Task ID': task.id,
      'Title': task.title,
      'Description': task.description || '',
      'Status': task.status.replace('_', ' ').toUpperCase(),
      'Priority': task.priority.toUpperCase(),
      'Assignee': task.assignee?.full_name || '',
      'Project': task.project?.name || '',
      'Start Date': this.formatDate(task.start_date),
      'Due Date': this.formatDate(task.end_date),
      'Created': this.formatDate(task.created_at),
      'Updated': this.formatDate(task.updated_at),
    }));

    switch (options.format) {
      case 'csv':
        this.exportDataToCSV(exportData, filename);
        break;
      case 'excel':
        this.exportDataToExcel(exportData, filename, 'Tasks');
        break;
      case 'pdf':
        this.exportTasksToPDF(exportData, filename, options.title || 'Tasks Report');
        break;
    }
  },

  // Export Projects
  exportProjects(projects: ProjectExportData[], options: ExportOptions): void {
    const filename = options.filename || this.generateFilename('projects', options.format);
    
    const exportData = projects.map(project => ({
      'Project ID': project.id,
      'Name': project.name,
      'Project Number': project.project_number || '',
      'Address': project.address || '',
      'Status': project.status.toUpperCase(),
      'Start Date': this.formatDate(project.start_date),
      'End Date': this.formatDate(project.end_date),
      'Owner Name': project.owner_name || '',
      'Owner Company': project.owner_company || '',
      'Created': this.formatDate(project.created_at),
    }));

    switch (options.format) {
      case 'csv':
        this.exportDataToCSV(exportData, filename);
        break;
      case 'excel':
        this.exportDataToExcel(exportData, filename, 'Projects');
        break;
      case 'pdf':
        this.exportProjectsToPDF(exportData, filename, options.title || 'Projects Report');
        break;
    }
  },

  // Generic CSV Export
  exportDataToCSV(data: any[], filename: string): void {
    if (data.length === 0) return;

    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
  },

  // Generic Excel Export
  exportDataToExcel(data: any[], filename: string, sheetName: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    // Auto-size columns
    if (data.length > 0) {
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(
          key.length,
          ...data.map(row => String(row[key] || '').length)
        )
      }));
      worksheet['!cols'] = colWidths;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename);
  },

  // PDF Export for Tasks
  exportTasksToPDF(data: any[], filename: string, title: string): void {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text(title, 20, 20);
    
    // Subtitle with date
    doc.setFontSize(12);
    doc.text(`Generated on ${format(new Date(), 'PPP')}`, 20, 30);

    // Table
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map(row => headers.map(header => row[header] || ''));

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [51, 122, 183] },
        columnStyles: {
          0: { cellWidth: 15 }, // Task ID
          1: { cellWidth: 40 }, // Title
          3: { cellWidth: 20 }, // Status
          4: { cellWidth: 20 }, // Priority
        },
        didDrawPage: (data: any) => {
          // Footer
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber}`,
            doc.internal.pageSize.width - 20,
            doc.internal.pageSize.height - 10
          );
        }
      });
    }

    doc.save(filename);
  },

  // PDF Export for Projects
  exportProjectsToPDF(data: any[], filename: string, title: string): void {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text(title, 20, 20);
    
    // Subtitle with date
    doc.setFontSize(12);
    doc.text(`Generated on ${format(new Date(), 'PPP')}`, 20, 30);

    // Table
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map(row => headers.map(header => row[header] || ''));

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [51, 122, 183] },
        columnStyles: {
          1: { cellWidth: 35 }, // Name
          3: { cellWidth: 30 }, // Address
        },
        didDrawPage: (data: any) => {
          // Footer
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber}`,
            doc.internal.pageSize.width - 20,
            doc.internal.pageSize.height - 10
          );
        }
      });
    }

    doc.save(filename);
  },

  // Combined Export (Tasks + Projects)
  exportCombinedReport(
    tasks: TaskExportData[], 
    projects: ProjectExportData[], 
    options: ExportOptions
  ): void {
    const filename = options.filename || this.generateFilename('combined_report', options.format);

    switch (options.format) {
      case 'excel':
        this.exportCombinedToExcel(tasks, projects, filename);
        break;
      case 'pdf':
        this.exportCombinedToPDF(tasks, projects, filename, options.title || 'Project Report');
        break;
      default:
        // For CSV, export tasks and projects separately
        this.exportTasks(tasks, { ...options, filename: filename.replace('.csv', '_tasks.csv') });
        this.exportProjects(projects, { ...options, filename: filename.replace('.csv', '_projects.csv') });
    }
  },

  exportCombinedToExcel(
    tasks: TaskExportData[], 
    projects: ProjectExportData[], 
    filename: string
  ): void {
    const workbook = XLSX.utils.book_new();

    // Tasks sheet
    if (tasks.length > 0) {
      const taskData = tasks.map(task => ({
        'Task ID': task.id,
        'Title': task.title,
        'Description': task.description || '',
        'Status': task.status.replace('_', ' ').toUpperCase(),
        'Priority': task.priority.toUpperCase(),
        'Assignee': task.assignee?.full_name || '',
        'Project': task.project?.name || '',
        'Start Date': this.formatDate(task.start_date),
        'Due Date': this.formatDate(task.end_date),
        'Created': this.formatDate(task.created_at),
      }));
      
      const taskWorksheet = XLSX.utils.json_to_sheet(taskData);
      XLSX.utils.book_append_sheet(workbook, taskWorksheet, 'Tasks');
    }

    // Projects sheet
    if (projects.length > 0) {
      const projectData = projects.map(project => ({
        'Project ID': project.id,
        'Name': project.name,
        'Project Number': project.project_number || '',
        'Address': project.address || '',
        'Status': project.status.toUpperCase(),
        'Start Date': this.formatDate(project.start_date),
        'End Date': this.formatDate(project.end_date),
        'Owner Name': project.owner_name || '',
        'Owner Company': project.owner_company || '',
        'Created': this.formatDate(project.created_at),
      }));
      
      const projectWorksheet = XLSX.utils.json_to_sheet(projectData);
      XLSX.utils.book_append_sheet(workbook, projectWorksheet, 'Projects');
    }

    XLSX.writeFile(workbook, filename);
  },

  exportCombinedToPDF(
    tasks: TaskExportData[], 
    projects: ProjectExportData[], 
    filename: string, 
    title: string
  ): void {
    const doc = new jsPDF();
    
    // Title page
    doc.setFontSize(20);
    doc.text(title, 20, 30);
    doc.setFontSize(14);
    doc.text(`Generated on ${format(new Date(), 'PPP')}`, 20, 45);

    let yPosition = 70;

    // Projects section
    if (projects.length > 0) {
      doc.setFontSize(16);
      doc.text('Projects Summary', 20, yPosition);
      yPosition += 10;

      const projectHeaders = ['Name', 'Status', 'Start Date', 'End Date'];
      const projectRows = projects.map(project => [
        project.name,
        project.status.toUpperCase(),
        this.formatDate(project.start_date),
        this.formatDate(project.end_date)
      ]);

      autoTable(doc, {
        head: [projectHeaders],
        body: projectRows,
        startY: yPosition,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [51, 122, 183] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }

    // Tasks section
    if (tasks.length > 0) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text('Tasks Summary', 20, yPosition);
      yPosition += 10;

      const taskHeaders = ['Title', 'Status', 'Priority', 'Assignee', 'Due Date'];
      const taskRows = tasks.map(task => [
        task.title,
        task.status.replace('_', ' ').toUpperCase(),
        task.priority.toUpperCase(),
        task.assignee?.full_name || '',
        this.formatDate(task.end_date)
      ]);

      autoTable(doc, {
        head: [taskHeaders],
        body: taskRows,
        startY: yPosition,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [51, 122, 183] },
      });
    }

    doc.save(filename);
  },
};