import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TestInvite = () => {
  console.log('🧪 TestInvite component rendering');
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  console.log('Token from URL:', token);
  console.log('Navigate function available:', !!navigate);
  
  return (
    <div>
      <p>Token: {token}</p>
      <p>Component loaded successfully!</p>
      <p>Ready to add more functionality...</p>
    </div>
  );
};

export default TestInvite;