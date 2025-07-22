import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Folder, Files, Users, Home, CheckSquare, Calendar, CheckCircle, FileText } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from '@/contexts/AuthContext';
const navigationItems = [{
  path: '/dashboard',
  label: 'Dashboard',
  icon: Home
}, {
  path: '/projects',
  label: 'Projects',
  icon: Folder
}, {
  path: '/tasks',
  label: 'Tasks',
  icon: CheckSquare
}, {
  path: '/calendar',
  label: 'Calendar',
  icon: Calendar
}, {
  path: '/files',
  label: 'Files',
  icon: Files
}, {
  path: '/forms',
  label: 'Forms',
  icon: FileText
}, {
  path: '/approvals',
  label: 'Approvals',
  icon: CheckCircle
}];
export const AppSidebar: React.FC = () => {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    profile
  } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  // Add admin items if user is admin
  const allNavigationItems = [...navigationItems, ...(profile?.company_role === 'company_admin' ? [{
    path: '/admin',
    label: 'Admin',
    icon: Users
  }] : [])];
  return <Sidebar className={state === "collapsed" ? "w-16" : "w-64"}>
      <SidebarContent>
        <SidebarGroup className="mx-0 my-0 px-0 py-0 rounded-none">
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allNavigationItems.map(item => {
              const Icon = item.icon;
              return <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton onClick={() => {
                  console.log('Navigating to:', item.path);
                  navigate(item.path);
                }} isActive={isActive(item.path)} className="cursor-pointer">
                      <Icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
};