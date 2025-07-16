import React, { useState } from 'react';
import { Clock, Edit, Trash2, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskScheduleForm } from './TaskScheduleForm';
import { ScheduleSlot, TimeSlot } from '@/types/scheduling';
import { scheduleService } from '@/services/scheduleService';
import { cn } from '@/lib/utils';

interface DayScheduleViewProps {
  date: Date;
  slots: ScheduleSlot[];
  loading: boolean;
  onSlotUpdate: (slotId: string, updates: any) => void;
  onSlotDelete: (slotId: string) => void;
  editingSlot: ScheduleSlot | null;
  setEditingSlot: (slot: ScheduleSlot | null) => void;
}

export function DayScheduleView({
  date,
  slots,
  loading,
  onSlotUpdate,
  onSlotDelete,
  editingSlot,
  setEditingSlot
}: DayScheduleViewProps) {
  const [draggedSlot, setDraggedSlot] = useState<ScheduleSlot | null>(null);

  const timeSlots = scheduleService.generateTimeSlots(7, 19, 30); // 7 AM to 7 PM, 30-min intervals

  const getSlotForTime = (time: string): ScheduleSlot | null => {
    return slots.find(slot => {
      const slotStart = slot.start_time.substring(0, 5); // HH:MM format
      return slotStart === time;
    }) || null;
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'bg-red-500/20 border-red-300 text-red-800';
      case 'medium':
        return 'bg-orange-500/20 border-orange-300 text-orange-800';
      case 'low':
        return 'bg-blue-500/20 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-500/20 border-gray-300 text-gray-800';
    }
  };

  const handleDragStart = (e: React.DragEvent, slot: ScheduleSlot) => {
    setDraggedSlot(slot);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTime: string) => {
    e.preventDefault();
    if (!draggedSlot) return;

    const duration = draggedSlot.duration_minutes;
    const startMinutes = parseInt(targetTime.split(':')[0]) * 60 + parseInt(targetTime.split(':')[1]);
    const endMinutes = startMinutes + duration;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

    onSlotUpdate(draggedSlot.id, {
      start_time: targetTime,
      end_time: endTime
    });

    setDraggedSlot(null);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  if (loading) {
    return (
      <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading schedule...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="grid gap-2">
            {timeSlots.map((time) => {
              const slot = getSlotForTime(time);
              const isEmpty = !slot;

              return (
                <div
                  key={time}
                  className={cn(
                    "min-h-[60px] p-3 rounded-lg border-2 border-dashed transition-all duration-200",
                    isEmpty 
                      ? "border-gray-300 hover:border-primary/50 hover:bg-primary/5" 
                      : "border-transparent"
                  )}
                  onDragOver={isEmpty ? handleDragOver : undefined}
                  onDrop={isEmpty ? (e) => handleDrop(e, time) : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 w-16">
                        {time}
                      </span>
                      
                      {slot ? (
                        <div
                          className={cn(
                            "flex-1 p-3 rounded-lg border cursor-move",
                            getPriorityColor(slot.task?.priority || null),
                            slot.is_locked && "opacity-75"
                          )}
                          draggable={!slot.is_locked}
                          onDragStart={(e) => handleDragStart(e, slot)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">
                                  {slot.task?.title || 'Untitled Task'}
                                </h4>
                                {slot.is_locked && <Lock className="w-3 h-3" />}
                              </div>
                              <div className="flex items-center gap-2 text-xs opacity-75">
                                <Clock className="w-3 h-3" />
                                <span>{formatDuration(slot.duration_minutes)}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {slot.task?.status || 'todo'}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingSlot(slot)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onSlotDelete(slot.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 text-center text-gray-400 text-sm">
                          Drop a task here or click to schedule
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Slot Dialog */}
      <Dialog open={!!editingSlot} onOpenChange={() => setEditingSlot(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Schedule Slot</DialogTitle>
          </DialogHeader>
          {editingSlot && (
            <TaskScheduleForm
              date={editingSlot.date}
              initialData={{
                task_id: editingSlot.task_id,
                start_time: editingSlot.start_time,
                end_time: editingSlot.end_time,
                duration_minutes: editingSlot.duration_minutes
              }}
              onSubmit={(data) => onSlotUpdate(editingSlot.id, data)}
              onCancel={() => setEditingSlot(null)}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}