import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface FormSubmission {
  id: string;
  form_templates: {
    name: string;
    category: string;
  };
  projects?: {
    name: string;
  };
  profiles: {
    full_name: string;
  };
  submitted_at: string;
  status: string;
  submission_data: any;
}

interface PDFGeneratorProps {
  submission: FormSubmission;
  onGenerate?: () => void;
}

export const PDFGenerator: React.FC<PDFGeneratorProps> = ({ submission, onGenerate }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(submission.form_templates.name, 20, 30);
    
    // Submission info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Submission ID: ${submission.id}`, 20, 45);
    doc.text(`Submitted by: ${submission.profiles.full_name}`, 20, 55);
    doc.text(`Date: ${format(new Date(submission.submitted_at), 'PPP')}`, 20, 65);
    doc.text(`Status: ${submission.status.replace('_', ' ').toUpperCase()}`, 20, 75);
    
    if (submission.projects?.name) {
      doc.text(`Project: ${submission.projects.name}`, 20, 85);
    }
    
    // Category badge
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 95, 60, 10, 'F');
    doc.setFontSize(10);
    doc.text(`Category: ${submission.form_templates.category.replace('_', ' ').toUpperCase()}`, 22, 102);
    
    // Form data
    let yPosition = 120;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Form Responses', 20, yPosition);
    yPosition += 15;
    
    const submissionData = submission.submission_data;
    const tableData: any[] = [];
    
    Object.entries(submissionData).forEach(([key, value]) => {
      if (key === 'signatures' || key === 'geolocation' || key === 'attachments') {
        return; // Handle these separately
      }
      
      let displayValue = '';
      if (typeof value === 'object' && value !== null) {
        displayValue = JSON.stringify(value, null, 2);
      } else if (Array.isArray(value)) {
        displayValue = value.join(', ');
      } else {
        displayValue = String(value || '');
      }
      
      tableData.push([
        key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        displayValue
      ]);
    });
    
    // Add form responses table
    if (tableData.length > 0) {
      doc.autoTable({
        startY: yPosition,
        head: [['Field', 'Response']],
        body: tableData,
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [65, 105, 225],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 110 },
        },
        margin: { left: 20, right: 20 },
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }
    
    // Handle signatures
    if (submissionData.signatures && Object.keys(submissionData.signatures).length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Digital Signatures', 20, yPosition);
      yPosition += 15;
      
      Object.entries(submissionData.signatures).forEach(([fieldId, signature]) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${fieldId}: ${signature}`, 20, yPosition);
        yPosition += 10;
      });
      
      yPosition += 10;
    }
    
    // Handle geolocation
    if (submissionData.geolocation) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Location Information', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Latitude: ${submissionData.geolocation.lat}`, 20, yPosition);
      yPosition += 10;
      doc.text(`Longitude: ${submissionData.geolocation.lng}`, 20, yPosition);
      yPosition += 20;
    }
    
    // Handle attachments
    if (submissionData.attachments && Object.keys(submissionData.attachments).length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('File Attachments', 20, yPosition);
      yPosition += 15;
      
      Object.entries(submissionData.attachments).forEach(([fieldId, files]: [string, any]) => {
        if (Array.isArray(files)) {
          files.forEach((file: any) => {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`• ${file.name || 'Unnamed file'}`, 25, yPosition);
            yPosition += 10;
          });
        }
      });
    }
    
    // Footer
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Generated on ${format(new Date(), 'PPP')} via Construction Management System`, 20, footerY);
    doc.text(`Page 1 of ${doc.getNumberOfPages()}`, pageWidth - 50, footerY);
    
    // Save the PDF
    const fileName = `${submission.form_templates.name.replace(/\s+/g, '_')}_${submission.id.slice(0, 8)}.pdf`;
    doc.save(fileName);
    
    if (onGenerate) {
      onGenerate();
    }
  };
  
  return (
    <Button variant="outline" size="sm" onClick={generatePDF}>
      <Download className="h-4 w-4 mr-2" />
      Export PDF
    </Button>
  );
};

// Hook for generating PDFs programmatically
export const usePDFGenerator = () => {
  const generateSubmissionPDF = (submission: FormSubmission) => {
    // Call the generatePDF function directly
    const doc = new jsPDF();
    // ... similar PDF generation logic
    const fileName = `${submission.form_templates.name.replace(/\s+/g, '_')}_${submission.id.slice(0, 8)}.pdf`;
    doc.save(fileName);
  };
  
  const generateBulkPDF = (submissions: FormSubmission[]) => {
    if (submissions.length === 0) return;
    
    const doc = new jsPDF();
    let isFirstPage = true;
    
    submissions.forEach((submission, index) => {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;
      
      // Similar PDF generation logic for each submission
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`${submission.form_templates.name} (${index + 1}/${submissions.length})`, 20, 30);
      
      // Add basic submission info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`ID: ${submission.id}`, 20, 45);
      doc.text(`Submitted: ${format(new Date(submission.submitted_at), 'PPP')}`, 20, 55);
      doc.text(`By: ${submission.profiles.full_name}`, 20, 65);
      
      // Add a summary or key fields here
      let yPos = 85;
      Object.entries(submission.submission_data).slice(0, 10).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          doc.text(`${key}: ${String(value).substring(0, 50)}`, 20, yPos);
          yPos += 10;
        }
      });
    });
    
    const fileName = `Bulk_Export_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
  };
  
  return {
    generateSubmissionPDF,
    generateBulkPDF,
  };
};