import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface WeatherURLState {
  tab?: 'live' | 'history' | 'trends';
  days?: number;
  startDate?: string;
  endDate?: string;
  exportFormat?: 'csv' | 'json' | 'pdf';
}

export const useWeatherURL = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [urlState, setUrlState] = useState<WeatherURLState>({});

  // Parse URL parameters on mount
  useEffect(() => {
    const tab = searchParams.get('tab') as WeatherURLState['tab'];
    const days = searchParams.get('days');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const exportFormat = searchParams.get('exportFormat') as WeatherURLState['exportFormat'];

    setUrlState({
      tab: tab || 'live',
      days: days ? parseInt(days) : 7,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      exportFormat: exportFormat || undefined,
    });
  }, [searchParams]);

  const updateURL = (newState: Partial<WeatherURLState>) => {
    const updatedState = { ...urlState, ...newState };
    setUrlState(updatedState);

    // Update URL parameters
    const newParams = new URLSearchParams();
    
    if (updatedState.tab && updatedState.tab !== 'live') {
      newParams.set('tab', updatedState.tab);
    }
    
    if (updatedState.days && updatedState.days !== 7) {
      newParams.set('days', updatedState.days.toString());
    }
    
    if (updatedState.startDate) {
      newParams.set('startDate', updatedState.startDate);
    }
    
    if (updatedState.endDate) {
      newParams.set('endDate', updatedState.endDate);
    }
    
    if (updatedState.exportFormat) {
      newParams.set('exportFormat', updatedState.exportFormat);
    }

    setSearchParams(newParams, { replace: true });
  };

  const generateShareableURL = (projectId: string, state?: WeatherURLState) => {
    const currentState = state || urlState;
    const params = new URLSearchParams(window.location.search);
    
    if (currentState.tab && currentState.tab !== 'live') {
      params.set('tab', currentState.tab);
    }
    
    if (currentState.days && currentState.days !== 7) {
      params.set('days', currentState.days.toString());
    }
    
    if (currentState.startDate) {
      params.set('startDate', currentState.startDate);
    }
    
    if (currentState.endDate) {
      params.set('endDate', currentState.endDate);
    }

    const baseURL = window.location.origin + window.location.pathname;
    return `${baseURL}?${params.toString()}`;
  };

  return {
    urlState,
    updateURL,
    generateShareableURL,
  };
};