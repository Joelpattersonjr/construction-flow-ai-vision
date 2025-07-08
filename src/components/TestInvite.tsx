import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const TestInvite = () => {
  console.log('🧪 TestInvite component rendering');
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  console.log('Token from URL:', token);
  console.log('Navigate function available:', !!navigate);
  console.log('Toast function available:', !!toast);
  
  useEffect(() => {
    console.log('🔍 useEffect triggered with token:', token);
    if (!token) {
      console.log('❌ No token found, would redirect to /auth');
      // COMMENTING OUT THE REDIRECT FOR NOW
      // navigate('/auth');
      return;
    }
    console.log('✅ Token found, would validate invitation...');
  }, [token]);
  
  return (
    <div>
      <p>Token: {token}</p>
      <p>Component loaded successfully!</p>
      <p>Ready to add more functionality...</p>
    </div>
  );
};

export default TestInvite;