import { supabase } from '@/integrations/supabase/client';

export interface FileAnalytic {
  id: string;
  project_id: string;
  file_id: number;
  user_id: string;
  action_type: 'upload' | 'download' | 'view' | 'delete';
  file_size?: number;
  created_at: string;
}

export interface FileUsageStats {
  file_id: number;
  file_name: string;
  total_views: number;
  total_downloads: number;
  last_accessed: string;
}

export interface ProjectStorageStats {
  project_id: string;
  total_files: number;
  total_size_bytes: number;
  last_updated: string;
}

class FileAnalyticsService {
  async trackFileAction(params: {
    projectId: string;
    fileId: number;
    actionType: 'upload' | 'download' | 'view' | 'delete';
    fileSize?: number;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('file_analytics')
      .insert({
        project_id: params.projectId,
        file_id: params.fileId,
        user_id: user.id,
        action_type: params.actionType,
        file_size: params.fileSize
      });

    if (error) {
      console.error('Error tracking file action:', error);
    }
  }

  async getFileUsageStats(projectId: string): Promise<FileUsageStats[]> {
    const { data, error } = await supabase
      .from('file_analytics')
      .select(`
        file_id,
        action_type,
        created_at,
        documents!inner(file_name)
      `)
      .eq('project_id', projectId)
      .in('action_type', ['view', 'download']);

    if (error) {
      console.error('Error fetching file usage stats:', error);
      return [];
    }

    // Group by file and calculate stats
    const statsMap = new Map<number, FileUsageStats>();
    
    data?.forEach((record: any) => {
      const fileId = record.file_id;
      if (!statsMap.has(fileId)) {
        statsMap.set(fileId, {
          file_id: fileId,
          file_name: record.documents.file_name,
          total_views: 0,
          total_downloads: 0,
          last_accessed: record.created_at
        });
      }

      const stats = statsMap.get(fileId)!;
      if (record.action_type === 'view') {
        stats.total_views++;
      } else if (record.action_type === 'download') {
        stats.total_downloads++;
      }

      // Update last accessed if this record is more recent
      if (new Date(record.created_at) > new Date(stats.last_accessed)) {
        stats.last_accessed = record.created_at;
      }
    });

    return Array.from(statsMap.values()).sort((a, b) => 
      (b.total_views + b.total_downloads) - (a.total_views + a.total_downloads)
    );
  }

  async getProjectStorageStats(projectId: string): Promise<ProjectStorageStats | null> {
    const { data, error } = await supabase
      .from('project_storage_stats')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) {
      console.error('Error fetching storage stats:', error);
      return null;
    }

    return data;
  }

  async getRecentFileActivity(projectId: string, limit = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('file_analytics')
      .select(`
        *,
        documents!inner(file_name)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }

    return data || [];
  }

  async getStorageUsageByCategory(projectId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('category')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching storage usage by category:', error);
      return [];
    }

    // Count files by category
    const categoryCount = data?.reduce((acc: Record<string, number>, doc) => {
      const category = doc.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(categoryCount || {}).map(([category, count]) => ({
      category,
      count
    }));
  }
}

export const fileAnalyticsService = new FileAnalyticsService();