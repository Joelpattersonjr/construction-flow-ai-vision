import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Check, Loader2 } from 'lucide-react';

const InviteAcceptance = () => {
  console.log('🧪 InviteAcceptance component rendering');
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">You're Invited!</CardTitle>
          <CardDescription>
            You've been invited to join the team. Complete your registration below.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <Mail className="h-4 w-4" />
              <span>Invitation for: <strong>{invitation?.email}</strong></span>
            </div>
            <div className="text-sm text-blue-600 mt-1">
              Role: <strong className="capitalize">{invitation?.company_role.replace('_', ' ')}</strong>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Choose a secure password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <Button 
              className="w-full" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                'Accept Invitation & Create Account'
              )}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Button variant="link" className="p-0" onClick={() => navigate('/auth')}>
                Sign in here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteAcceptance;