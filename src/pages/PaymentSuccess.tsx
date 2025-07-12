import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        toast({
          title: "No session found",
          description: "Payment session not found.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      try {
        // Check subscription status to ensure it's updated
        const { error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error('Error checking subscription:', error);
        }

        setIsVerified(true);
        
        toast({
          title: "Payment successful!",
          description: "Your subscription has been activated.",
        });
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast({
          title: "Verification error",
          description: "There was an issue verifying your payment. Please contact support if you were charged.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, navigate, toast]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {isVerifying ? (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            ) : isVerified ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-500 text-2xl">!</span>
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {isVerifying 
              ? 'Verifying Payment...' 
              : isVerified 
                ? 'Payment Successful!' 
                : 'Payment Issue'
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {isVerifying 
              ? 'Please wait while we verify your payment and activate your subscription.'
              : isVerified 
                ? 'Thank you for your purchase! Your subscription is now active and you can access all premium features.'
                : 'There was an issue verifying your payment. If you were charged, please contact support.'
            }
          </p>
          
          {!isVerifying && (
            <Button onClick={handleContinue} className="w-full">
              Continue to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;