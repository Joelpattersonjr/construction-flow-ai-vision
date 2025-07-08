
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfile } from '@/services/profileService';

console.log('useAuthState.ts file loaded');

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('useAuthState hook initialized');

  useEffect(() => {
    let mounted = true;
    console.log('useAuthState useEffect triggered');

    const initializeAuth = async () => {
      try {
        console.log('Getting initial session...');
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        console.log('Initial session:', { 
          hasSession: !!initialSession, 
          hasUser: !!initialSession?.user,
          userId: initialSession?.user?.id 
        });
        
        if (!mounted) return;
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        // Fetch profile if user exists
        if (initialSession?.user) {
          console.log('Fetching profile for user:', initialSession.user.id);
          const profileData = await fetchProfile(initialSession.user.id);
          if (mounted) {
            console.log('Profile fetched:', { hasProfile: !!profileData });
            setProfile(profileData);
          }
        }
        
        if (mounted) {
          console.log('Setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener - using non-async callback to prevent deadlocks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle profile fetching with setTimeout to prevent blocking
        if (session?.user) {
          setTimeout(async () => {
            if (!mounted) return;
            try {
              const profileData = await fetchProfile(session.user.id);
              if (mounted) {
                setProfile(profileData);
              }
            } catch (error) {
              console.error('Error fetching profile in auth state change:', error);
              if (mounted) {
                setProfile(null);
              }
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        // Ensure loading is set to false after auth state change
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    profile,
    loading,
    setUser,
    setSession,
    setProfile
  };
};
