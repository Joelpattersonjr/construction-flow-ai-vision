import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RealtimeFileUpdate {
  id: number;
  project_id: string;
  file_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  uploader_id: string;
  created_at: string;
}

interface UseRealtimeFileUpdatesProps {
  projectId: string;
  onUpdate?: (update: RealtimeFileUpdate) => void;
}

export function useRealtimeFileUpdates({ projectId, onUpdate }: UseRealtimeFileUpdatesProps) {
  const [updates, setUpdates] = useState<RealtimeFileUpdate[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`file-updates-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          const record = newRecord || oldRecord;
          
          if (!record || typeof record !== 'object' || !('id' in record)) return;

          const documentRecord = record as any; // Type assertion for Supabase payload

          const update: RealtimeFileUpdate = {
            id: documentRecord.id,
            project_id: documentRecord.project_id,
            file_name: documentRecord.file_name || 'Unknown file',
            action: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            uploader_id: documentRecord.uploader_id || '',
            created_at: documentRecord.created_at || new Date().toISOString()
          };

          setUpdates(prev => [update, ...prev.slice(0, 9)]); // Keep last 10 updates
          
          // Show toast notification for file operations
          if (eventType === 'INSERT') {
            toast({
              title: "New file uploaded",
              description: `${documentRecord.file_name || 'A file'} was added to the project`,
            });
          } else if (eventType === 'DELETE') {
            toast({
              title: "File deleted",
              description: `${documentRecord.file_name || 'A file'} was removed from the project`,
              variant: "destructive",
            });
          }

          if (onUpdate) {
            onUpdate(update);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, onUpdate, toast]);

  return { updates };
}