import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { HardDrive, TrendingUp, Files, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fileAnalyticsService, ProjectStorageStats, FileUsageStats } from '@/services/fileAnalyticsService';

interface StorageAnalyticsProps {
  projectId: string;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const StorageAnalytics: React.FC<StorageAnalyticsProps> = ({ projectId }) => {
  const [storageStats, setStorageStats] = useState<ProjectStorageStats | null>(null);
  const [fileUsageStats, setFileUsageStats] = useState<FileUsageStats[]>([]);
  const [categoryUsage, setCategoryUsage] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const [stats, usage, categories] = await Promise.all([
          fileAnalyticsService.getProjectStorageStats(projectId),
          fileAnalyticsService.getFileUsageStats(projectId),
          fileAnalyticsService.getStorageUsageByCategory(projectId)
        ]);

        setStorageStats(stats);
        setFileUsageStats(usage.slice(0, 5)); // Top 5 most accessed files
        setCategoryUsage(categories);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadAnalytics();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Mock storage quota for demonstration (100MB)
  const storageQuota = 100 * 1024 * 1024; // 100MB in bytes
  const usedStorage = storageStats?.total_size_bytes || 0;
  const storagePercentage = Math.min((usedStorage / storageQuota) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <Files className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageStats?.total_files || 0}</div>
            <p className="text-xs text-muted-foreground">
              Files in this project
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(usedStorage)}</div>
            <div className="mt-2">
              <Progress value={storagePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {storagePercentage.toFixed(1)}% of {formatBytes(storageQuota)} used
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Categories</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categoryUsage.slice(0, 3).map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {category.category.replace('-', ' ')}
                  </Badge>
                  <span className="text-sm font-medium">{category.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Accessed Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Most Accessed Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fileUsageStats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No file access data available
            </div>
          ) : (
            <div className="space-y-3">
              {fileUsageStats.map((file) => (
                <div key={file.file_id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Last accessed {formatDistanceToNow(new Date(file.last_accessed), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{file.total_views}</div>
                      <div className="text-xs text-muted-foreground">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{file.total_downloads}</div>
                      <div className="text-xs text-muted-foreground">Downloads</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageAnalytics;