import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Mail, Clock, Trash2, Crown, User } from 'lucide-react';

interface PendingInvitation {
  id: string;
  email: string;
  company_role: 'company_admin' | 'company_member';
  expires_at: string;
  created_at: string;
}

interface PendingInvitationsTableProps {
  invitations: PendingInvitation[];
  onRefresh: () => void;
  loading: boolean;
}

export const PendingInvitationsTable: React.FC<PendingInvitationsTableProps> = ({
  invitations,
  onRefresh,
  loading,
}) => {
  const { toast } = useToast();

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Invitation Cancelled",
        description: "The invitation has been cancelled successfully",
      });

      onRefresh();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  const handleResendInvitation = async (invitation: PendingInvitation) => {
    try {
      // Update the expiry date to extend the invitation
      const { error: updateError } = await supabase
        .from('user_invitations')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          updated_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // Send invitation email
      try {
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          'send-invitation',
          {
            body: { invitationId: invitation.id }
          }
        );

        if (emailError) {
          console.error('Email sending error:', emailError);
          toast({
            title: "Invitation Extended",
            description: `Invitation expiry extended for ${invitation.email}, but email sending failed.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Invitation Resent",
            description: `Invitation email resent to ${invitation.email}`,
          });
        }
      } catch (emailError) {
        console.error('Email function error:', emailError);
        toast({
          title: "Invitation Extended",
          description: `Invitation expiry extended for ${invitation.email}, but email sending failed.`,
          variant: "destructive",
        });
      }

      onRefresh();
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'company_admin' ? (
      <Badge variant="default" className="flex items-center space-x-1">
        <Crown className="h-3 w-3" />
        <span>Admin</span>
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center space-x-1">
        <User className="h-3 w-3" />
        <span>Member</span>
      </Badge>
    );
  };

  const getTimeUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return "Expired";
    if (diffDays === 1) return "Expires in 1 day";
    return `Expires in ${diffDays} days`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Invitations</h3>
        <p className="text-gray-600">All invitations have been accepted or expired.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Sent</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell className="font-medium">
              {invitation.email}
            </TableCell>
            <TableCell>
              {getRoleBadge(invitation.company_role)}
            </TableCell>
            <TableCell>
              {new Date(invitation.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="flex items-center space-x-1 w-fit">
                <Clock className="h-3 w-3" />
                <span>{getTimeUntilExpiry(invitation.expires_at)}</span>
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResendInvitation(invitation)}
                >
                  Resend
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel the invitation to {invitation.email}?
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Cancel Invitation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};