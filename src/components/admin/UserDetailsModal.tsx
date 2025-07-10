import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Crown, User, Mail, Briefcase, Calendar, Building2 } from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  job_title: string;
  company_role: 'company_admin' | 'company_member';
  updated_at: string;
}

interface UserDetailsModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  member,
  isOpen,
  onClose,
  userEmail
}) => {
  if (!member) return null;

  const getRoleBadge = (role: string) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Team Member Details</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with name and role */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">
              {member.full_name || 'No name provided'}
            </h3>
            {getRoleBadge(member.company_role)}
          </div>

          {/* Details grid */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{userEmail || 'Not available'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Briefcase className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Job Title</p>
                <p className="text-sm">{member.job_title || 'No title specified'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Company Role</p>
                <p className="text-sm capitalize">
                  {member.company_role === 'company_admin' ? 'Company Administrator' : 'Team Member'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p className="text-sm">
                  {new Date(member.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Additional info section for future expansion */}
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground text-center">
              Additional profile information can be added here in the future
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};