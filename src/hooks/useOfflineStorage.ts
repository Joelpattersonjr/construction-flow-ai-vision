import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineData {
  projects: any[];
  tasks: any[];
  teamMembers: any[];
  lastSync: string;
}

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back online",
        description: "Syncing latest data...",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "Showing cached data",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const saveOfflineData = (data: Partial<OfflineData>) => {
    try {
      const existingData = JSON.parse(localStorage.getItem('offlineData') || '{}');
      const updatedData = {
        ...existingData,
        ...data,
        lastSync: new Date().toISOString()
      };
      localStorage.setItem('offlineData', JSON.stringify(updatedData));
      setOfflineData(updatedData);
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  };

  const loadOfflineData = (): OfflineData | null => {
    try {
      const data = localStorage.getItem('offlineData');
      if (data) {
        const parsedData = JSON.parse(data);
        setOfflineData(parsedData);
        return parsedData;
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
    return null;
  };

  const clearOfflineData = () => {
    localStorage.removeItem('offlineData');
    setOfflineData(null);
  };

  useEffect(() => {
    loadOfflineData();
  }, []);

  return {
    isOnline,
    offlineData,
    saveOfflineData,
    loadOfflineData,
    clearOfflineData
  };
};