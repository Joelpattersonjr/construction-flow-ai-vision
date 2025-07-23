import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { TrialBanner } from '@/components/subscription/TrialBanner';
import { SubscriptionService, SubscriptionInfo } from '@/services/subscriptionService';
import { useAuthState } from '@/hooks/useAuthState';
import { Star, Sparkles, Building2, Calendar, FileText, CheckCircle2, ArrowRight, BarChart3, Users, Clock } from 'lucide-react';
const Index = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuthState();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  useEffect(() => {
    const fetchSubscription = async () => {
      if (user) {
        const info = await SubscriptionService.getCurrentSubscription();
        setSubscriptionInfo(info);
      }
    };
    fetchSubscription();

    // Add smooth scrolling and animations
    document.documentElement.style.scrollBehavior = 'smooth';

    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');

          // Add staggered animations for child elements
          const children = entry.target.querySelectorAll('[data-stagger]');
          children.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add('animate-fade-in');
            }, index * 150);
          });
        }
      });
    }, observerOptions);

    // Observe all cards
    const cards = document.querySelectorAll('[data-animate]');
    cards.forEach(card => observer.observe(card));
    return () => {
      observer.disconnect();
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, [user]);
  const getSubscriptionBadge = () => {
    if (!subscriptionInfo) return null;
    const tier = subscriptionInfo.subscription_tier;
    const isTrialActive = subscriptionInfo.trial_info?.is_trial_active;
    if (isTrialActive) {
      return <Badge variant="secondary" className="gap-1 bg-gradient-to-r from-primary/10 to-blue-600/10 text-primary border-primary/20 animate-pulse">
          <Star className="h-3 w-3" />Trial
        </Badge>;
    }
    switch (tier) {
      case 'pro':
        return <Badge variant="default" className="gap-1 bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg">
            <Sparkles className="h-3 w-3" />Pro
          </Badge>;
      case 'enterprise':
        return <Badge variant="destructive" className="gap-1 bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg">
            <Star className="h-3 w-3" />Enterprise
          </Badge>;
      default:
        return <Badge variant="outline" className="border-primary/20 text-primary">Free</Badge>;
    }
  };
  const dashboardCards = [{
    icon: Building2,
    title: "Projects",
    description: "Manage your construction projects",
    details: "Create and track your construction projects with timeline management.",
    path: "/projects",
    cta: "View Projects",
    gradient: "from-blue-500 to-cyan-500"
  }, {
    icon: CheckCircle2,
    title: "Tasks",
    description: "Track project tasks and dependencies",
    details: "Manage tasks across all your projects with Kanban board visualization.",
    path: "/tasks",
    cta: "View Tasks",
    gradient: "from-green-500 to-emerald-500"
  }, {
    icon: Calendar,
    title: "Calendar",
    description: "Timeline view of task deadlines",
    details: "View tasks by due dates with drag-and-drop calendar interface.",
    path: "/calendar",
    cta: "View Calendar",
    gradient: "from-purple-500 to-violet-500"
  }, {
    icon: FileText,
    title: "Documents",
    description: "AI-powered document analysis",
    details: "Upload and analyze construction documents with AI insights.",
    path: "/files",
    cta: "Manage Files",
    gradient: "from-orange-500 to-red-500"
  }];
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-blue-300/20 rounded-full animate-bounce" style={{
        animationDelay: '0.5s'
      }}></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-purple-300/20 rounded-full animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-cyan-300/20 rounded-full animate-bounce" style={{
        animationDelay: '1.5s'
      }}></div>
      </div>
      
      

      <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Trial Banner */}
        {subscriptionInfo && <div className="mb-8" data-animate>
            <TrialBanner subscriptionInfo={subscriptionInfo} onUpgrade={() => window.location.href = '/#pricing'} />
          </div>}

        {/* Hero-style Welcome Section */}
        <div className="mb-12 text-center lg:text-left" data-animate>
          <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/30">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 justify-center lg:justify-start flex-wrap">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                    Welcome to{' '}
                    <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      ConexusPM
                    </span>
                    {user?.user_metadata?.full_name && <span className="block text-2xl md:text-3xl lg:text-4xl mt-2 text-gray-700">
                        {user.user_metadata.full_name}!
                      </span>}
                  </h1>
                  {getSubscriptionBadge()}
                </div>
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Manage your construction projects with AI-powered insights and streamlined workflows
                </p>
              </div>
              
              {/* Quick Stats or Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="text-center p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="text-2xl font-bold text-primary">4</div>
                  <div className="text-sm text-gray-600">Active Tools</div>
                </div>
                <div className="text-center p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="text-2xl font-bold text-green-600">Ready</div>
                  <div className="text-sm text-gray-600">System Status</div>
                </div>
              </div>
            </div>
            
            {/* Floating action icons */}
            
            
          </div>
        </div>

        {/* Enhanced Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8" data-animate>
          {dashboardCards.map((card, index) => {
          const IconComponent = card.icon;
          return <Card key={index} className="group relative border-0 bg-white/50 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:scale-105 overflow-hidden cursor-pointer" data-stagger onClick={() => navigate(card.path)}>
                {/* Gradient overlay that appears on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Glow effect */}
                <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-all duration-500 -z-10`}></div>
                
                <CardHeader className="relative z-10 pb-4 space-y-6">
                  <div className="relative">
                    <div className={`relative p-3 rounded-xl bg-gradient-to-br ${card.gradient} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300 w-fit`}>
                      <IconComponent className={`h-14 w-14 text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`} style={{
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
                  }} />
                    </div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`}></div>
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-semibold group-hover:text-primary transition-colors duration-300 leading-tight">
                      {card.title}
                    </CardTitle>
                    <CardDescription className="text-gray-500 font-medium">
                      {card.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="relative z-10 pt-0 space-y-6">
                  <p className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                    {card.details}
                  </p>
                  
                  <Button className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold">
                    <span className="relative z-10 flex items-center justify-center">
                      {card.cta}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
                  </Button>
                </CardContent>
                
                {/* Animated border effect */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/30 rounded-lg transition-all duration-500"></div>
                
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </Card>;
        })}
        </div>


        {/* Additional CTA Section */}
        <div className="mt-16 text-center" data-animate>
          <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/30">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Need Help Getting Started?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Explore our comprehensive documentation or get in touch with our support team for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="group text-lg px-8 py-3 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold relative overflow-hidden" onClick={() => navigate('/help')}>
                <span className="relative z-10 flex items-center">
                  View Documentation
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
              </Button>
              <Button size="lg" variant="outline" className="group text-lg px-8 py-3 border-2 border-primary/20 hover:bg-primary hover:text-white transition-all duration-300 transform hover:scale-105 font-semibold relative overflow-hidden" onClick={() => navigate('/contact')}>
                <span className="relative z-10">Contact Support</span>
                <div className="absolute inset-0 bg-primary translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>;
};
export default Index;