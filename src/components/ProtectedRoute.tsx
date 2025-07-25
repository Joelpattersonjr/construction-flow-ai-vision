
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import CompanySetup from './CompanySetup';
import SubscriptionGate from './subscription/SubscriptionGate';

console.log('ProtectedRoute.tsx file loaded');

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, profile } = useAuth();
  const location = useLocation();
  
  console.log('ProtectedRoute check:', { 
    user: !!user, 
    loading, 
    profile: profile ? 'exists' : 'null/undefined',
    pathname: location.pathname,
    shouldRedirect: !loading && !user 
  });

  if (loading) {
    console.log('ProtectedRoute: showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: no user, redirecting to /');
    return <Navigate to="/" replace />;
  }

  // Check if user needs to set up their company (first-time admin users)
  // Skip company setup check for form fill routes
  console.log('ProtectedRoute profile data:', profile);
  if (profile && !profile.company_id && location.pathname !== '/company-setup' && !location.pathname.startsWith('/forms/fill/')) {
    console.log('ProtectedRoute: user needs company setup - company_id:', profile.company_id);
    return <CompanySetup />;
  }

  console.log('ProtectedRoute: user found, rendering children with subscription gate');
  return (
    <SubscriptionGate>
      {children}
    </SubscriptionGate>
  );
};

export default ProtectedRoute;
