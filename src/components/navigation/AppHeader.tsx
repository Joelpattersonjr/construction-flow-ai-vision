import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Folder, Files, Users, Home } from 'lucide-react';
import UserProfilePopover from './UserProfilePopover';
import { useAuth } from '@/contexts/AuthContext';

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/projects', label: 'Projects', icon: Folder },
    { path: '/files', label: 'Files', icon: Files },
    ...(profile?.company_role === 'company_admin' ? [
      { path: '/admin', label: 'Admin', icon: Users }
    ] : [])
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 
              className="text-xl font-semibold text-gray-900 cursor-pointer"
              onClick={() => navigate('/')}
            >
              ProjectPulse
            </h1>
            
            <div className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
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