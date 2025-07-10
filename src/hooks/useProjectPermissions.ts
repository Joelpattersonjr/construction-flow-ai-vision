import { useState, useEffect } from 'react';
import { FileService } from '@/services/file';

interface UseProjectPermissionsReturn {
  hasWritePermission: boolean;
  loading: boolean;
  checkPermissions: () => Promise<void>;
}

export const useProjectPermissions = (projectId: string): UseProjectPermissionsReturn => {
  const [hasWritePermission, setHasWritePermission] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPermissions = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const hasPermission = await FileService.hasWritePermission(projectId);
      setHasWritePermission(hasPermission);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasWritePermission(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, [projectId]);

  return {
    hasWritePermission,
    loading,
    checkPermissions,
  };
};