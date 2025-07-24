import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import UserProfilePopover from './UserProfilePopover';
import { useAuth } from '@/contexts/AuthContext';

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogoClick = () => {
    // Navigate to dashboard if authenticated, landing if not
    navigate(user ? '/dashboard' : '/');
  };

  return (
    <header className="bg-background border-b border-border construction-texture">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center space-x-4">
          <SidebarTrigger />
          <h1 
            className="text-xl font-header font-bold text-foreground cursor-pointer tracking-tight"
            onClick={handleLogoClick}
          >
            ConexusPM
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <UserProfilePopover />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;