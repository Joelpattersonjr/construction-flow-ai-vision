import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, Database, FileImage } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { cn } from '@/lib/utils';
import { useWeatherExport, ExportFormat } from '@/hooks/useWeatherExport';
import { WeatherData } from '@/services/weatherService';

interface WeatherExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  weatherData: WeatherData[];
  projectName?: string;
}

export const WeatherExportDialog: React.FC<WeatherExportDialogProps> = ({
  isOpen,
  onClose,
  weatherData,
  projectName = 'Weather Data'
}) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [includeCharts, setIncludeCharts] = useState(false);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  
  const { exportWeatherData, isExporting, error } = useWeatherExport();

  const formatOptions = [
    {
      value: 'csv' as ExportFormat,
      label: 'CSV',
      description: 'Spreadsheet compatible format',
      icon: FileText,
      fileSize: 'Small'
    },
    {
      value: 'json' as ExportFormat,
      label: 'JSON',
      description: 'Machine readable format with metadata',
      icon: Database,
      fileSize: 'Medium'
    },
    {
      value: 'pdf' as ExportFormat,
      label: 'PDF',
      description: 'Formatted report with summary statistics',
      icon: FileImage,
      fileSize: 'Large'
    }
  ];

  const filteredData = useCustomRange && startDate && endDate
    ? weatherData.filter(item => {
        if (!item.last_updated) return false;
        const itemDate = new Date(item.last_updated);
        return itemDate >= startDate && itemDate <= endDate;
      })
    : weatherData;

  const handleExport = async () => {
    const success = await exportWeatherData(filteredData, {
      format: exportFormat,
      includeCharts: exportFormat === 'pdf' ? includeCharts : false,
      dateRange: useCustomRange && startDate && endDate 
        ? { start: startDate, end: endDate }
        : undefined,
      projectName
    });

    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Weather Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
              {formatOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label
                      htmlFor={option.value}
                      className="flex-1 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {option.fileSize}
                      </Badge>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* PDF Options */}
          {exportFormat === 'pdf' && (
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-charts" className="text-sm">
                  Include Charts
                </Label>
                <Switch
                  id="include-charts"
                  checked={includeCharts}
                  onCheckedChange={setIncludeCharts}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Add visual charts to the PDF report (increases file size)
              </p>
            </div>
          )}

          {/* Date Range */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Date Range</Label>
              <Switch
                checked={useCustomRange}
                onCheckedChange={setUseCustomRange}
              />
            </div>

            {useCustomRange && (
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? formatDate(startDate, "MMM d") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? formatDate(endDate, "MMM d") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Data Summary */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm font-medium mb-1">Export Summary</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Records: {filteredData.length}</div>
              <div>Project: {projectName}</div>
              {useCustomRange && startDate && endDate && (
                <div>
                  Range: {formatDate(startDate, "MMM d")} - {formatDate(endDate, "MMM d")}
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isExporting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || filteredData.length === 0}
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border border-current border-t-transparent rounded-full" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};