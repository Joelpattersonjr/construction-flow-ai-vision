import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  ArrowRight, 
  Building2, 
  Users, 
  Clock, 
  FileText, 
  Calendar, 
  BarChart3,
  Shield,
  Zap,
  Globe,
  Star,
  Rocket
} from 'lucide-react';
import { TourTrigger } from '@/components/ProductTour';
import { LiveChatWidget } from '@/components/LiveChatWidget';
import { 
  TaskManagementTooltip, 
  CollaborationTooltip, 
  AnalyticsTooltip,
  SecurityTooltip,
  IntegrationsTooltip,
  MobileTooltip 
} from '@/components/FeatureTooltips';
import constructionHero from '@/assets/construction-hero.jpg';

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Add smooth scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          
          // Add staggered animations for child elements
          const children = entry.target.querySelectorAll('[data-stagger]');
          children.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add('animate-fade-in-up');
            }, index * 150);
          });
        }
      });
    }, observerOptions);

    // Observe all sections and elements
    const sections = document.querySelectorAll('section[data-animate]');
    const staggerElements = document.querySelectorAll('[data-stagger-parent]');
    
    sections.forEach(section => observer.observe(section));
    staggerElements.forEach(element => observer.observe(element));

    return () => {
      observer.disconnect();
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const features = [
    {
      icon: Building2,
      title: "Project Management",
      description: "Comprehensive project tracking with timelines, milestones, and progress monitoring.",
      tooltip: TaskManagementTooltip
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Real-time collaboration with team members, file sharing, and permission management.",
      tooltip: CollaborationTooltip
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Version control, file storage, and collaborative editing for all project documents.",
      tooltip: SecurityTooltip
    },
    {
      icon: Clock,
      title: "Time Tracking",
      description: "Built-in time tracking with detailed reporting and analytics for better productivity.",
      tooltip: AnalyticsTooltip
    },
    {
      icon: Calendar,
      title: "Scheduling",
      description: "Integrated calendar with task scheduling, deadlines, and automated reminders.",
      tooltip: IntegrationsTooltip
    },
    {
      icon: BarChart3,
      title: "Analytics & Reporting",
      description: "Advanced analytics and customizable reports to track project performance.",
      tooltip: MobileTooltip
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Project Manager",
      company: "BuildCorp Construction",
      content: "ConexusPM has transformed how we manage our construction projects. The real-time collaboration features are game-changing.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Operations Director",
      company: "Metro Engineering",
      content: "Finally, a project management tool that understands construction. The time tracking and document management are excellent.",
      rating: 5
    },
    {
      name: "Jennifer Rodriguez",
      role: "Site Supervisor", 
      company: "Apex Builders",
      content: "Easy to use, powerful features, and great customer support. Our team productivity has increased by 30%.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "Free",
      period: "forever",
      description: "Perfect for individuals and small teams",
      features: [
        "3 Projects",
        "5 Team Members",
        "1 GB Storage",
        "100 Files per Project",
        "50 Tasks per Project",
        "5 File Versions",
        "Basic Support"
      ],
      popular: false,
      cta: "Start Free"
    },
    {
      name: "Starter",
      price: "$59.99",
      period: "per month",
      description: "Great for small growing teams",
      features: [
        "10 Projects",
        "15 Team Members",
        "5 GB Storage",
        "500 Files per Project",
        "200 Tasks per Project",
        "20 File Versions",
        "Real-time Collaboration",
        "Basic Analytics",
        "Email Support"
      ],
      popular: false,
      cta: "Start Starter Plan"
    },
    {
      name: "Pro",
      price: "$99.99",
      period: "per month",
      description: "Enhanced features for growing teams",
      features: [
        "50 Projects",
        "50 Team Members", 
        "25 GB Storage",
        "2,000 Files per Project",
        "1,000 Tasks per Project",
        "50 File Versions",
        "Advanced Collaboration",
        "Full Analytics Suite",
        "Priority Support",
        "Time Tracking"
      ],
      popular: true,
      cta: "Start Pro Plan"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "Complete solution for large organizations",
      features: [
        "Unlimited Projects",
        "Unlimited Team Members",
        "Unlimited Storage",
        "Unlimited Files & Tasks",
        "Unlimited File Versions",
        "Advanced Security",
        "Custom Integrations",
        "Dedicated Support",
        "SLA Guarantee",
        "Custom Features"
      ],
      popular: false,
      cta: "Contact Sales"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold tracking-tight">ConexusPM</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/auth')} className="font-medium">
              Sign In
            </Button>
            <Button onClick={() => navigate('/signup')} className="font-medium">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden" data-animate data-tour="hero">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-blue-300/20 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-purple-300/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left side - Content */}
            <div className="text-center lg:text-left space-y-8">
              <Badge variant="secondary" className="animate-fade-in bg-white/80 backdrop-blur-sm font-medium">
                🚀 Trusted by 1000+ Construction Teams
              </Badge>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight animate-fade-in">
                Streamline Your
                <span className="block bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mt-2">
                  Construction Projects
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-fade-in">
                ConexusPM is the all-in-one project management platform designed specifically for construction teams. 
                Manage projects, collaborate in real-time, and track progress like never before.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start items-center animate-fade-in">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/signup')} 
                  className="group text-lg px-10 py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} 
                  className="group text-lg px-10 py-4 border-2 hover:bg-primary hover:text-white transition-all duration-300 transform hover:scale-105 font-semibold relative overflow-hidden"
                >
                  <span className="relative z-10">See Features</span>
                  <div className="absolute inset-0 bg-primary translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div>
                </Button>
              </div>
              
              <div className="text-sm text-gray-500 animate-fade-in space-x-4 font-medium">
                <span>No credit card required</span>
                <span>•</span>
                <span>30-day free trial</span>
                <span>•</span>
                <span>Cancel anytime</span>
              </div>
            </div>
            
            {/* Right side - Hero Image */}
            <div className="relative animate-fade-in">
              <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/30">
                <img 
                  src={constructionHero} 
                  alt="ConexusPM Construction Management Dashboard" 
                  className="w-full h-auto rounded-xl shadow-lg"
                />
                <div className="absolute -top-4 -right-4 bg-primary text-white p-3 rounded-full shadow-lg animate-bounce">
                  <Rocket className="h-6 w-6" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-green-500 text-white p-3 rounded-full shadow-lg animate-pulse">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32 bg-white" data-animate data-tour="features">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-20 lg:mb-24 space-y-6">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Everything You Need to Manage
              <span className="block text-primary">Construction Projects</span>
            </h2>
            <p className="text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              From project planning to completion, ConexusPM provides all the tools your construction team needs to succeed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10" data-stagger-parent>
            {features.map((feature, index) => {
              const TooltipComponent = feature.tooltip;
              return (
                <TooltipComponent key={index}>
                  <Card className="group relative border-0 bg-white/50 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:scale-105 overflow-hidden cursor-pointer" data-stagger>
                    {/* Gradient overlay that appears on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/10 to-blue-600/10 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 -z-10"></div>
                    
                    <CardHeader className="relative z-10 pb-4 space-y-6">
                      <div className="relative">
                        <div className="relative p-3 rounded-xl bg-gradient-to-br from-primary/10 to-blue-600/10 group-hover:from-primary/20 group-hover:to-blue-600/20 transition-all duration-300 w-fit">
                          <feature.icon className="h-14 w-14 text-primary transition-all duration-300 group-hover:scale-110 group-hover:text-blue-600 group-hover:rotate-6" />
                        </div>
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                      </div>
                      <CardTitle className="text-2xl font-semibold group-hover:text-primary transition-colors duration-300 leading-tight">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-0">
                      <CardDescription className="text-gray-600 text-lg group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                    
                    {/* Animated border effect */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/30 rounded-lg transition-all duration-500"></div>
                    
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </Card>
                </TooltipComponent>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 lg:py-32 bg-gray-50" data-animate>
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Why Construction Teams Choose ConexusPM
              </h2>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-6">
                  <CheckCircle className="h-7 w-7 text-green-500 mt-1 flex-shrink-0" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-xl">Built for Construction</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">Designed specifically for construction workflows, not generic project management.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-6">
                  <CheckCircle className="h-7 w-7 text-green-500 mt-1 flex-shrink-0" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-xl">Real-Time Collaboration</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">Keep your entire team in sync with live updates and instant notifications.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-6">
                  <CheckCircle className="h-7 w-7 text-green-500 mt-1 flex-shrink-0" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-xl">Enterprise Security</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">Bank-level security with role-based permissions and audit trails.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-6">
                  <CheckCircle className="h-7 w-7 text-green-500 mt-1 flex-shrink-0" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-xl">Scalable Solution</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">Grows with your business from small teams to enterprise organizations.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary/10 to-blue-100 p-10 lg:p-12 rounded-2xl">
              <div className="text-center space-y-6">
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">Ready to Get Started?</h3>
                <p className="text-gray-600 text-lg lg:text-xl leading-relaxed">Join thousands of construction professionals who trust ConexusPM.</p>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/signup')} 
                  className="group w-full text-lg py-4 font-semibold relative overflow-hidden"
                >
                  <span className="relative z-10">Start Your Free Trial</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 lg:py-32 bg-white" data-animate data-tour="testimonials">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-20 lg:mb-24 space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              What Our Customers Say
            </h2>
            <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed">
              Don't just take our word for it - hear from construction professionals who use ConexusPM daily.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="group border-0 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="pt-8 space-y-6 relative z-10">
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 text-yellow-400 fill-current transition-transform duration-300 group-hover:scale-110" style={{transitionDelay: `${i * 100}ms`}} />
                    ))}
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed italic group-hover:text-gray-700 transition-colors duration-300">"{testimonial.content}"</p>
                  <div className="space-y-1">
                    <p className="font-semibold text-lg text-gray-900 group-hover:text-primary transition-colors duration-300">{testimonial.name}</p>
                    <p className="text-gray-500 font-medium">{testimonial.role}</p>
                    <p className="text-gray-500">{testimonial.company}</p>
                  </div>
                </CardContent>
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 rounded-lg transition-all duration-500"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 lg:py-32 bg-gray-50" data-animate data-tour="pricing">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-20 lg:mb-24 space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed">
              Choose the plan that fits your team size and project needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto pt-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`group relative transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 cursor-pointer overflow-visible ${plan.popular ? 'border-primary shadow-lg' : 'border-gray-200 hover:shadow-xl'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge className="bg-primary text-white px-4 py-1.5 text-xs font-semibold shadow-lg">Most Popular</Badge>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardHeader className="text-center pb-8 relative z-10">
                  <CardTitle className="text-2xl group-hover:text-primary transition-colors duration-300">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold group-hover:scale-110 transition-transform duration-300 inline-block">{plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3 group-hover:translate-x-1 transition-transform duration-300" style={{transitionDelay: `${featureIndex * 50}ms`}}>
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full group relative overflow-hidden bg-black text-white border-black hover:bg-black hover:text-white" 
                    onClick={() => navigate('/signup')}
                  >
                    <span className="relative z-10">{plan.cta}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                  </Button>
                </CardContent>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 rounded-lg transition-all duration-500"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 bg-primary text-white" data-animate>
        <div className="container mx-auto px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Ready to Transform Your Construction Projects?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of construction professionals who have streamlined their workflows with ConexusPM.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate('/signup')} className="text-lg px-8 py-3">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="text-lg px-8 py-3 border-white text-white bg-transparent hover:bg-white hover:text-primary">
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">ConexusPM</span>
              </div>
              <p className="text-gray-400">
                The leading project management platform for construction teams worldwide.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-white">Testimonials</a></li>
                <li><button onClick={() => navigate('/signup')} className="hover:text-white text-left">Start Free Trial</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate('/about')} className="hover:text-white text-left">About Us</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-white text-left">Contact</button></li>
                <li><button onClick={() => navigate('/auth')} className="hover:text-white text-left">Sign In</button></li>
                <li><button onClick={() => navigate('/signup')} className="hover:text-white text-left">Sign Up</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate('/help')} className="hover:text-white text-left">Help Center</button></li>
                <li><button onClick={() => navigate('/documentation')} className="hover:text-white text-left">Documentation</button></li>
                <li><button onClick={() => navigate('/privacy')} className="hover:text-white text-left">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/terms')} className="hover:text-white text-left">Terms of Service</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ConexusPM. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Interactive Demo Components */}
      <TourTrigger />
      <LiveChatWidget />
    </div>
  );
};

export default Landing;