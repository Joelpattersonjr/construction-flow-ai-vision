import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { ScheduleSlot } from '@/types/scheduling';

export interface ExportOptions {
  format: 'pdf' | 'excel';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeAnalytics?: boolean;
}

export const scheduleExportService = {
  // Export single day schedule to PDF
  exportDayToPDF(date: Date, slots: ScheduleSlot[], userName?: string): void {
    const pdf = new jsPDF();
    const dateStr = format(date, 'EEEE, MMMM d, yyyy');
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Daily Schedule Report', 20, 30);
    
    pdf.setFontSize(14);
    pdf.text(`Date: ${dateStr}`, 20, 45);
    
    if (userName) {
      pdf.text(`User: ${userName}`, 20, 55);
    }

    // Prepare table data
    const tableData = slots.map(slot => [
      slot.start_time.substring(0, 5), // HH:MM
      slot.end_time.substring(0, 5),   // HH:MM
      `${slot.duration_minutes} min`,
      slot.task?.title || 'Untitled Task',
      slot.task?.priority || 'Medium',
      slot.task?.status || 'Pending',
      slot.is_locked ? 'Yes' : 'No'
    ]);

    // Add summary
    const totalScheduledMinutes = slots.reduce((sum, slot) => sum + slot.duration_minutes, 0);
    const totalHours = Math.floor(totalScheduledMinutes / 60);
    const remainingMinutes = totalScheduledMinutes % 60;

    pdf.setFontSize(12);
    pdf.text(`Total Scheduled Time: ${totalHours}h ${remainingMinutes}m`, 20, 75);

    // Create table
    autoTable(pdf, {
      head: [['Start Time', 'End Time', 'Duration', 'Task', 'Priority', 'Status', 'Locked']],
      body: tableData,
      startY: 85,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [79, 70, 229], // indigo-600
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // gray-50
      },
    });

    // Save the PDF
    const fileName = `schedule_${format(date, 'yyyy-MM-dd')}.pdf`;
    pdf.save(fileName);
  },

  // Export schedule data to Excel
  exportToExcel(date: Date, slots: ScheduleSlot[], userName?: string): void {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Prepare worksheet data
    const worksheetData = [
      ['Daily Schedule Report'],
      ['Date:', format(date, 'EEEE, MMMM d, yyyy')],
      ...(userName ? [['User:', userName]] : []),
      [], // Empty row
      ['Start Time', 'End Time', 'Duration (min)', 'Task Title', 'Priority', 'Status', 'Locked'],
      ...slots.map(slot => [
        slot.start_time.substring(0, 5),
        slot.end_time.substring(0, 5),
        slot.duration_minutes,
        slot.task?.title || 'Untitled Task',
        slot.task?.priority || 'Medium',
        slot.task?.status || 'Pending',
        slot.is_locked ? 'Yes' : 'No'
      ]),
      [], // Empty row
      ['Summary'],
      ['Total Tasks:', slots.length],
      ['Total Scheduled Time (hours):', (slots.reduce((sum, slot) => sum + slot.duration_minutes, 0) / 60).toFixed(1)],
      ['Locked Tasks:', slots.filter(slot => slot.is_locked).length]
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Style the header
    worksheet['A1'] = { t: 's', v: 'Daily Schedule Report', s: { font: { bold: true, sz: 16 } } };

    // Set column widths
    const columnWidths = [
      { wch: 12 }, // Start Time
      { wch: 12 }, // End Time
      { wch: 15 }, // Duration
      { wch: 25 }, // Task Title
      { wch: 12 }, // Priority
      { wch: 12 }, // Status
      { wch: 10 }, // Locked
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');

    // Save the file
    const fileName = `schedule_${dateStr}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  },

  // Export multiple days to Excel with separate sheets
  exportWeekToExcel(startDate: Date, endDate: Date, slotsData: { date: string; slots: ScheduleSlot[] }[], userName?: string): void {
    const workbook = XLSX.utils.book_new();

    // Create a summary sheet
    const summaryData = [
      ['Weekly Schedule Report'],
      ['Period:', `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`],
      ...(userName ? [['User:', userName]] : []),
      [],
      ['Date', 'Total Tasks', 'Total Hours', 'Locked Tasks'],
      ...slotsData.map(({ date, slots }) => [
        format(new Date(date), 'MMM d, yyyy'),
        slots.length,
        (slots.reduce((sum, slot) => sum + slot.duration_minutes, 0) / 60).toFixed(1),
        slots.filter(slot => slot.is_locked).length
      ]),
      [],
      ['Overall Summary'],
      ['Total Days:', slotsData.length],
      ['Total Tasks:', slotsData.reduce((sum, { slots }) => sum + slots.length, 0)],
      ['Total Hours:', (slotsData.reduce((sum, { slots }) => sum + slots.reduce((slotSum, slot) => slotSum + slot.duration_minutes, 0), 0) / 60).toFixed(1)]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Create individual day sheets
    slotsData.forEach(({ date, slots }) => {
      const dayData = [
        ['Date:', format(new Date(date), 'EEEE, MMMM d, yyyy')],
        [],
        ['Start Time', 'End Time', 'Duration (min)', 'Task Title', 'Priority', 'Status', 'Locked'],
        ...slots.map(slot => [
          slot.start_time.substring(0, 5),
          slot.end_time.substring(0, 5),
          slot.duration_minutes,
          slot.task?.title || 'Untitled Task',
          slot.task?.priority || 'Medium',
          slot.task?.status || 'Pending',
          slot.is_locked ? 'Yes' : 'No'
        ])
      ];

      const daySheet = XLSX.utils.aoa_to_sheet(dayData);
      daySheet['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 10 }
      ];
      
      const sheetName = format(new Date(date), 'MMM d');
      XLSX.utils.book_append_sheet(workbook, daySheet, sheetName);
    });

    // Save the file
    const fileName = `schedule_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  },

  // Export team schedule to PDF
  exportTeamToPDF(date: Date, teamSlots: ScheduleSlot[]): void {
    const pdf = new jsPDF('landscape'); // Use landscape for team view
    const dateStr = format(date, 'EEEE, MMMM d, yyyy');
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Team Schedule Report', 20, 30);
    
    pdf.setFontSize(14);
    pdf.text(`Date: ${dateStr}`, 20, 45);

    // Group slots by user
    const userGroups = teamSlots.reduce((groups, slot) => {
      const userName = slot.user?.full_name || 'Unknown User';
      if (!groups[userName]) {
        groups[userName] = [];
      }
      groups[userName].push(slot);
      return groups;
    }, {} as Record<string, ScheduleSlot[]>);

    let yPosition = 65;

    // Add each user's schedule
    Object.entries(userGroups).forEach(([userName, slots]) => {
      if (yPosition > 180) { // Add new page if needed
        pdf.addPage();
        yPosition = 30;
      }

      pdf.setFontSize(16);
      pdf.text(`${userName} (${slots.length} tasks)`, 20, yPosition);
      yPosition += 10;

      const tableData = slots.map(slot => [
        slot.start_time.substring(0, 5),
        slot.end_time.substring(0, 5),
        `${slot.duration_minutes} min`,
        slot.task?.title || 'Untitled Task',
        slot.task?.priority || 'Medium',
        slot.task?.status || 'Pending'
      ]);

      autoTable(pdf, {
        head: [['Start', 'End', 'Duration', 'Task', 'Priority', 'Status']],
        body: tableData,
        startY: yPosition,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [79, 70, 229] },
        margin: { left: 20 },
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    });

    // Save the PDF
    const fileName = `team_schedule_${format(date, 'yyyy-MM-dd')}.pdf`;
    pdf.save(fileName);
  }
};