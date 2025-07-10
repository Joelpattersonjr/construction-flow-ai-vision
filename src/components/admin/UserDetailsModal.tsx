import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { User, Edit, Save, X, Shield } from 'lucide-react';
import { UserDetailsBadge } from './user-details/UserDetailsBadge';
import { UserDetailsForm } from './user-details/UserDetailsForm';
import { CustomFieldRenderer } from './user-details/CustomFieldRenderer';
import { PasswordResetDialog } from './PasswordResetDialog';
import { useUserDetailsModal } from '@/hooks/useUserDetailsModal';
import { TeamMember } from '@/types/admin';

interface UserDetailsModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  member,
  isOpen,
  onClose,
  onRefresh
}) => {
  const { profile } = useAuth();
  const {
    isEditing,
    setIsEditing,
    customFields,
    customFieldValues,
    loading,
    editingName,
    setEditingName,
    editingEmail,
    setEditingEmail,
    editingJobTitle,
    setEditingJobTitle,
    handleSave,
    handleCustomFieldChange,
  } = useUserDetailsModal(member, isOpen, onRefresh);

  const [passwordResetOpen, setPasswordResetOpen] = useState(false);

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Team Member Details</span>
            </DialogTitle>
            {profile?.company_role === 'company_admin' && (
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSave} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with name and role */}
          <div className="text-center space-y-2">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="Enter full name"
                  className="text-center text-lg font-semibold"
                />
              </div>
            ) : (
              <h3 className="text-lg font-semibold">
                {member.full_name || 'No name provided'}
              </h3>
            )}
            <UserDetailsBadge role={member.company_role} />
          </div>

          {/* Standard Details */}
          <UserDetailsForm
            member={member}
            isEditing={isEditing}
            editingName={editingName}
            editingEmail={editingEmail}
            editingJobTitle={editingJobTitle}
            onNameChange={setEditingName}
            onEmailChange={setEditingEmail}
            onJobTitleChange={setEditingJobTitle}
          />

          {/* Custom Fields */}
          {(customFields.length > 0 || isEditing) && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-4">Additional Information</h4>
              <div className="space-y-4">
                {customFields.map((field) => (
                  <CustomFieldRenderer
                    key={field.id}
                    field={field}
                    value={customFieldValues[field.field_name] || ''}
                    isEditing={isEditing}
                    onChange={handleCustomFieldChange}
                  />
                ))}
              </div>
            </div>
          )}

          {customFields.length === 0 && !isEditing && (
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground text-center">
                No custom fields configured. Company admins can add custom fields in the admin panel.
              </p>
            </div>
          )}

          {/* Security Actions - Only for admins */}
          {profile?.company_role === 'company_admin' && !isEditing && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-4">Security Actions</h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPasswordResetOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Reset Password
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Reset the user's password and unlock their account if locked
              </p>
            </div>
          )}
        </div>
      </DialogContent>

      <PasswordResetDialog
        isOpen={passwordResetOpen}
        onOpenChange={setPasswordResetOpen}
        user={member && profile?.company_id ? {
          id: member.id,
          email: member.email || '',
          full_name: member.full_name || '',
          company_id: profile.company_id
        } : null}
      />
    </Dialog>
  );
};