import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  MessageSquare, 
  Bell, 
  Activity, 
  Send, 
  FileText, 
  Clock, 
  CheckCircle,
  UserPlus,
  Calendar,
  AlertCircle,
  TrendingUp,
  MessageCircle,
  UserCheck,
  AtSign
} from 'lucide-react';

interface TeamActivity {
  id: string;
  user_name: string;
  user_avatar?: string;
  action: string;
  target: string;
  timestamp: string;
  project_name?: string;
}

interface ProjectUpdate {
  id: string;
  type: 'task' | 'file' | 'comment' | 'member';
  title: string;
  description: string;
  user_name: string;
  user_avatar?: string;
  timestamp: string;
  project_id: string;
  project_name: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  online?: boolean;
}

interface TeamCollaborationPanelProps {
  selectedProjectId?: string;
}

const TeamCollaborationPanel: React.FC<TeamCollaborationPanelProps> = ({ selectedProjectId }) => {
  const [teamActivity, setTeamActivity] = useState<TeamActivity[]>([]);
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [message, setMessage] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(['all']);
  const [messageRecipientType, setMessageRecipientType] = useState<'all' | 'specific' | 'group'>('all');
  const [activeTab, setActiveTab] = useState('activity');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    loadCollaborationData();
    loadTeamMembers();
  }, [selectedProjectId]);

  const loadCollaborationData = async () => {
    try {
      await Promise.all([
        loadTeamActivity(),
        loadProjectUpdates(),
        loadNotifications()
      ]);
    } catch (error) {
      console.error('Error loading collaboration data:', error);
      toast({
        title: "Error loading collaboration data",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      // Get team members from all projects if no specific project selected
      const { data: members } = await supabase
        .from('project_members_enhanced')
        .select(`
          user_id,
          role,
          profiles!inner(
            id,
            full_name,
            avatar_url,
            company_role
          )
        `)
        .eq('project_id', selectedProjectId || '')
        .limit(20);

      if (members) {
        const teamMembersList: TeamMember[] = members.map((member: any) => ({
          id: member.profiles.id,
          name: member.profiles.full_name || 'Unknown User',
          avatar: member.profiles.avatar_url,
          role: member.role,
          online: Math.random() > 0.5 // Mock online status
        }));
        setTeamMembers(teamMembersList);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
      // Add mock data for demo purposes
      setTeamMembers([
        { id: '1', name: 'John Doe', role: 'Project Manager', online: true },
        { id: '2', name: 'Sarah Miller', role: 'Engineer', online: true },
        { id: '3', name: 'Mike Johnson', role: 'Architect', online: false },
        { id: '4', name: 'Lisa Chen', role: 'Supervisor', online: true }
      ]);
    }
  };

  const loadTeamActivity = async () => {
    try {
      // Get recent task activities
      const { data: taskActivities } = await supabase
        .from('task_activity')
        .select(`
          id,
          action_type,
          description,
          created_at,
          profiles!task_activity_user_id_fkey(
            full_name,
            avatar_url
          ),
          tasks!task_activity_task_id_fkey(
            title,
            projects!tasks_project_id_fkey(
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (taskActivities) {
        const activities: TeamActivity[] = taskActivities.map((activity: any) => ({
          id: activity.id,
          user_name: activity.profiles?.full_name || 'Unknown User',
          user_avatar: activity.profiles?.avatar_url,
          action: activity.action_type,
          target: activity.tasks?.title || 'Unknown Task',
          timestamp: activity.created_at,
          project_name: activity.tasks?.projects?.name
        }));
        setTeamActivity(activities);
      }
    } catch (error) {
      console.error('Error loading team activity:', error);
    }
  };

  const loadProjectUpdates = async () => {
    try {
      // Get recent project updates (tasks, files, etc.)
      const { data: recentTasks } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          created_at,
          updated_at,
          projects!tasks_project_id_fkey(
            id,
            name
          ),
          profiles!tasks_created_by_fkey(
            full_name,
            avatar_url
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(5);

      const { data: recentFiles } = await supabase
        .from('documents')
        .select(`
          id,
          file_name,
          created_at,
          projects!documents_project_id_fkey(
            id,
            name
          ),
          profiles!documents_uploader_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      const updates: ProjectUpdate[] = [];

      if (recentTasks) {
        recentTasks.forEach((task: any) => {
          updates.push({
            id: `task-${task.id}`,
            type: 'task',
            title: task.title || 'Untitled Task',
            description: `Task status: ${task.status || 'pending'}`,
            user_name: task.profiles?.full_name || 'Unknown User',
            user_avatar: task.profiles?.avatar_url,
            timestamp: task.updated_at || task.created_at,
            project_id: task.projects?.id || '',
            project_name: task.projects?.name || 'Unknown Project'
          });
        });
      }

      if (recentFiles) {
        recentFiles.forEach((file: any) => {
          updates.push({
            id: `file-${file.id}`,
            type: 'file',
            title: file.file_name || 'Untitled File',
            description: 'New file uploaded',
            user_name: file.profiles?.full_name || 'Unknown User',
            user_avatar: file.profiles?.avatar_url,
            timestamp: file.created_at,
            project_id: file.projects?.id || '',
            project_name: file.projects?.name || 'Unknown Project'
          });
        });
      }

      // Sort by timestamp
      updates.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setProjectUpdates(updates.slice(0, 10));
    } catch (error) {
      console.error('Error loading project updates:', error);
    }
  };

  const loadNotifications = async () => {
    // Mock notifications for now - in a real app, these would come from a notifications table
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'New Task Assignment',
        message: 'You have been assigned to "Foundation Work" task',
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        title: 'Project Deadline Approaching',
        message: 'Oak Street Renovation deadline is in 3 days',
        type: 'warning',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: false
      },
      {
        id: '3',
        title: 'File Upload Complete',
        message: 'Blueprint v2.0 has been uploaded successfully',
        type: 'success',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        read: true
      }
    ];
    setNotifications(mockNotifications);
  };

  const sendQuickMessage = async () => {
    if (!message.trim()) return;

    const recipientText = getRecipientDisplayText();
    
    try {
      // In a real app, this would send to a messages/chat table with specific recipients
      toast({
        title: "Message sent",
        description: `Your message has been sent to ${recipientText}`,
      });
      setMessage('');
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const getRecipientDisplayText = () => {
    if (messageRecipientType === 'all') {
      return 'all team members';
    }
    if (selectedRecipients.length === 1) {
      const member = teamMembers.find(m => m.id === selectedRecipients[0]);
      return member?.name || 'selected member';
    }
    return `${selectedRecipients.length} team members`;
  };

  const handleRecipientToggle = (memberId: string) => {
    if (messageRecipientType === 'all') return;
    
    setSelectedRecipients(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleRecipientTypeChange = (type: 'all' | 'specific' | 'group') => {
    setMessageRecipientType(type);
    if (type === 'all') {
      setSelectedRecipients(['all']);
    } else {
      setSelectedRecipients([]);
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getActivityIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
      case 'create':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'updated':
      case 'update':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'completed':
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'commented':
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'file':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'member':
        return <Users className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Collaboration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Collaboration
          </div>
          <div className="flex items-center gap-2">
            {unreadNotifications > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadNotifications} new
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Stay updated with team activity and project progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
            <TabsTrigger value="notifications" className="relative">
              Notifications
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                  {unreadNotifications}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messaging">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4" />
              <h3 className="font-medium">Recent Team Activity</h3>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {teamActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activity.user_avatar} />
                      <AvatarFallback className="text-xs">
                        {activity.user_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getActivityIcon(activity.action)}
                        <p className="text-sm">
                          <span className="font-medium">{activity.user_name}</span>
                          <span className="text-slate-600"> {activity.action.toLowerCase()} </span>
                          <span className="font-medium">{activity.target}</span>
                          {activity.project_name && (
                            <>
                              <span className="text-slate-600"> in </span>
                              <span className="font-medium">{activity.project_name}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                {teamActivity.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent team activity</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="updates" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4" />
              <h3 className="font-medium">Project Updates</h3>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {projectUpdates.map((update) => (
                  <div key={update.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getUpdateIcon(update.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm truncate">{update.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {update.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{update.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={update.user_avatar} />
                          <AvatarFallback className="text-xs">
                            {update.user_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-slate-500">{update.user_name}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{formatTimeAgo(update.timestamp)}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{update.project_name}</p>
                    </div>
                  </div>
                ))}
                {projectUpdates.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent project updates</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-4 w-4" />
              <h3 className="font-medium">Notifications</h3>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      notification.read 
                        ? 'bg-slate-50 border-slate-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="messaging" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <h3 className="font-medium">Quick Team Chat</h3>
              </div>
              {messageRecipientType !== 'all' && selectedRecipients.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <AtSign className="h-3 w-3 mr-1" />
                  {getRecipientDisplayText()}
                </Badge>
              )}
            </div>
            
            {/* Recipient Selection */}
            <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Send to:</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={messageRecipientType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRecipientTypeChange('all')}
                  className="text-xs"
                >
                  <Users className="h-3 w-3 mr-1" />
                  All Team
                </Button>
                <Button
                  variant={messageRecipientType === 'specific' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRecipientTypeChange('specific')}
                  className="text-xs"
                >
                  <AtSign className="h-3 w-3 mr-1" />
                  Specific Members
                </Button>
              </div>

              {messageRecipientType === 'specific' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600">Select team members to message:</p>
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-2">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-white rounded transition-colors">
                          <Checkbox
                            id={`member-${member.id}`}
                            checked={selectedRecipients.includes(member.id)}
                            onCheckedChange={() => handleRecipientToggle(member.id)}
                          />
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{member.name}</span>
                              {member.online && (
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{member.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <ScrollArea className="h-[200px] p-4 bg-slate-50 rounded-lg">
                <div className="space-y-3">
                  {/* Mock chat messages with recipient indicators */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">JD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <p className="text-sm">Hey team, just uploaded the latest blueprints for review!</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500">John Doe • 2h ago</p>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          <Users className="h-2 w-2 mr-1" />
                          All Team
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">SM</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <p className="text-sm">@John Great! I'll review them this afternoon.</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500">Sarah Miller • 1h ago</p>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          <AtSign className="h-2 w-2 mr-1" />
                          John Doe
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">MJ</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <p className="text-sm">@Sarah @John The electrical plans need updating too</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500">Mike Johnson • 30m ago</p>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          <AtSign className="h-2 w-2 mr-1" />
                          2 members
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              
              <div className="space-y-2">
                {messageRecipientType !== 'all' && selectedRecipients.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <AtSign className="h-3 w-3" />
                    <span>Messaging {getRecipientDisplayText()}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      messageRecipientType === 'all' 
                        ? "Type a message to all team members..."
                        : selectedRecipients.length === 0
                        ? "Select recipients first..."
                        : `Message ${getRecipientDisplayText()}...`
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendQuickMessage()}
                    disabled={messageRecipientType !== 'all' && selectedRecipients.length === 0}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendQuickMessage}
                    disabled={!message.trim() || (messageRecipientType !== 'all' && selectedRecipients.length === 0)}
                    size="sm"
                    className="px-3"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TeamCollaborationPanel;