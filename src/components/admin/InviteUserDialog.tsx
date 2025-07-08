import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send } from 'lucide-react';

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
      const { error } = await supabase
        .from('user_invitations')
        .insert({
          email: formData.email,
          company_id: profile.company_id,
          invited_by: profile.id,
          company_role: formData.companyRole,
        });

      if (error) throw error;

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${formData.email}`,
      });

      // Reset form and close dialog
      setFormData({ email: '', companyRole: 'company_member' });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Invite User</span>
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your company. They'll receive an email with instructions to create their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyRole">Company Role</Label>
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
      </DialogContent>
    </Dialog>
  );
};