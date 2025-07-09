import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Type definitions
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
    (doc as any).autoTable({
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
};