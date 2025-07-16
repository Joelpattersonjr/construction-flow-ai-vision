import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { PreferencesForm } from '@/components/profile/PreferencesForm';
import { NotificationTestPanel } from '@/components/profile/NotificationTestPanel';
import { profileService, UserPreferences } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';


export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { preferences, updatePreferences } = useUserPreferences();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await profileService.getCurrentProfile();
      setProfile(profileData);
      setFullName(profileData.full_name || '');
      setJobTitle(profileData.job_title || '');
      setEmail(profileData.email || '');
      setAvatarUrl(profileData.avatar_url);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: t('common.error'),
        description: t('profile.loadFailed'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await profileService.updateProfile({
        full_name: fullName,
        job_title: jobTitle,
      });
      
      toast({
        title: t('profile.updated'),
        description: t('profile.updatedDesc'),
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: t('profile.saveFailed'),
        description: t('profile.saveFailedDesc'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesChange = async (newPreferences: Partial<UserPreferences>) => {
    try {
      await updatePreferences(newPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: t('profile.saveFailed'),
        description: t('profile.saveFailedDesc'),
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string | null) => {
    setAvatarUrl(newAvatarUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/dashboard');
            }
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
            <p className="text-muted-foreground">{t('profile.subtitle')}</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Profile Information */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.information')}</CardTitle>
                <CardDescription>
                  {t('profile.informationDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex justify-center">
                  <AvatarUpload
                    currentAvatarUrl={avatarUrl}
                    userName={fullName}
                    onAvatarUpdate={handleAvatarUpdate}
                  />
                </div>

                <Separator />

                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('profile.fullName')}</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('profile.fullName')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">{t('profile.jobTitle')}</Label>
                    <Input
                      id="jobTitle"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder={t('profile.jobTitle')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('profile.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('profile.emailNote')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preferences */}
          <div className="space-y-6">
            <PreferencesForm
              preferences={preferences}
              onPreferencesChange={handlePreferencesChange}
            />
          </div>
        </div>

        {/* Email Notification System Testing */}
        <div className="mt-8">
          <NotificationTestPanel />
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <Button onClick={handleSaveProfile} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? t('profile.saving') : t('profile.saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  );
}