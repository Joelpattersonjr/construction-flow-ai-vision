
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuthActions = () => {
  const { toast } = useToast();

  const signIn = async (email: string, password: string) => {
    try {
      // First check if account is locked
      const { data: isLocked } = await supabase.rpc('is_account_locked', { 
        user_email: email 
      });

      if (isLocked) {
        // Get lockout details
        const { data: lockoutInfo } = await supabase
          .from('account_lockouts')
          .select('unlock_at, lockout_count')
          .eq('email', email)
          .maybeSingle();

        if (lockoutInfo) {
          const unlockTime = new Date(lockoutInfo.unlock_at);
          const now = new Date();
          const timeRemaining = Math.ceil((unlockTime.getTime() - now.getTime()) / 1000);
          
          if (timeRemaining > 0) {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
            
            toast({
              title: "Account Locked",
              description: `Too many failed attempts. Try again in ${timeString}.`,
              variant: "destructive",
            });
            return { error: { message: 'Account locked' } };
          }
        }
      }

      // Check if this is a temporary password using the validation function
      console.log('Checking temporary password:', password, 'for email:', email);
      const { data: validationResult, error: validationError } = await supabase.rpc('validate_temporary_password', {
        temp_password: password,
        user_email: email
      });

      console.log('Temporary password validation result:', { validationResult, validationError });

      const result = validationResult as any;
      if (result && result.valid) {
        console.log('Valid temporary password found, proceeding with auth');
        
        // First, try to create the user in auth.users if they don't exist
        console.log('Creating/updating user with temporary password');
        const { data: authUser, error: signUpError } = await supabase.auth.signUp({
          email,
          password: result.temp_password,
        });
        
        console.log('Sign up result:', { authUser, signUpError });
        
        if (signUpError && !signUpError.message.includes('User already registered')) {
          console.error('Error creating user:', signUpError);
          return { error: signUpError };
        }
        
        // Now try to sign in with the temporary password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: result.temp_password,
        });
        
        console.log('Sign in result:', { signInError });
        
        if (!signInError) {
          // After successful sign in, we need to link the existing profile data to the new auth user
          const currentAuthUser = (await supabase.auth.getUser()).data.user;
          if (currentAuthUser && currentAuthUser.id !== result.existing_profile_id) {
            console.log('Linking existing profile data to new auth user');
            
            // Get the existing profile data
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', result.existing_profile_id)
              .single();
            
            if (existingProfile) {
              // Update the auto-created profile with the existing profile data
              await supabase
                .from('profiles')
                .update({
                  full_name: existingProfile.full_name,
                  email: existingProfile.email,
                  job_title: existingProfile.job_title,
                  company_id: existingProfile.company_id,
                  company_role: existingProfile.company_role,
                  custom_fields: existingProfile.custom_fields,
                  updated_at: new Date().toISOString()
                })
                .eq('id', currentAuthUser.id);
              
              // Delete the old profile
              await supabase
                .from('profiles')
                .delete()
                .eq('id', result.existing_profile_id);
            }
          }
          
          // Mark temporary password as used
          await supabase
            .from('admin_password_resets')
            .update({ used_at: new Date().toISOString() })
            .eq('id', result.temp_password_id);
          
          toast({
            title: "Temporary Password Used",
            description: "Please update your password in your profile settings.",
            variant: "default",
          });
        }
        return { error: signInError };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Handle failed login attempt
        const { data: lockoutResult } = await supabase.rpc('handle_failed_login', {
          user_email: email,
          user_ip: null, // Could be enhanced to capture real IP
          user_agent_string: navigator.userAgent
        });

        const result = lockoutResult as any;
        if (result?.locked) {
          const unlockTime = new Date(result.unlock_at);
          const now = new Date();
          const timeRemaining = Math.ceil((unlockTime.getTime() - now.getTime()) / 1000);
          const minutes = Math.floor(timeRemaining / 60);
          const seconds = timeRemaining % 60;
          const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
          
          toast({
            title: "Account Locked",
            description: `Too many failed attempts. Account locked for ${timeString}.`,
            variant: "destructive",
          });
        } else if (result?.remaining_attempts) {
          toast({
            title: "Invalid credentials",
            description: `${result.remaining_attempts} attempts remaining before account lockout.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error signing in",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        // Handle successful login
        await supabase.rpc('handle_successful_login', {
          user_email: email,
          user_ip: null,
          user_agent_string: navigator.userAgent
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, jobTitle?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const userData: any = {
        full_name: fullName,
      };
      
      if (jobTitle) {
        userData.job_title = jobTitle;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      if (error) {
        toast({
          title: "Error signing up",
          description: error.message,
          variant: "destructive",
        });
      } else if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration.",
        });
      }

      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async (setUser: (user: any) => void, setSession: (session: any) => void, setProfile: (profile: any) => void) => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const clearAuthState = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Clear auth state error:', error);
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    clearAuthState
  };
};
