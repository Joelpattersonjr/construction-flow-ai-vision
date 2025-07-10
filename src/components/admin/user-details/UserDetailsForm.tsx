import React from 'react';
import { Input } from '@/components/ui/input';
import { Mail, Briefcase, Building2, Calendar } from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  job_title: string;
  company_role: 'company_admin' | 'company_member';
  updated_at: string;
  custom_fields?: Record<string, any>;
}

interface UserDetailsFormProps {
  member: TeamMember;
  userEmail?: string;
  isEditing: boolean;
  editingName: string;
  editingJobTitle: string;
  onNameChange: (value: string) => void;
  onJobTitleChange: (value: string) => void;
}

export const UserDetailsForm: React.FC<UserDetailsFormProps> = ({
  member,
  userEmail,
  isEditing,
  editingName,
  editingJobTitle,
  onNameChange,
  onJobTitleChange
}) => {
  return (
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
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">Job Title</p>
          {isEditing ? (
            <Input
              value={editingJobTitle}
              onChange={(e) => onJobTitleChange(e.target.value)}
              placeholder="Enter job title"
              className="text-sm mt-1"
            />
          ) : (
            <p className="text-sm">{member.job_title || 'No title specified'}</p>
          )}
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
  );
};