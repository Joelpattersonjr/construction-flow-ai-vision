import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPreferences, profileService } from '@/services/profileService';
import { DateUtils } from '@/utils/dateUtils';
import { useAuth } from '@/contexts/AuthContext';

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
  loading: boolean;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  notifications: {
    email: true,
    push: true,
    task_assignments: true,
    due_date_reminders: true,
    project_updates: true,
  },
  language: 'en',
  timezone: 'UTC',
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

interface UserPreferencesProviderProps {
  children: ReactNode;
}

export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { i18n } = useTranslation();

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const profile = await profileService.getCurrentProfile();
        
        if (profile?.preferences) {
          const userPrefs = profile.preferences as unknown as UserPreferences;
          setPreferences(userPrefs);
          
          // Apply preferences immediately
          await applyPreferences(userPrefs);
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Apply preferences to the application
  const applyPreferences = async (prefs: UserPreferences) => {
    try {
      // Apply language
      if (prefs.language && i18n.language !== prefs.language) {
        await i18n.changeLanguage(prefs.language);
      }

      // Apply timezone
      if (prefs.timezone) {
        DateUtils.setUserTimezone(prefs.timezone);
      }
    } catch (error) {
      console.error('Error applying preferences:', error);
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    
    try {
      // Update in database
      await profileService.updatePreferences(newPreferences);
      
      // Update local state
      setPreferences(updatedPreferences);
      
      // Apply new preferences
      await applyPreferences(updatedPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
        loading,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};