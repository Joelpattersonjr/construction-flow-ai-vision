import React from 'react';
import { useParams } from 'react-router-dom';

const TestInvite = () => {
  console.log('🧪 TestInvite component rendering');
  const { token } = useParams<{ token: string }>();
  
  console.log('Token from URL:', token);
  
  return (
    <div>
      <p>Token: {token}</p>
      <p>Component loaded successfully!</p>
    </div>
  );
};

export default TestInvite;