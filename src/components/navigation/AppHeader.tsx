import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from "@/components/ui/sidebar";
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
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <SidebarTrigger />
            <h1 
              className="text-xl font-semibold text-gray-900 cursor-pointer"
              onClick={handleLogoClick}
            >
              ConexusPM
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <UserProfilePopover />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AppHeader;