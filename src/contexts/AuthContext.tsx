
import React, { createContext, useContext } from 'react';
import { AuthContextType } from '@/types/auth';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/services/authService';

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
