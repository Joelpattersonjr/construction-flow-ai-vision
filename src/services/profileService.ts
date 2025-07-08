
import { supabase } from '@/integrations/supabase/client';

export const fetchProfile = async (userId: string) => {
  try {
    console.log('Fetching profile for user:', userId);
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
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
    const companyName = user.user_metadata?.company_name || 'Unknown Company';

    console.log('Creating profile for existing user with metadata:', { fullName, companyName });

    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        company_name: companyName,
        updated_at: new Date().toISOString()
      })
      .select()
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
