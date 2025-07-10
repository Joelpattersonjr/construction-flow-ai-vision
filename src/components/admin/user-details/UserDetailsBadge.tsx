import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, User } from 'lucide-react';

interface UserDetailsBadgeProps {
  role: 'company_admin' | 'company_member';
}

export const UserDetailsBadge: React.FC<UserDetailsBadgeProps> = ({ role }) => {
  return role === 'company_admin' ? (
    <Badge variant="default" className="flex items-center space-x-1">
      <Crown className="h-3 w-3" />
      <span>Company Admin</span>
    </Badge>
  ) : (
    <Badge variant="secondary" className="flex items-center space-x-1">
      <User className="h-3 w-3" />
      <span>Team Member</span>
    </Badge>
  );
};