import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeUpdatesProps {
  projectId: string;
  onMembersChange: () => void;
  onAuditLogChange: () => void;
}

export const useRealtimeUpdates = ({ 
  projectId, 
  onMembersChange, 
  onAuditLogChange 
}: UseRealtimeUpdatesProps) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create a single channel for all realtime updates
    const channel = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members_enhanced',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Real-time member change:', payload);
          onMembersChange();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_log',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Real-time audit log change:', payload);
          onAuditLogChange();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [projectId, onMembersChange, onAuditLogChange]);

  return {
    isConnected: channelRef.current?.state === 'joined'
  };
};