import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Eye,
  Building2,
  Users,
  FileText,
  Calendar,
  Settings,
  MessageCircle,
  BarChart3,
  Shield,
  Plus,
  Upload,
  UserPlus,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GettingStarted = () => {
  const navigate = useNavigate();
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);

  const articles = [
    {
      id: 1,
      title: "Welcome to ConexusPM",
      category: "Introduction",
      readTime: "2 min read",
      views: "3.2k views",
      icon: Building2,
      content: `
        <h2>Welcome to ConexusPM - Your Complete Project Management Solution</h2>
        
        <p>ConexusPM is designed to streamline your project management workflow, bringing together teams, tasks, files, and communications in one powerful platform.</p>
        
        <h3>What You Can Do with ConexusPM:</h3>
        <ul>
          <li><strong>Manage Projects:</strong> Create, organize, and track projects from start to finish</li>
          <li><strong>Collaborate with Teams:</strong> Invite team members and work together in real-time</li>
          <li><strong>Track Tasks:</strong> Create tasks, set deadlines, and monitor progress</li>
          <li><strong>Share Files:</strong> Upload, organize, and share project documents securely</li>
          <li><strong>Monitor Progress:</strong> Get insights with analytics and reporting tools</li>
        </ul>
        
        <h3>Getting Started Checklist:</h3>
        <ol>
          <li>Complete your profile setup</li>
          <li>Create your first project</li>
          <li>Invite team members</li>
          <li>Upload project files</li>
          <li>Create your first tasks</li>
        </ol>
        
        <p>Ready to begin? Start with creating your first project!</p>
      `
    },
    {
      id: 2,
      title: "Creating Your First Project",
      category: "Project Setup",
      readTime: "4 min read",
      views: "2.8k views",
      icon: Plus,
      content: `
        <h2>Creating Your First Project</h2>
        
        <p>Projects are the foundation of ConexusPM. Each project serves as a workspace where you can manage tasks, files, team members, and track progress.</p>
        
        <h3>Step 1: Navigate to Projects</h3>
        <p>From your dashboard, click on "Projects" in the main navigation or use the "Create Project" button on the homepage.</p>
        
        <h3>Step 2: Fill in Project Details</h3>
        <ul>
          <li><strong>Project Name:</strong> Choose a clear, descriptive name</li>
          <li><strong>Description:</strong> Provide a brief overview of the project goals</li>
          <li><strong>Start Date:</strong> When the project begins</li>
          <li><strong>End Date:</strong> Target completion date</li>
          <li><strong>Project Number:</strong> Optional unique identifier</li>
          <li><strong>Owner Information:</strong> Client or stakeholder details</li>
        </ul>
        
        <h3>Step 3: Set Project Status</h3>
        <p>Choose from available statuses like "Planning", "In Progress", "On Hold", or "Completed".</p>
        
        <h3>Step 4: Save and Start Working</h3>
        <p>Once created, you'll be taken to your project dashboard where you can begin adding tasks, uploading files, and inviting team members.</p>
        
        <h3>Best Practices:</h3>
        <ul>
          <li>Use consistent naming conventions for your projects</li>
          <li>Include relevant keywords in the description for easier searching</li>
          <li>Set realistic deadlines to ensure project success</li>
        </ul>
      `
    },
    {
      id: 3,
      title: "Setting Up Your Team",
      category: "Team Management",
      readTime: "5 min read",
      views: "2.1k views",
      icon: UserPlus,
      content: `
        <h2>Setting Up Your Team</h2>
        
        <p>ConexusPM makes it easy to invite team members and manage their access to projects and files.</p>
        
        <h3>Inviting Team Members</h3>
        <ol>
          <li>Go to your project's "Team" section</li>
          <li>Click "Invite Members"</li>
          <li>Enter email addresses (one per line or comma-separated)</li>
          <li>Assign roles and permissions</li>
          <li>Send invitations</li>
        </ol>
        
        <h3>Team Roles and Permissions</h3>
        <ul>
          <li><strong>Owner:</strong> Full access to all project features and settings</li>
          <li><strong>Admin:</strong> Can manage team members, tasks, and files</li>
          <li><strong>Member:</strong> Can view and edit assigned tasks and files</li>
          <li><strong>Viewer:</strong> Read-only access to project content</li>
        </ul>
        
        <h3>Managing Team Permissions</h3>
        <p>You can customize permissions for each team member:</p>
        <ul>
          <li>Task creation and editing</li>
          <li>File upload and management</li>
          <li>Project settings access</li>
          <li>Team member invitation</li>
        </ul>
        
        <h3>Best Practices:</h3>
        <ul>
          <li>Assign roles based on responsibility levels</li>
          <li>Regularly review team access and permissions</li>
          <li>Use custom roles for specific project needs</li>
          <li>Ensure all team members understand their roles</li>
        </ul>
      `
    },
    {
      id: 4,
      title: "Managing Tasks and Deadlines",
      category: "Task Management",
      readTime: "6 min read",
      views: "1.9k views",
      icon: Target,
      content: `
        <h2>Managing Tasks and Deadlines</h2>
        
        <p>Tasks are the building blocks of project execution. ConexusPM provides powerful tools to create, assign, and track tasks efficiently.</p>
        
        <h3>Creating Tasks</h3>
        <ol>
          <li>Navigate to the Tasks section in your project</li>
          <li>Click "Create Task" or use the "+" button</li>
          <li>Fill in task details:
            <ul>
              <li>Task title and description</li>
              <li>Assignee (team member responsible)</li>
              <li>Priority level (Low, Medium, High, Critical)</li>
              <li>Start and due dates</li>
              <li>Status (To Do, In Progress, Review, Done)</li>
            </ul>
          </li>
          <li>Save the task</li>
        </ol>
        
        <h3>Task Organization</h3>
        <ul>
          <li><strong>Labels:</strong> Use color-coded labels to categorize tasks</li>
          <li><strong>Dependencies:</strong> Link tasks that depend on each other</li>
          <li><strong>Subtasks:</strong> Break down complex tasks into smaller steps</li>
          <li><strong>Templates:</strong> Save time by creating reusable task templates</li>
        </ul>
        
        <h3>Tracking Progress</h3>
        <ul>
          <li>Use the Kanban board view for visual task management</li>
          <li>Monitor task completion rates and deadlines</li>
          <li>Set up automated reminders for due dates</li>
          <li>Track time spent on tasks</li>
        </ul>
        
        <h3>Calendar Integration</h3>
        <p>View all your tasks and deadlines in the integrated calendar view to better manage your time and resources.</p>
      `
    },
    {
      id: 5,
      title: "File Management and Sharing",
      category: "File Management",
      readTime: "4 min read",
      views: "1.7k views",
      icon: Upload,
      content: `
        <h2>File Management and Sharing</h2>
        
        <p>Keep all your project files organized and accessible to your team with ConexusPM's file management system.</p>
        
        <h3>Uploading Files</h3>
        <ol>
          <li>Go to the Files section in your project</li>
          <li>Click "Upload Files" or drag and drop files</li>
          <li>Select files from your computer</li>
          <li>Add descriptions and tags</li>
          <li>Set file permissions</li>
        </ol>
        
        <h3>Organizing Files</h3>
        <ul>
          <li><strong>Folders:</strong> Create folders to organize files by type or phase</li>
          <li><strong>Tags:</strong> Add searchable tags for easy discovery</li>
          <li><strong>Categories:</strong> Group files by purpose (documents, images, blueprints)</li>
          <li><strong>Version Control:</strong> Track file versions and changes</li>
        </ul>
        
        <h3>File Permissions</h3>
        <ul>
          <li><strong>Public:</strong> Accessible to all team members</li>
          <li><strong>Restricted:</strong> Limited to specific team members</li>
          <li><strong>Private:</strong> Only accessible to the owner</li>
        </ul>
        
        <h3>Collaboration Features</h3>
        <ul>
          <li>Real-time collaborative editing for supported file types</li>
          <li>Comment and annotation tools</li>
          <li>File sharing via secure links</li>
          <li>Activity tracking and notifications</li>
        </ul>
        
        <h3>Storage and Limits</h3>
        <p>Different subscription plans offer various storage limits. Monitor your usage in the Storage Analytics section.</p>
      `
    },
    {
      id: 6,
      title: "Understanding the Dashboard",
      category: "Navigation",
      readTime: "3 min read",
      views: "1.5k views",
      icon: BarChart3,
      content: `
        <h2>Understanding the Dashboard</h2>
        
        <p>Your dashboard is the central hub where you can quickly access projects, tasks, and important updates.</p>
        
        <h3>Dashboard Overview</h3>
        <ul>
          <li><strong>Project Summary:</strong> Quick view of active projects and their status</li>
          <li><strong>Recent Activity:</strong> Latest updates and changes across your projects</li>
          <li><strong>Task Overview:</strong> Your assigned tasks and upcoming deadlines</li>
          <li><strong>Quick Actions:</strong> Fast access to common actions like creating projects or tasks</li>
        </ul>
        
        <h3>Navigation Menu</h3>
        <ul>
          <li><strong>Dashboard:</strong> Your main overview page</li>
          <li><strong>Projects:</strong> Browse and manage all your projects</li>
          <li><strong>Tasks:</strong> View and manage tasks across all projects</li>
          <li><strong>Files:</strong> Access file management features</li>
          <li><strong>Calendar:</strong> View scheduled tasks and deadlines</li>
          <li><strong>Reports:</strong> Generate analytics and progress reports</li>
        </ul>
        
        <h3>Customizing Your View</h3>
        <ul>
          <li>Rearrange dashboard widgets</li>
          <li>Set default views for different sections</li>
          <li>Configure notification preferences</li>
          <li>Choose between light and dark themes</li>
        </ul>
        
        <h3>Quick Tips</h3>
        <ul>
          <li>Use the search bar to quickly find projects, tasks, or files</li>
          <li>Pin frequently accessed projects to the top</li>
          <li>Check the notification center for important updates</li>
        </ul>
      `
    }
  ];

  const quickActions = [
    {
      icon: Plus,
      title: "Create Project",
      description: "Start a new project",
      action: () => navigate('/projects')
    },
    {
      icon: UserPlus,
      title: "Invite Team",
      description: "Add team members",
      action: () => navigate('/projects')
    },
    {
      icon: Upload,
      title: "Upload Files",
      description: "Add project documents",
      action: () => navigate('/files')
    },
    {
      icon: Target,
      title: "Create Task",
      description: "Add a new task",
      action: () => navigate('/tasks')
    }
  ];

  const ArticleView = ({ article }: { article: typeof articles[0] }) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setSelectedArticle(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Articles
        </Button>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <Badge variant="outline">{article.category}</Badge>
          <span className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {article.readTime}
          </span>
          <span className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            {article.views}
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <article.icon className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">{article.title}</h1>
      </div>

      <Card>
        <CardContent className="p-8">
          <div 
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(article.content, {
                ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br'],
                ALLOWED_ATTR: []
              })
            }}
          />
        </CardContent>
      </Card>
    </div>
  );

  if (selectedArticle !== null) {
    const article = articles.find(a => a.id === selectedArticle);
    if (article) {
      return (
        <div className="min-h-screen bg-background">
          <div className="container max-w-4xl mx-auto py-8 px-4">
            <ArticleView article={article} />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={() => navigate('/help')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Getting Started</h1>
            <p className="text-muted-foreground">Learn the basics of ConexusPM and set up your first project</p>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Get started quickly with these common actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex-col items-start space-y-2"
                  onClick={action.action}
                >
                  <action.icon className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Articles List */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Getting Started Articles</h2>
            <p className="text-muted-foreground">
              Follow these guides to get up and running with ConexusPM
            </p>
          </div>

          <div className="space-y-4">
            {articles.map((article) => (
              <Card key={article.id} className="group cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6" onClick={() => setSelectedArticle(article.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <article.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {article.category}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {article.readTime}
                          </span>
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {article.views}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Need More Help */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Need More Help?</CardTitle>
            <CardDescription>
              Can't find what you're looking for? We're here to help!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={() => navigate('/help')} className="flex-1">
                <MessageCircle className="w-4 h-4 mr-2" />
                Browse All Help Articles
              </Button>
              <Button variant="outline" onClick={() => navigate('/contact')} className="flex-1">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GettingStarted;