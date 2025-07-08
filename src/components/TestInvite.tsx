import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const TestInvite = () => {
  console.log('🧪 TestInvite component rendering');
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  
  console.log('Token from URL:', token);
  
  const validateInvitation = async () => {
    try {
      setLoading(true);
      console.log('🔍 Validating invitation token:', token);
      
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('invitation_token', token)
        .single();

      console.log('💾 Database query result:', { data, error });

      if (error) {
        console.error('❌ Database error:', error);
        setInvitation(null);
        return;
      }

      if (!data) {
        console.log('❌ No invitation found');
        setInvitation(null);
        return;
      }

      // Check if already accepted
      if (data.accepted_at) {
        console.log('❌ Invitation already accepted');
        toast({
          title: "Invitation Already Used",
          description: "This invitation has already been accepted.",
          variant: "destructive",
        });
        setInvitation(null);
        return;
      }

      // Check if expired
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      console.log('Checking expiration:', { now: now.toISOString(), expires_at: expiresAt.toISOString(), isExpired: expiresAt < now });
      
      if (expiresAt < now) {
        console.log('❌ INVITATION EXPIRED - This would cause redirect!');
        toast({
          title: "Invitation Expired",
          description: "This invitation has expired. Please request a new one.",
          variant: "destructive",
        });
        setInvitation(null);
        return;
      }

      console.log('✅ Invitation is valid:', data);
      setInvitation(data);
      setFormData(prev => ({ ...prev, email: data.email }));
    } catch (error) {
      console.error('💥 VALIDATION ERROR:', error);
      setInvitation(null);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    console.log('🔍 useEffect triggered with token:', token);
    if (!token) {
      console.log('❌ No token found');
      return;
    }
    console.log('✅ Token found, validating...');
    validateInvitation();
  }, [token]);
  
  if (loading) {
    return <div style={{padding: '20px'}}>Loading validation...</div>;
  }
  
  return (
    <div style={{padding: '20px'}}>
      <h1>Invite Acceptance Test</h1>
      <p>Token: {token}</p>
      <p>Invitation: {invitation ? 'Found and Valid' : 'Not found or invalid'}</p>
      {invitation && (
        <div>
          <p>Email: {invitation.email}</p>
          <p>Company Role: {invitation.company_role}</p>
          <p>Expires: {invitation.expires_at}</p>
        </div>
      )}
      <p>Component loaded successfully!</p>
    </div>
  );
};

export default TestInvite;