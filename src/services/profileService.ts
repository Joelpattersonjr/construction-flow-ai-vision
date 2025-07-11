import { supabase } from '@/integrations/supabase/client';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    task_assignments: boolean;
    due_date_reminders: boolean;
    project_updates: boolean;
  };
  language: string;
  timezone: string;
}

export interface ProfileUpdate {
  full_name?: string;
  job_title?: string;
  avatar_url?: string;
  preferences?: any; // Use any to match the JSONB type
}

export const fetchProfile = async (userId: string) => {
  try {
    console.log('Fetching profile for user:', userId);
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      // If no profile exists, try to create one for existing users
      if (error.code === 'PGRST116') {
        console.log('No profile found, attempting to create one...');
        return await createProfileForExistingUser(userId);
      }
      return null;
    } else {
      console.log('Profile fetched successfully:', profileData);
      return profileData;
    }
  } catch (error) {
    console.error('Error in profile fetch:', error);
    return null;
  }
};

export const createProfileForExistingUser = async (userId: string) => {
  try {
    // Get user metadata
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

    console.log('Creating profile for existing user with metadata:', { fullName });

    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        company:companies(*)
      `)
      .single();

    if (error) {
      console.error('Error creating profile for existing user:', error);
      return null;
    }

    console.log('Profile created successfully for existing user:', newProfile);
    return newProfile;
  } catch (error) {
    console.error('Error in createProfileForExistingUser:', error);
    return null;
  }
};

// Enhanced profile service with new functionality
export const profileService = {
  // Get current user profile
  async getCurrentProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateProfile(updates: ProfileUpdate) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Upload avatar
  async uploadAvatar(file: File) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update profile with avatar URL
    await this.updateProfile({ avatar_url: publicUrl });

    return publicUrl;
  },

  // Remove avatar
  async removeAvatar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Remove from storage (try multiple extensions)
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.jpeg`]);

    // Update profile to remove avatar URL
    await this.updateProfile({ avatar_url: null });

    return true;
  },

  // Update preferences
  async updatePreferences(preferences: Partial<UserPreferences>) {
    const currentProfile = await this.getCurrentProfile();
    const updatedPreferences = { ...currentProfile.preferences, ...preferences };
    
    return this.updateProfile({ preferences: updatedPreferences });
  }
};