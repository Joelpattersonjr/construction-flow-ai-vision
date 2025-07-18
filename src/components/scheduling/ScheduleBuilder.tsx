import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, BarChart3, Plus, Edit, Trash2, Download, FileText, Table } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DayScheduleView } from './DayScheduleView';
import { TaskScheduleForm } from './TaskScheduleForm';
import { TeamScheduleView } from './TeamScheduleView';
import { ScheduleAnalytics } from './ScheduleAnalytics';
import { scheduleService } from '@/services/scheduleService';
import { scheduleExportService } from '@/services/scheduleExportService';
import { ScheduleSlot } from '@/types/scheduling';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek } from 'date-fns';

export function ScheduleBuilder() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<'day' | 'team' | 'analytics'>('day');
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [is24HourCoverage, setIs24HourCoverage] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedView === 'day') {
      loadDaySchedule();
    }
  }, [currentDate, selectedView]);

  const loadDaySchedule = async () => {
    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const slots = await scheduleService.getScheduleSlots(
        user.user.id,
        dateStr,
        dateStr
      );
      setScheduleSlots(slots);
    } catch (error) {
      console.error('Error loading schedule:', error);
      toast({
        title: "Error",
        description: "Failed to load schedule.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSlotCreate = async (slotData: any) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await scheduleService.createScheduleSlot({
        ...slotData,
        user_id: user.user.id,
        date: format(currentDate, 'yyyy-MM-dd')
      });

      await loadDaySchedule();
      setShowTaskForm(false);
      
      toast({
        title: "Success",
        description: "Task scheduled successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule task.",
        variant: "destructive",
      });
    }
  };

  const handleSlotUpdate = async (slotId: string, updates: any) => {
    try {
      await scheduleService.updateScheduleSlot(slotId, updates);
      await loadDaySchedule();
      setEditingSlot(null);
      
      toast({
        title: "Success",
        description: "Schedule updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update schedule.",
        variant: "destructive",
      });
    }
  };

  const handleSlotDelete = async (slotId: string) => {
    try {
      await scheduleService.deleteScheduleSlot(slotId);
      await loadDaySchedule();
      
      toast({
        title: "Success",
        description: "Schedule slot deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete schedule slot.",
        variant: "destructive",
      });
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.user.id)
        .single();

      const userName = profile?.full_name || user.user.email || 'Unknown User';

      if (format === 'pdf') {
        scheduleExportService.exportDayToPDF(currentDate, scheduleSlots, userName);
      } else {
        scheduleExportService.exportToExcel(currentDate, scheduleSlots, userName);
      }

      toast({
        title: "Success",
        description: `Schedule exported to ${format.toUpperCase()} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export schedule.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-blue-300/20 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-purple-300/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      <main className="container mx-auto py-8 px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 space-y-6 animate-fade-in relative">
          <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/30">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl backdrop-blur-sm border border-white/20 mb-4">
              <Clock className="h-10 w-10 text-purple-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Schedule
              <span className="block bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Builder
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Organize your time with precision. Drag and drop tasks, manage team schedules, and track productivity across your construction projects.
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <Card className="mb-8 border-0 bg-white/40 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('prev')}
                  className="bg-white/60"
                >
                  ←
                </Button>
                <h2 className="text-lg font-semibold">
                  {format(currentDate, 'EEEE, MMMM d, yyyy')}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateDate('next')}
                  className="bg-white/60"
                >
                  →
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
                  <SelectTrigger className="w-40 bg-white/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Day View
                      </div>
                    </SelectItem>
                    <SelectItem value="team">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Team View
                      </div>
                    </SelectItem>
                    <SelectItem value="analytics">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {selectedView === 'day' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="24-hour-coverage"
                        checked={is24HourCoverage}
                        onCheckedChange={setIs24HourCoverage}
                      />
                      <Label htmlFor="24-hour-coverage" className="text-sm font-medium">
                        24-Hour Coverage
                      </Label>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="bg-white/60">
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExport('pdf')}>
                          <FileText className="w-4 h-4 mr-2" />
                          Export to PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('excel')}>
                          <Table className="w-4 h-4 mr-2" />
                          Export to Excel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Schedule Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Schedule New Task</DialogTitle>
                        </DialogHeader>
                        <TaskScheduleForm
                          date={format(currentDate, 'yyyy-MM-dd')}
                          onSubmit={handleSlotCreate}
                          onCancel={() => setShowTaskForm(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        {selectedView === 'day' && (
          <DayScheduleView
            date={currentDate}
            slots={scheduleSlots}
            loading={loading}
            onSlotUpdate={handleSlotUpdate}
            onSlotDelete={handleSlotDelete}
            editingSlot={editingSlot}
            setEditingSlot={setEditingSlot}
            is24HourCoverage={is24HourCoverage}
          />
        )}

        {selectedView === 'team' && (
          <TeamScheduleView date={currentDate} />
        )}

        {selectedView === 'analytics' && (
          <ScheduleAnalytics date={currentDate} />
        )}
      </main>
    </div>
  );
}