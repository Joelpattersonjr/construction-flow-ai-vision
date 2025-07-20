import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Building, User, Mail, Lock, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    jobTitle: ''
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'signup' | 'subscription'>('signup');
  
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Guard against context not being ready
  if (!authContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const { user } = authContext;

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: formData.fullName,
            job_title: formData.jobTitle,
            company_name: formData.companyName
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (authData.user && !authData.user.email_confirmed_at) {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link. Please check your email and click the link to complete registration.",
        });
        
        // Redirect to auth page with a message
        navigate('/auth?message=check-email');
        return;
      }

      // If email confirmation is disabled or user is confirmed, create company and profile
      if (authData.user) {
        // Get a fresh session for the API call
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session) {
          // Create company and user profile
          const { data: companyData, error: companyError } = await supabase.functions.invoke('create-company-user', {
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
            body: {
              companyName: formData.companyName,
              fullName: formData.fullName,
              jobTitle: formData.jobTitle
            }
          });

          if (companyError) {
            throw new Error(`Failed to create company: ${companyError.message}`);
          }

          console.log("Company and profile created", companyData);
          setStep('subscription');
        } else {
          throw new Error("No session available after signup");
        }
      }

    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionChoice = async (tier: 'free' | 'starter' | 'pro' | 'enterprise') => {
    if (tier === 'free') {
      // Redirect to main app for free tier
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully. You're on the Basic plan.",
      });
      navigate('/dashboard');
      return;
    }

    try {
      // Create checkout session for paid tiers
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to checkout",
          description: "Complete your payment in the new tab to activate your subscription.",
        });
        // Keep user on this page until they complete payment
      }
    } catch (error: any) {
      toast({
        title: 'Error creating checkout session',
        description: error.message || 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  if (step === 'subscription') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-4xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Choose Your Plan</CardTitle>
            <CardDescription>
              Select a subscription plan to get started with ConexusPM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Plan */}
              <Card className="relative border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">Starter</CardTitle>
                  <div className="text-2xl font-bold">$59.99<span className="text-sm font-normal">/month</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• File Management & Storage</li>
                    <li>• Version Control (5 versions per file)</li>
                    <li>• Team Collaboration (up to 5 collaborators)</li>
                    <li>• 90 days version history</li>
                    <li>• Basic File Sharing</li>
                    <li>• Standard Support</li>
                  </ul>
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => handleSubscriptionChoice('starter')}
                  >
                    Start Starter
                  </Button>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className="relative border-2 border-primary">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">Pro</CardTitle>
                  <div className="text-2xl font-bold">$99.99<span className="text-sm font-normal">/month</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Advanced version control</li>
                    <li>• Real-time collaboration</li>
                    <li>• Up to 50 versions per file</li>
                    <li>• 10 collaborators max</li>
                    <li>• 1 year version history</li>
                    <li>• Advanced analytics</li>
                    <li>• Priority support</li>
                  </ul>
                  <Button 
                    className="w-full mt-4"
                    onClick={() => handleSubscriptionChoice('pro')}
                  >
                    Start Pro
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className="relative border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">Enterprise</CardTitle>
                  <div className="text-2xl font-bold">$399.99<span className="text-sm font-normal">/month</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Unlimited version control</li>
                    <li>• Unlimited collaboration</li>
                    <li>• Unlimited versions per file</li>
                    <li>• Unlimited collaborators</li>
                    <li>• Unlimited version history</li>
                    <li>• Advanced time tracking & reporting</li>
                    <li>• Advanced analytics & reporting</li>
                    <li>• Custom integrations</li>
                    <li>• Dedicated support</li>
                  </ul>
                  <Button 
                    className="w-full mt-4"
                    onClick={() => handleSubscriptionChoice('enterprise')}
                  >
                    Start Enterprise
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6 text-center">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')}
                className="text-sm"
              >
                Already have an account? Sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <UserPlus className="mx-auto h-8 w-8 text-primary mb-4" />
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Sign up to create your ConexusPM company account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your email"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your company name"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="jobTitle">Job Title (Optional)</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    placeholder="Enter your job title"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Create a password"
                    minLength={6}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    placeholder="Confirm your password"
                    minLength={6}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="text-sm"
            >
              Already have an account? Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
