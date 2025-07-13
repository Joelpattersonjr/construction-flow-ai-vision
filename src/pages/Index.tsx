
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppHeader from '@/components/navigation/AppHeader';
import { TrialBanner } from '@/components/subscription/TrialBanner';
import { SubscriptionService, SubscriptionInfo } from '@/services/subscriptionService';
import { useAuthState } from '@/hooks/useAuthState';
import { Star, Zap } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (user) {
        const info = await SubscriptionService.getCurrentSubscription();
        setSubscriptionInfo(info);
      }
    };

    fetchSubscription();
  }, [user]);

  const getSubscriptionBadge = () => {
    if (!subscriptionInfo) return null;
    
    const tier = subscriptionInfo.subscription_tier;
    const isTrialActive = subscriptionInfo.trial_info?.is_trial_active;
    
    if (isTrialActive) {
      return <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3" />Trial</Badge>;
    }
    
    switch (tier) {
      case 'pro':
        return <Badge variant="default" className="gap-1"><Zap className="h-3 w-3" />Premium</Badge>;
      case 'enterprise':
        return <Badge variant="destructive" className="gap-1"><Star className="h-3 w-3" />Enterprise</Badge>;
      default:
        return <Badge variant="outline">Basic</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <AppHeader />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Trial Banner */}
        {subscriptionInfo && (
          <TrialBanner 
            subscriptionInfo={subscriptionInfo}
            onUpgrade={() => window.location.href = '/#pricing'}
          />
        )}

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-foreground">
              Welcome to ConexusPM{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!
            </h2>
            {getSubscriptionBadge()}
          </div>
          <p className="text-muted-foreground">
            Manage your construction projects with AI-powered insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Manage your construction projects</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and track your construction projects with timeline management.
              </p>
              <Button 
                className="mt-4 w-full group relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold" 
                onClick={() => navigate('/projects')}
              >
                <span className="relative z-10">View Projects</span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Track project tasks and dependencies</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage tasks across all your projects with Kanban board visualization.
              </p>
              <Button 
                className="mt-4 w-full group relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold" 
                onClick={() => navigate('/tasks')}
              >
                <span className="relative z-10">View Tasks</span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Timeline view of task deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View tasks by due dates with drag-and-drop calendar interface.
              </p>
              <Button 
                className="mt-4 w-full group relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold" 
                onClick={() => navigate('/calendar')}
              >
                <span className="relative z-10">View Calendar</span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>AI-powered document analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload and analyze construction documents with AI insights.
              </p>
              <Button 
                className="mt-4 w-full group relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold" 
                onClick={() => navigate('/files')}
              >
                <span className="relative z-10">Manage Files</span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
