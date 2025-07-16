import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Search, 
  BookOpen, 
  Video, 
  MessageCircle, 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Help = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const quickHelp = [
    {
      icon: Users,
      title: "Getting Started",
      description: "Learn the basics of ConexusPM",
      articles: 12,
      popular: true
    },
    {
      icon: Building2,
      title: "Project Management", 
      description: "Set up and manage your projects",
      articles: 8,
      popular: true
    },
    {
      icon: FileText,
      title: "File Management",
      description: "Upload, organize, and share files",
      articles: 6,
      popular: false
    },
    {
      icon: Calendar,
      title: "Task & Scheduling",
      description: "Create tasks and manage timelines",
      articles: 10,
      popular: true
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      description: "Generate reports and track progress",
      articles: 5,
      popular: false
    },
    {
      icon: MessageCircle,
      title: "Team Collaboration",
      description: "Invite team members and collaborate",
      articles: 7,
      popular: false
    }
  ];

  const popularArticles = [
    {
      title: "How to create your first project",
      category: "Getting Started",
      readTime: "3 min read",
      views: "2.1k views"
    },
    {
      title: "Setting up team permissions and roles",
      category: "Team Management",
      readTime: "5 min read",
      views: "1.8k views"
    },
    {
      title: "Managing project files and documents",
      category: "File Management",
      readTime: "4 min read",
      views: "1.5k views"
    },
    {
      title: "Creating and assigning tasks",
      category: "Task Management",
      readTime: "6 min read",
      views: "1.3k views"
    },
    {
      title: "Understanding project analytics",
      category: "Reports",
      readTime: "7 min read",
      views: "1.1k views"
    }
  ];

  const resources = [
    {
      icon: BookOpen,
      title: "Documentation",
      description: "Comprehensive guides and API documentation",
      link: "#"
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Step-by-step video guides for all features",
      link: "#"
    },
    {
      icon: MessageCircle,
      title: "Community Forum",
      description: "Get help from other ConexusPM users",
      link: "#"
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
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
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
            Help <span className="text-primary">Center</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Find answers to your questions and learn how to get the most out of ConexusPM.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for help articles, tutorials, and guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg border-2 border-gray-200 focus:border-primary rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* Quick Help Categories */}
      <section className="py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Browse by Category</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find help articles organized by topic to quickly get the answers you need.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {quickHelp.map((category, index) => (
              <Card key={index} className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                      <category.icon className="h-8 w-8 text-primary" />
                    </div>
                    {category.popular && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-gray-600">
                    {category.description}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{category.articles} articles</span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors duration-300" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Popular Articles</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The most helpful articles based on user engagement and feedback.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-4">
            {popularArticles.map((article, index) => (
              <Card key={index} className="group cursor-pointer hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {article.category}
                        </Badge>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {article.readTime}
                        </span>
                        <span className="text-sm text-gray-500">{article.views}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors duration-300">
                        {article.title}
                      </h3>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors duration-300 ml-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Additional Resources</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore more ways to learn and get support for ConexusPM.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {resources.map((resource, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="mx-auto p-4 rounded-xl bg-primary/10 w-fit mb-4">
                    <resource.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-gray-600">
                    {resource.description}
                  </CardDescription>
                  <Button variant="outline" className="w-full">
                    Explore
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Still Need Help?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is ready to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/contact')}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold"
            >
              Contact Support
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/signup')}
              className="border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg font-semibold"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Help;