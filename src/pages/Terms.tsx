import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2 } from 'lucide-react';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">ConexusPM</span>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-muted-foreground">Last updated: December 2024</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing and using ConexusPM, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2>Use License</h2>
            <p>
              Permission is granted to temporarily use ConexusPM for personal, non-commercial transitory viewing only. 
              This is the grant of a license, not a transfer of title.
            </p>

            <h2>User Accounts</h2>
            <p>
              You are responsible for safeguarding the password and for maintaining the confidentiality of your account. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>

            <h2>Prohibited Uses</h2>
            <p>
              You may not use our service for any illegal or unauthorized purpose nor may you, in the use of the service, 
              violate any laws in your jurisdiction.
            </p>

            <h2>Service Availability</h2>
            <p>
              We reserve the right to withdraw or amend our service, and any service or material we provide, in our sole 
              discretion without notice.
            </p>

            <h2>Intellectual Property</h2>
            <p>
              The service and its original content, features, and functionality are and will remain the exclusive property 
              of ConexusPM and its licensors.
            </p>

            <h2>Payment Terms</h2>
            <p>
              Subscription fees are billed in advance on a monthly basis and are non-refundable. We reserve the right to 
              change our subscription plans and pricing.
            </p>

            <h2>Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or 
              liability, for any reason whatsoever.
            </p>

            <h2>Disclaimer</h2>
            <p>
              The information on this service is provided on an "as is" basis. To the fullest extent permitted by law, 
              this company excludes all representations, warranties, and conditions.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              In no event shall ConexusPM, nor its directors, employees, partners, agents, suppliers, or affiliates, 
              be liable for any indirect, incidental, special, consequential, or punitive damages.
            </p>

            <h2>Governing Law</h2>
            <p>
              These terms shall be interpreted and governed by the laws of the jurisdiction in which our company is incorporated.
            </p>

            <h2>Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at legal@conexuspm.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;