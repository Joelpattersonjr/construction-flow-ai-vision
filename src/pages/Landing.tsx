import React from 'react';
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
  Star
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Building2,
      title: "Project Management",
      description: "Comprehensive project tracking with timelines, milestones, and progress monitoring."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Real-time collaboration with team members, file sharing, and permission management."
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Version control, file storage, and collaborative editing for all project documents."
    },
    {
      icon: Clock,
      title: "Time Tracking",
      description: "Built-in time tracking with detailed reporting and analytics for better productivity."
    },
    {
      icon: Calendar,
      title: "Scheduling",
      description: "Integrated calendar with task scheduling, deadlines, and automated reminders."
    },
    {
      icon: BarChart3,
      title: "Analytics & Reporting",
      description: "Advanced analytics and customizable reports to track project performance."
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
      name: "Basic",
      price: "$69.99",
      period: "per month",
      description: "Perfect for small teams and growing businesses",
      features: [
        "File Management & Storage",
        "Version Control (5 versions per file)",
        "Team Collaboration (up to 5 collaborators)",
        "90 days version history",
        "Basic File Sharing",
        "Standard Support"
      ],
      popular: false,
      cta: "Start Basic Plan"
    },
    {
      name: "Premium",
      price: "$99.99", 
      period: "per month",
      description: "Advanced features for professional teams",
      features: [
        "Advanced version control",
        "Real-time collaboration",
        "Up to 50 versions per file",
        "10 collaborators max",
        "1 year version history",
        "Advanced analytics",
        "Priority support"
      ],
      popular: true,
      cta: "Start Premium Plan"
    },
    {
      name: "Enterprise",
      price: "$399.99",
      period: "per month", 
      description: "Complete solution for large organizations",
      features: [
        "Unlimited version control",
        "Unlimited collaboration",
        "Unlimited versions per file",
        "Unlimited collaborators",
        "Unlimited version history",
        "Advanced time tracking & reporting",
        "Advanced analytics & reporting",
        "Custom integrations",
        "Dedicated support"
      ],
      popular: false,
      cta: "Start Enterprise Plan"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">ConexusPM</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/signup')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-blue-300/20 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-purple-300/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-6 animate-fade-in bg-white/80 backdrop-blur-sm">
                🚀 Trusted by 1000+ Construction Teams
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
                Streamline Your
                <span className="text-primary block bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Construction Projects
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 animate-fade-in">
                ConexusPM is the all-in-one project management platform designed specifically for construction teams. 
                Manage projects, collaborate in real-time, and track progress like never before.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center animate-fade-in">
                <Button size="lg" onClick={() => navigate('/signup')} className="text-lg px-8 py-3 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="text-lg px-8 py-3 border-2 hover:bg-primary hover:text-white transition-all duration-300 transform hover:scale-105">
                  Watch Demo
                </Button>
              </div>
              
              <div className="mt-8 text-sm text-gray-500 animate-fade-in">
                No credit card required • 30-day free trial • Cancel anytime
              </div>
            </div>
            
            {/* Right side - Hero Image */}
            <div className="relative animate-fade-in">
              <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/30">
                <img 
                  src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80" 
                  alt="ConexusPM Dashboard Preview" 
                  className="w-full h-auto rounded-xl shadow-lg"
                />
                <div className="absolute -top-4 -right-4 bg-primary text-white p-3 rounded-full shadow-lg animate-bounce">
                  <Zap className="h-6 w-6" />
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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Construction Projects
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From project planning to completion, ConexusPM provides all the tools your construction team needs to succeed.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group relative border-0 bg-white/50 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 overflow-hidden">
                {/* Gradient overlay that appears on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardHeader className="relative z-10">
                  <div className="relative">
                    <feature.icon className="h-12 w-12 text-primary mb-4 transition-all duration-300 group-hover:scale-110 group-hover:text-blue-600" />
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-gray-600 text-base group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                
                {/* Animated border effect */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 rounded-lg transition-all duration-500"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Construction Teams Choose ConexusPM
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">Built for Construction</h3>
                    <p className="text-gray-600">Designed specifically for construction workflows, not generic project management.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">Real-Time Collaboration</h3>
                    <p className="text-gray-600">Keep your entire team in sync with live updates and instant notifications.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">Enterprise Security</h3>
                    <p className="text-gray-600">Bank-level security with role-based permissions and audit trails.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">Scalable Solution</h3>
                    <p className="text-gray-600">Grows with your business from small teams to enterprise organizations.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary/10 to-blue-100 p-8 rounded-lg">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-6">Join thousands of construction professionals who trust ConexusPM.</p>
                <Button size="lg" onClick={() => navigate('/signup')} className="w-full">
                  Start Your Free Trial
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Don't just take our word for it - hear from construction professionals who use ConexusPM daily.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                    <p className="text-sm text-gray-500">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your team size and project needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-xl scale-105' : 'border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-white">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => navigate('/signup')}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
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
              Contact Sales
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
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ConexusPM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;