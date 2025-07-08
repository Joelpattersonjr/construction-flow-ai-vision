import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

console.log('InviteAcceptanceSimple.tsx file loaded');

const InviteAcceptanceSimple = () => {
  console.log('🚀 InviteAcceptanceSimple component is rendering!');
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  console.log('InviteAcceptanceSimple component mounted with token:', token);
  
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('InviteAcceptanceSimple useEffect triggered with token:', token);
    if (!token) {
      console.log('No token found, redirecting to /auth');
      navigate('/auth');
      return;
    }
    
    console.log('Token found, validating invitation...');
    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      setLoading(true);
      
      console.log('Validating invitation token:', token);
      
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('invitation_token', token)
        .single();

      console.log('Invitation query result:', { data, error });

      if (error) {
        console.error('Database error:', error);
        toast({
          title: "Invalid Invitation",
          description: "This invitation link is invalid or has expired.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      if (!data) {
        toast({
          title: "Invalid Invitation",
          description: "This invitation link is invalid or has expired.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Check if already accepted
      if (data.accepted_at) {
        toast({
          title: "Invitation Already Used",
          description: "This invitation has already been accepted.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        toast({
          title: "Invitation Expired",
          description: "This invitation has expired. Please request a new one.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      console.log('Invitation is valid:', data);
      setInvitation(data);
    } catch (error) {
      console.error('Error validating invitation:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-4">
            This invitation link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">You're Invited!</h1>
          <p className="mt-2 text-gray-600">
            You've been invited to join. Complete your registration below.
          </p>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <p>Invitation for: <strong>{invitation.email}</strong></p>
            <p>Role: <strong className="capitalize">{invitation.company_role?.replace('_', ' ')}</strong></p>
          </div>
        </div>

        <div className="mt-6">
          <p>Ready to implement signup form...</p>
        </div>
      </div>
    </div>
  );
};

export default InviteAcceptanceSimple;