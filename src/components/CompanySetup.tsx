import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2, LogOut } from 'lucide-react';

const CompanySetup = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !user) return;

    setLoading(true);
    try {
      // Create the company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName.trim(),
          owner_id: user.id
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Update user profile with company info and make them admin
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          company_id: company.id,
          company_role: 'company_admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Company Created!",
        description: `Welcome to ${companyName}! You are now the company administrator.`,
      });

      // Refresh the page to load the new company data
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create company. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-between items-start mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
            <Building2 className="h-12 w-12 text-primary" />
            <div className="w-20" /> {/* Spacer for balance */}
          </div>
          <CardTitle className="text-2xl">Set Up Your Company</CardTitle>
          <CardDescription>
            Welcome to ProjectPulse! Let's get started by creating your company profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Enter your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !companyName.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Company...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-4 w-4" />
                    Create Company
                  </>
                )}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                As the company administrator, you'll be able to invite team members 
                and manage projects.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySetup;