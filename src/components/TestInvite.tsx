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

      console.log('✅ Invitation found:', data);
      setInvitation(data);
    } catch (error) {
      console.error('💥 Error validating invitation:', error);
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
    return <div>Loading validation...</div>;
  }
  
  return (
    <div>
      <p>Token: {token}</p>
      <p>Invitation: {invitation ? 'Found' : 'Not found'}</p>
      <p>Component loaded successfully!</p>
    </div>
  );
};

export default TestInvite;