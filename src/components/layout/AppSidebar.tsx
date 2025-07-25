import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from '@/components/ui/sidebar';
import { 
  Home, 
  Folder, 
  CheckSquare, 
  Calendar, 
  Files, 
  FileText, 
  CheckCircle, 
  Users 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const AppSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: sidebarState } = useSidebar();
  const { profile } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/projects', label: 'Projects', icon: Folder },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/files', label: 'Documents', icon: Files },
    { path: '/forms', label: 'Forms', icon: FileText },
    { path: '/approvals', label: 'Approvals', icon: CheckCircle },
    ...(profile?.company_role === 'company_admin' ? [
      { path: '/admin', label: 'Admin', icon: Users }
    ] : [])
  ];

  const handleNavigation = (path: string) => {
    console.log('Navigating to:', path);
    navigate(path);
  };

  return (
    <Sidebar 
      variant="inset"
      className={sidebarState === 'collapsed' ? 'w-14' : 'w-60'}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.path)}
                      isActive={isActive(item.path)}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Icon className="h-4 w-4" />
                      {sidebarState !== 'collapsed' && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};