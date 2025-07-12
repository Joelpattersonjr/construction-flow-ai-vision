
import React, { createContext, useContext, useEffect } from 'react';
import { AuthContextType } from '@/types/auth';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';

console.log('AuthContext.tsx file loaded');

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('AuthProvider rendering');
  const { user, session, profile, loading, setUser, setSession, setProfile } = useAuthState();
  const { signIn, signUp, signOut: authSignOut, clearAuthState } = useAuthActions();

  console.log('AuthProvider state:', { user: !!user, session: !!session, profile: !!profile, loading });

  // Check subscription status when user logs in
  useEffect(() => {
    if (user && session) {
      const checkSubscription = async () => {
        try {
          await supabase.functions.invoke('check-subscription');
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      };
      checkSubscription();
    }
  }, [user, session]);

  const signOut = async () => {
    await authSignOut(setUser, setSession, setProfile);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    clearAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
