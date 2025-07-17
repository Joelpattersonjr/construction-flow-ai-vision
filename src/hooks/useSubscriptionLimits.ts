import { useState, useEffect } from 'react';
import { SubscriptionService } from '@/services/subscriptionService';
import { useToast } from '@/hooks/use-toast';

type LimitType = 'projects' | 'users' | 'storage' | 'versions' | 'collaborators';

interface LimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
}

export const useSubscriptionLimits = () => {
  const [limits, setLimits] = useState<Record<LimitType, LimitCheck | null>>({
    projects: null,
    users: null,
    storage: null,
    versions: null,
    collaborators: null,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkLimit = async (type: LimitType, documentId?: string): Promise<LimitCheck> => {
    try {
      let result;
      switch (type) {
        case 'projects':
          result = await SubscriptionService.checkProjectLimit();
          break;
        case 'users':
          result = await SubscriptionService.checkUserLimit();
          break;
        case 'storage':
          result = await SubscriptionService.checkStorageLimit();
          break;
        case 'versions':
          if (!documentId) throw new Error('Document ID required for version limit check');
          result = await SubscriptionService.checkVersionLimit(documentId);
          break;
        case 'collaborators':
          if (!documentId) throw new Error('Document ID required for collaborator limit check');
          result = await SubscriptionService.checkCollaboratorLimit(documentId);
          break;
        default:
          throw new Error(`Unknown limit type: ${type}`);
      }

      setLimits(prev => ({
        ...prev,
        [type]: result
      }));

      return result;
    } catch (error) {
      console.error(`Error checking ${type} limit:`, error);
      return { allowed: false, current: 0, limit: 0 };
    }
  };

  const checkAllLimits = async () => {
    setLoading(true);
    try {
      await Promise.all([
        checkLimit('projects'),
        checkLimit('users'),
        checkLimit('storage'),
      ]);
    } catch (error) {
      console.error('Error checking limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const enforceLimit = async (type: LimitType, documentId?: string): Promise<boolean> => {
    const result = await checkLimit(type, documentId);
    
    if (!result.allowed) {
      const limitNames = {
        projects: 'project',
        users: 'user',
        storage: 'storage',
        versions: 'file version',
        collaborators: 'collaborator'
      };

      toast({
        title: "Limit Reached",
        description: `You've reached your ${limitNames[type]} limit. Upgrade your plan to continue.`,
        variant: "destructive",
      });
    }

    return result.allowed;
  };

  useEffect(() => {
    checkAllLimits();
  }, []);

  return {
    limits,
    loading,
    checkLimit,
    checkAllLimits,
    enforceLimit,
    refresh: checkAllLimits,
  };
};