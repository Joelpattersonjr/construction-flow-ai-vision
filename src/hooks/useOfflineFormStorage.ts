import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

interface OfflineFormData {
  id: string;
  formTemplateId: string;
  formName: string;
  data: any;
  timestamp: number;
  isSubmitted: boolean;
}

export const useOfflineFormStorage = () => {
  const [offlineForms, setOfflineForms] = useState<OfflineFormData[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Load offline forms from storage
    loadOfflineForms();

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineForms = () => {
    try {
      const stored = localStorage.getItem('offline_forms');
      if (stored) {
        const forms = JSON.parse(stored);
        setOfflineForms(forms);
      }
    } catch (error) {
      console.error('Error loading offline forms:', error);
    }
  };

  const saveFormOffline = (
    formTemplateId: string,
    formName: string,
    data: any
  ): string => {
    const formData: OfflineFormData = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      formTemplateId,
      formName,
      data,
      timestamp: Date.now(),
      isSubmitted: false
    };

    const updatedForms = [...offlineForms, formData];
    setOfflineForms(updatedForms);
    
    try {
      localStorage.setItem('offline_forms', JSON.stringify(updatedForms));
    } catch (error) {
      console.error('Error saving form offline:', error);
    }

    return formData.id;
  };

  const updateOfflineForm = (formId: string, data: any) => {
    const updatedForms = offlineForms.map(form =>
      form.id === formId
        ? { ...form, data, timestamp: Date.now() }
        : form
    );
    
    setOfflineForms(updatedForms);
    
    try {
      localStorage.setItem('offline_forms', JSON.stringify(updatedForms));
    } catch (error) {
      console.error('Error updating offline form:', error);
    }
  };

  const markFormAsSubmitted = (formId: string) => {
    const updatedForms = offlineForms.map(form =>
      form.id === formId
        ? { ...form, isSubmitted: true }
        : form
    );
    
    setOfflineForms(updatedForms);
    
    try {
      localStorage.setItem('offline_forms', JSON.stringify(updatedForms));
    } catch (error) {
      console.error('Error marking form as submitted:', error);
    }
  };

  const deleteOfflineForm = (formId: string) => {
    const updatedForms = offlineForms.filter(form => form.id !== formId);
    setOfflineForms(updatedForms);
    
    try {
      localStorage.setItem('offline_forms', JSON.stringify(updatedForms));
    } catch (error) {
      console.error('Error deleting offline form:', error);
    }
  };

  const getPendingForms = () => {
    return offlineForms.filter(form => !form.isSubmitted);
  };

  const getSubmittedForms = () => {
    return offlineForms.filter(form => form.isSubmitted);
  };

  const clearAllOfflineForms = () => {
    setOfflineForms([]);
    try {
      localStorage.removeItem('offline_forms');
    } catch (error) {
      console.error('Error clearing offline forms:', error);
    }
  };

  const getStorageInfo = () => {
    const totalForms = offlineForms.length;
    const pendingForms = getPendingForms().length;
    const submittedForms = getSubmittedForms().length;
    
    // Estimate storage size
    const storageSize = JSON.stringify(offlineForms).length;
    const storageSizeKB = Math.round(storageSize / 1024);

    return {
      totalForms,
      pendingForms,
      submittedForms,
      storageSizeKB,
      isNativeMobile: Capacitor.isNativePlatform(),
      isOffline
    };
  };

  return {
    offlineForms,
    isOffline,
    saveFormOffline,
    updateOfflineForm,
    markFormAsSubmitted,
    deleteOfflineForm,
    getPendingForms,
    getSubmittedForms,
    clearAllOfflineForms,
    getStorageInfo,
    loadOfflineForms
  };
};