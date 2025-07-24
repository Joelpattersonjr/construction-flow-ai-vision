import { useState } from 'react';
import { WeatherData } from '@/services/weatherService';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

export type ExportFormat = 'csv' | 'json' | 'pdf';

interface ExportOptions {
  format: ExportFormat;
  includeCharts?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  projectName?: string;
}

export const useWeatherExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportWeatherData = async (
    data: WeatherData[],
    options: ExportOptions
  ): Promise<boolean> => {
    try {
      setIsExporting(true);
      setError(null);

      const { format, projectName = 'Weather Data' } = options;
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${projectName.replace(/\s+/g, '_')}_weather_${timestamp}`;

      switch (format) {
        case 'csv':
          await exportToCSV(data, filename);
          break;
        case 'json':
          await exportToJSON(data, filename, options);
          break;
        case 'pdf':
          await exportToPDF(data, filename, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      return true;
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async (data: WeatherData[], filename: string) => {
    const headers = [
      'Date',
      'Temperature (°F)',
      'High (°F)',
      'Low (°F)',
      'Condition',
      'Humidity (%)',
      'Wind Speed (mph)',
      'Cached',
      'Age (minutes)'
    ];

    const rows = data.map(item => [
      item.last_updated ? new Date(item.last_updated).toLocaleString() : '',
      item.temperature_current?.toString() || '',
      item.temperature_high?.toString() || '',
      item.temperature_low?.toString() || '',
      item.condition || '',
      item.humidity?.toString() || '',
      item.wind_speed?.toString() || '',
      item.cached ? 'Yes' : 'No',
      item.age_minutes?.toString() || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  };

  const exportToJSON = async (
    data: WeatherData[], 
    filename: string, 
    options: ExportOptions
  ) => {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        projectName: options.projectName,
        dataCount: data.length,
        dateRange: options.dateRange
      },
      weatherData: data
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json;charset=utf-8;'
    });
    saveAs(blob, `${filename}.json`);
  };

  const exportToPDF = async (
    data: WeatherData[], 
    filename: string, 
    options: ExportOptions
  ) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Weather Analytics Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Project info
    if (options.projectName) {
      doc.setFontSize(14);
      doc.text(`Project: ${options.projectName}`, 20, yPosition);
      yPosition += 10;
    }

    // Export date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 10;

    // Date range
    if (options.dateRange) {
      doc.text(
        `Data Range: ${options.dateRange.start.toLocaleDateString()} - ${options.dateRange.end.toLocaleDateString()}`,
        20,
        yPosition
      );
      yPosition += 15;
    }

    // Summary statistics
    if (data.length > 0) {
      const avgTemp = data.reduce((sum, d) => sum + (d.temperature_current || 0), 0) / data.length;
      const maxTemp = Math.max(...data.map(d => d.temperature_current || 0));
      const minTemp = Math.min(...data.map(d => d.temperature_current || 0));

      doc.setFontSize(12);
      doc.text('Summary Statistics:', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Records: ${data.length}`, 30, yPosition);
      yPosition += 7;
      doc.text(`Average Temperature: ${avgTemp.toFixed(1)}°F`, 30, yPosition);
      yPosition += 7;
      doc.text(`Highest Temperature: ${maxTemp}°F`, 30, yPosition);
      yPosition += 7;
      doc.text(`Lowest Temperature: ${minTemp}°F`, 30, yPosition);
      yPosition += 15;
    }

    // Data table header
    doc.setFontSize(12);
    doc.text('Weather Data:', 20, yPosition);
    yPosition += 10;

    // Table data (simplified for PDF)
    doc.setFontSize(8);
    const headers = ['Date', 'Temp', 'Condition', 'Humidity', 'Wind'];
    const headerY = yPosition;
    
    headers.forEach((header, index) => {
      doc.text(header, 20 + (index * 30), headerY);
    });
    yPosition += 8;

    // Add data rows (limit to avoid page overflow)
    const limitedData = data.slice(0, 30); // First 30 records
    limitedData.forEach((item) => {
      if (yPosition > 250) { // New page if needed
        doc.addPage();
        yPosition = 20;
      }

      const date = item.last_updated ? new Date(item.last_updated).toLocaleDateString() : 'N/A';
      const temp = item.temperature_current ? `${item.temperature_current}°F` : 'N/A';
      const condition = item.condition || 'N/A';
      const humidity = item.humidity ? `${item.humidity}%` : 'N/A';
      const wind = item.wind_speed ? `${item.wind_speed}mph` : 'N/A';

      doc.text(date, 20, yPosition);
      doc.text(temp, 50, yPosition);
      doc.text(condition, 80, yPosition);
      doc.text(humidity, 110, yPosition);
      doc.text(wind, 140, yPosition);
      
      yPosition += 6;
    });

    if (data.length > 30) {
      yPosition += 10;
      doc.text(`... and ${data.length - 30} more records`, 20, yPosition);
    }

    doc.save(`${filename}.pdf`);
  };

  return {
    exportWeatherData,
    isExporting,
    error,
  };
};