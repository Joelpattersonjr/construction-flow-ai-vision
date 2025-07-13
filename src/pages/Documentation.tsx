import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Search, 
  BookOpen, 
  Code, 
  Terminal, 
  ArrowRight,
  FileText,
  Layers,
  Database,
  Shield,
  Zap,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Documentation = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    {
      icon: BookOpen,
      title: "Getting Started",
      description: "Quick start guides and basic concepts",
      items: [
        "Installation & Setup",
        "Your First Project", 
        "Basic Navigation",
        "User Roles & Permissions"
      ],
      color: "bg-blue-500"
    },
    {
      icon: Layers,
      title: "Core Features",
      description: "Deep dive into ConexusPM features",
      items: [
        "Project Management",
        "Task & Scheduling",
        "File Management",
        "Team Collaboration"
      ],
      color: "bg-green-500"
    },
    {
      icon: Settings,
      title: "Administration",
      description: "Admin settings and configuration",
      items: [
        "Company Settings",
        "User Management",
        "Custom Fields",
        "Permission Templates"
      ],
      color: "bg-purple-500"
    },
    {
      icon: Code,
      title: "API Reference",
      description: "REST API documentation",
      items: [
        "Authentication",
        "Projects API",
        "Tasks API",
        "Files API"
      ],
      color: "bg-orange-500"
    },
    {
      icon: Database,
      title: "Integrations",
      description: "Connect with external tools",
      items: [
        "Third-party Apps",
        "Webhooks",
        "Import/Export",
        "Custom Integrations"
      ],
      color: "bg-indigo-500"
    },
    {
      icon: Shield,
      title: "Security & Compliance",
      description: "Security features and best practices",
      items: [
        "Data Security",
        "Access Controls",
        "Audit Logs",
        "Compliance"
      ],
      color: "bg-red-500"
    }
  ];

  const quickLinks = [
    {
      title: "API Quick Start",
      description: "Get started with the ConexusPM API",
      badge: "Popular",
      badgeColor: "bg-green-100 text-green-800"
    },
    {
      title: "Project Setup Guide",
      description: "Step-by-step project configuration",
      badge: "Essential",
      badgeColor: "bg-blue-100 text-blue-800"
    },
    {
      title: "Team Collaboration Best Practices",
      description: "Optimize team workflows",
      badge: "Recommended",
      badgeColor: "bg-purple-100 text-purple-800"
    },
    {
      title: "File Management Overview",
      description: "Organize and share project files",
      badge: "New",
      badgeColor: "bg-orange-100 text-orange-800"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold tracking-tight">ConexusPM</span>
          </button>
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
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="text-primary">Documentation</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Comprehensive guides, API references, and tutorials to help you make the most of ConexusPM.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg border-2 border-gray-200 focus:border-primary rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => (
              <Card key={index} className="group cursor-pointer border-0 shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={link.badgeColor}>
                      {link.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
                    {link.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{link.description}</p>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors duration-300" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Documentation Sections</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our comprehensive documentation organized by topic and functionality.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.map((section, index) => (
              <Card key={index} className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardHeader className="pb-4">
                  <div className={`p-3 rounded-xl ${section.color}/10 w-fit mb-4`}>
                    <section.icon className={`h-8 w-8 ${section.color.replace('bg-', 'text-')}`} />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 mb-4">{section.description}</p>
                  <ul className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center text-sm text-gray-600 hover:text-primary transition-colors cursor-pointer">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-sm text-gray-500">{section.items.length} topics</span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors duration-300" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900">API Reference</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Build powerful integrations with the ConexusPM REST API. 
                Access all platform features programmatically with comprehensive 
                documentation and code examples.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Terminal className="h-5 w-5 text-primary" />
                  <span className="text-gray-700">RESTful API with JSON responses</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-gray-700">OAuth 2.0 authentication</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="text-gray-700">Real-time webhooks support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Code className="h-5 w-5 text-primary" />
                  <span className="text-gray-700">SDKs for popular languages</span>
                </div>
              </div>
              <Button size="lg" className="mt-6">
                Explore API Docs
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            <div className="relative">
              <div className="bg-gray-900 rounded-xl p-6 text-green-400 font-mono text-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-500 ml-2">API Example</span>
                </div>
                <pre className="whitespace-pre-wrap">
{`curl -X GET \\
  https://api.conexuspm.com/v1/projects \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"

{
  "projects": [
    {
      "id": "proj_123",
      "name": "Office Building A",
      "status": "active",
      "created_at": "2024-01-15T09:00:00Z"
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Start building with ConexusPM today. Sign up for your free account and explore all features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/signup')}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/contact')}
              className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg font-semibold"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Documentation;