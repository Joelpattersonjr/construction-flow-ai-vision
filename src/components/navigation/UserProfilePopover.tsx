import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { User, ChevronDown, LogOut, UserCheck, Building2, Settings, UserCog } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const UserProfilePopover: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span className="text-sm text-gray-600">
            {profile?.full_name || user?.email}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <UserCheck className="h-4 w-4" />
              <span>Account Information</span>
            </h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <span className="font-medium text-gray-700 min-w-[60px]">Name:</span>
              <span className="text-gray-600">{profile?.full_name || 'Not provided'}</span>
            </div>
            
            <div className="flex items-start space-x-2">
              <span className="font-medium text-gray-700 min-w-[60px]">Email:</span>
              <span className="text-gray-600 break-all">{user?.email}</span>
            </div>
            
            <div className="flex items-start space-x-2">
              <span className="font-medium text-gray-700 min-w-[60px]">Role:</span>
              <span className="text-gray-600">{profile?.job_title || 'User'}</span>
            </div>
            
            <div className="flex items-start space-x-2">
              <span className="font-medium text-gray-700 min-w-[60px]">Status:</span>
              <span className="text-gray-600 capitalize">
                {profile?.company_role === 'company_admin' ? 'Company Admin' : 'Team Member'}
              </span>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="flex items-center space-x-2 mb-3">
              <Building2 className="h-4 w-4 text-gray-500" />
              <h4 className="font-medium text-gray-900">Company Details</h4>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <span className="font-medium text-gray-700 min-w-[70px]">Company:</span>
                <span className="text-gray-600">{profile?.company?.name || 'Not provided'}</span>
              </div>
              
              {profile?.company_role === 'company_member' && (
                <div className="bg-blue-50 p-2 rounded-md">
                  <p className="text-xs text-blue-700">
                    <span className="font-medium">Welcome to the team!</span>
                    <br />
                    You were invited to join {profile?.company?.name || 'this company'} by a company administrator.
                  </p>
                </div>
              )}
              
              {profile?.company_role === 'company_admin' && (
                <div className="bg-green-50 p-2 rounded-md">
                  <p className="text-xs text-green-700">
                    <span className="font-medium">Administrator Access</span>
                    <br />
                    You have full access to manage company settings and invite team members.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-3 space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/profile')}
              className="w-full flex items-center justify-center space-x-2"
            >
              <UserCog className="h-4 w-4" />
              <span>Profile Settings</span>
            </Button>
            
            {profile?.company_role === 'company_admin' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/admin')}
                className="w-full flex items-center justify-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Admin Dashboard</span>
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
              className="w-full flex items-center justify-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfilePopover;