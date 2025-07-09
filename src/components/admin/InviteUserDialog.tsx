import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, UserPlus, Users } from 'lucide-react';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSent: () => void;
}

export const InviteUserDialog: React.FC<InviteUserDialogProps> = ({
  open,
  onOpenChange,
  onInviteSent,
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    companyRole: 'company_member',
    fullName: '',
    jobTitle: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    try {
      setLoading(true);

      // Check if user already exists or has pending invitation
      const { data: existingInvitation } = await supabase
        .from('user_invitations')
        .select('id')
        .eq('email', formData.email)
        .eq('company_id', profile.company_id)
        .is('accepted_at', null)
        .single();

      if (existingInvitation) {
        toast({
          title: "Invitation Already Sent",
          description: "This user already has a pending invitation.",
          variant: "destructive",
        });
        return;
      }

      // Create invitation
      const { data: newInvitation, error } = await supabase
        .from('user_invitations')
        .insert({
          email: formData.email,
          company_id: profile.company_id,
          invited_by: profile.id,
          company_role: formData.companyRole,
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      try {
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          'send-invitation',
          {
            body: { invitationId: newInvitation.id }
          }
        );

        if (emailError) {
          console.error('Email sending error:', emailError);
          toast({
            title: "Invitation Created",
            description: `Invitation created for ${formData.email}, but email sending failed. You can resend it from the pending invitations tab.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Invitation Sent",
            description: `Invitation email sent to ${formData.email}`,
          });
        }
      } catch (emailError) {
        console.error('Email function error:', emailError);
        toast({
          title: "Invitation Created",
          description: `Invitation created for ${formData.email}, but email sending failed. You can resend it from the pending invitations tab.`,
          variant: "destructive",
        });
      }

      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
      onInviteSent();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;

    try {
      setLoading(true);

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      // Create user directly
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          companyId: profile.company_id,
          companyRole: formData.companyRole,
          fullName: formData.fullName,
          jobTitle: formData.jobTitle,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "User Created",
        description: `User account created successfully for ${formData.email}`,
      });

      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
      onInviteSent();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      email: '', 
      companyRole: 'company_member',
      fullName: '',
      jobTitle: '',
      password: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Add Team Member</span>
          </DialogTitle>
          <DialogDescription>
            Choose how to add a new team member to your company.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="invite" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invite" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Send Invite</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Add Directly</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invite" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Send an invitation email. The user will create their own account.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role">Company Role</Label>
                <Select
                  value={formData.companyRole}
                  onValueChange={(value) => setFormData({ ...formData, companyRole: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company_member">Company Member</SelectItem>
                    <SelectItem value="company_admin">Company Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="create" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Create the user account directly. A password will be set for them.
            </p>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-email">Email Address</Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-password">Temporary Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  placeholder="Enter a temporary password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-name">Full Name</Label>
                <Input
                  id="create-name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-title">Job Title</Label>
                <Input
                  id="create-title"
                  type="text"
                  placeholder="Enter job title"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-role">Company Role</Label>
                <Select
                  value={formData.companyRole}
                  onValueChange={(value) => setFormData({ ...formData, companyRole: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company_member">Company Member</SelectItem>
                    <SelectItem value="company_admin">Company Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};