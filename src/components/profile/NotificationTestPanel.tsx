import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Smartphone, Calendar, MessageSquare, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { emailNotificationService } from '@/services/emailNotificationService';

export const NotificationTestPanel: React.FC = () => {
  const { toast } = useToast();

  const sendTestNotification = async (type: string) => {
    try {
      const testData = {
        type: type as any,
        recipient_email: 'test@example.com',
        recipient_name: 'Test User',
        data: {
          task: {
            id: 1,
            title: 'Sample Task for Testing',
            description: 'This is a test notification to preview email format.',
            due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            priority: 'high'
          },
          project: {
            id: 'proj-123',
            name: 'Sample Project'
          },
          assigner: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          comment: {
            content: 'This is a sample comment for testing notifications.',
            author: 'Jane Smith'
          }
        }
      };

      await emailNotificationService.sendNotification(testData);
      
      toast({
        title: "Test notification sent!",
        description: `${type.replace('_', ' ')} notification has been sent to test@example.com`,
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Test failed",
        description: "Failed to send test notification. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const notificationTypes = [
    {
      type: 'task_assignment',
      title: 'Task Assignment',
      description: 'When you\'re assigned a new task',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-blue-500'
    },
    {
      type: 'due_date_reminder',
      title: 'Due Date Reminder',
      description: 'When a task is due within 24 hours',
      icon: <Calendar className="w-4 h-4" />,
      color: 'bg-orange-500'
    },
    {
      type: 'task_comment',
      title: 'Task Comment',
      description: 'When someone comments on your task',
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'bg-green-500'
    },
    {
      type: 'project_update',
      title: 'Project Update',
      description: 'When there are updates to your projects',
      icon: <Bell className="w-4 h-4" />,
      color: 'bg-purple-500'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Notification System
        </CardTitle>
        <CardDescription>
          Test different types of email notifications to see how they look and ensure they're working correctly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Email notifications are active and configured
          </span>
          <Badge variant="secondary" className="ml-auto">
            <Smartphone className="w-3 h-3 mr-1" />
            Resend API
          </Badge>
        </div>

        {/* Notification Types */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Available Notification Types</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {notificationTypes.map((notification) => (
              <div
                key={notification.type}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full text-white ${notification.color}`}>
                    {notification.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.description}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => sendTestNotification(notification.type)}
                  className="ml-3"
                >
                  Test
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Notifications are sent automatically when events occur</li>
            <li>• Users can control their notification preferences in profile settings</li>
            <li>• Due date reminders are sent daily for tasks due within 24 hours</li>
            <li>• All notifications respect user preferences and can be disabled</li>
          </ul>
        </div>

        {/* Test Email Notice */}
        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
          <strong>Note:</strong> Test notifications are sent to test@example.com for preview purposes. 
          In production, notifications are sent to actual user email addresses based on their profile settings.
        </div>
      </CardContent>
    </Card>
  );
};