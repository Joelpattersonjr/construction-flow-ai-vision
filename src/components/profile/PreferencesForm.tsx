import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPreferences } from '@/services/profileService';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { DateUtils } from '@/utils/dateUtils';

interface PreferencesFormProps {
  preferences: UserPreferences;
  onPreferencesChange: (preferences: Partial<UserPreferences>) => void;
}

export const PreferencesForm: React.FC<PreferencesFormProps> = ({
  preferences,
  onPreferencesChange,
}) => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  // Sync next-themes with user preferences on mount
  useEffect(() => {
    if (preferences.theme && theme !== preferences.theme) {
      setTheme(preferences.theme);
    }
  }, [preferences.theme, theme, setTheme]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    onPreferencesChange({ theme: newTheme as 'light' | 'dark' | 'system' });
  };

  const handleNotificationChange = (key: keyof UserPreferences['notifications'], value: boolean) => {
    onPreferencesChange({
      notifications: {
        ...preferences.notifications,
        [key]: value,
      },
    });
  };

  const handleLanguageChange = (language: string) => {
    onPreferencesChange({ language });
  };

  const handleTimezoneChange = (timezone: string) => {
    onPreferencesChange({ timezone });
  };

  const timezones = DateUtils.getTimezones();

  return (
    <div className="space-y-6">
      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.appearance')}</CardTitle>
          <CardDescription>
            {t('profile.appearanceDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme">{t('profile.theme')}</Label>
            <Select value={preferences.theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('themes.light')}</SelectItem>
                <SelectItem value="dark">{t('themes.dark')}</SelectItem>
                <SelectItem value="system">{t('themes.system')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.notifications')}</CardTitle>
          <CardDescription>
            {t('profile.notificationsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications">{t('profile.emailNotifications')}</Label>
            <Switch
              id="email-notifications"
              checked={preferences.notifications.email}
              onCheckedChange={(checked) => handleNotificationChange('email', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications">{t('profile.pushNotifications')}</Label>
            <Switch
              id="push-notifications"
              checked={preferences.notifications.push}
              onCheckedChange={(checked) => handleNotificationChange('push', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="task-assignments">{t('profile.taskAssignments')}</Label>
            <Switch
              id="task-assignments"
              checked={preferences.notifications.task_assignments}
              onCheckedChange={(checked) => handleNotificationChange('task_assignments', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="due-date-reminders">{t('profile.dueDateReminders')}</Label>
            <Switch
              id="due-date-reminders"
              checked={preferences.notifications.due_date_reminders}
              onCheckedChange={(checked) => handleNotificationChange('due_date_reminders', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="project-updates">{t('profile.projectUpdates')}</Label>
            <Switch
              id="project-updates"
              checked={preferences.notifications.project_updates}
              onCheckedChange={(checked) => handleNotificationChange('project_updates', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language & Region Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.languageRegion')}</CardTitle>
          <CardDescription>
            {t('profile.languageRegionDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="language">{t('profile.language')}</Label>
            <Select value={preferences.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('languages.en')}</SelectItem>
                <SelectItem value="es">{t('languages.es')}</SelectItem>
                <SelectItem value="fr">{t('languages.fr')}</SelectItem>
                <SelectItem value="de">{t('languages.de')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="timezone">{t('profile.timezone')}</Label>
            <Select value={preferences.timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};