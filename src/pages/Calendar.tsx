import React, { useState, useEffect } from 'react';
import { Calendar, List, Filter, Plus, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TaskCalendar } from '@/components/calendar/TaskCalendar';
import { taskService } from '@/services/taskService';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/navigation/AppHeader';
import { ExportDialog } from '@/components/export/ExportDialog';
import { FeatureGate } from '@/components/subscription/FeatureGate';

export default function CalendarView() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, priorityFilter, statusFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await taskService.getCompanyTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = tasks;

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    setFilteredTasks(filtered);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      await taskService.createTask({
        title: newTaskTitle,
        description: newTaskDescription,
        priority: newTaskPriority,
        status: 'todo' as const,
        end_date: new Date().toISOString().split('T')[0] // Today as default
      });

      toast({
        title: "Task created",
        description: "New task has been created successfully.",
      });

      loadTasks();
      setShowTaskForm(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task.",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const withDueDate = tasks.filter(task => task.end_date).length;
    const overdue = tasks.filter(task => 
      task.end_date && new Date(task.end_date) < new Date() && task.status !== 'completed'
    ).length;
    const completed = tasks.filter(task => task.status === 'completed').length;

    return { total, withDueDate, overdue, completed };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-blue-300/20 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-purple-300/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      <AppHeader />
      
      <main className="container mx-auto py-8 px-4 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-6 animate-fade-in relative">
          {/* Back Button */}
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.history.length <= 1) {
                  window.location.href = '/dashboard';
                } else {
                  window.history.back();
                }
              }}
              className="flex items-center space-x-2 bg-white/30 backdrop-blur-sm hover:bg-white/50 transition-all duration-300 border border-white/20 text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>
          
          <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/30">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl backdrop-blur-sm border border-white/20 mb-4 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="h-10 w-10 text-blue-600 group-hover:rotate-6 transition-transform duration-300" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
              Task
              <span className="block bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Calendar
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Visualize your project timelines, manage deadlines, and track progress across all your construction projects in one comprehensive calendar view.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 overflow-hidden">
              <Button 
                variant={viewMode === 'calendar' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('calendar')}
                className={`rounded-none border-0 ${
                  viewMode === 'calendar' 
                    ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg' 
                    : 'bg-transparent hover:bg-white/30 text-gray-700'
                } transition-all duration-300`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('list')}
                className={`rounded-none border-0 ${
                  viewMode === 'list' 
                    ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg' 
                    : 'bg-transparent hover:bg-white/30 text-gray-700'
                } transition-all duration-300`}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
            
            <Button 
              onClick={() => setShowTaskForm(true)}
              className="group bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 font-semibold relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </span>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
            </Button>
            
            <FeatureGate 
              feature="scheduling"
              showUpgradePrompt={false}
              fallback={null}
            >
              <Button 
                className="group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 font-semibold relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule Builder
                </span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
              </Button>
            </FeatureGate>
            
            <ExportDialog 
              tasks={filteredTasks.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                assignee: task.assignee,
                project: task.project,
                start_date: task.start_date,
                end_date: task.end_date,
                created_at: task.created_at,
                updated_at: task.updated_at,
              }))}
              title="Export Calendar Tasks"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="group relative border-0 bg-white/40 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-600 group-hover:text-primary transition-colors duration-300">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:from-primary group-hover:to-blue-600 transition-all duration-300">{stats.total}</div>
              <p className="text-sm text-gray-500 mt-1">All tasks in company</p>
            </CardContent>
          </Card>
          
          <Card className="group relative border-0 bg-white/40 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-600 group-hover:text-blue-600 transition-colors duration-300">With Due Date</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">{stats.withDueDate}</div>
              <p className="text-sm text-gray-500 mt-1">Tasks on calendar</p>
            </CardContent>
          </Card>
          
          <Card className="group relative border-0 bg-white/40 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-600 group-hover:text-red-600 transition-colors duration-300">Overdue</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-red-600 group-hover:scale-110 transition-transform duration-300">{stats.overdue}</div>
              <p className="text-sm text-gray-500 mt-1">Past due date</p>
            </CardContent>
          </Card>
          
          <Card className="group relative border-0 bg-white/40 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-semibold text-gray-600 group-hover:text-green-600 transition-colors duration-300">Completed</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-green-600 group-hover:scale-110 transition-transform duration-300">{stats.completed}</div>
              <p className="text-sm text-gray-500 mt-1">Finished tasks</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 border-0 bg-white/40 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-blue-600/5 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <div className="p-2 bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-lg">
                <Filter className="w-5 h-5 text-primary" />
              </div>
              Filters
            </CardTitle>
            <CardDescription className="text-gray-600">
              Filter tasks displayed on the calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Priority:</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-32 bg-white/60 border-white/40 focus:border-primary/50 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Status:</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 bg-white/60 border-white/40 focus:border-primary/50 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary font-semibold px-4 py-2">
                {filteredTasks.filter(task => task.end_date).length} tasks shown
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-8 border-0 bg-white/40 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-green-500/5 to-emerald-600/5 rounded-t-lg">
            <CardTitle className="text-xl font-bold text-gray-800">How to use the calendar</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-lg backdrop-blur-sm border border-blue-200/30">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-blue-800">Click any date</strong>
                  <p className="text-gray-600 mt-1">Create a new task with that due date</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-green-50/50 rounded-lg backdrop-blur-sm border border-green-200/30">
                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-green-800">Click a task</strong>
                  <p className="text-gray-600 mt-1">View details, add comments, or edit</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-purple-50/50 rounded-lg backdrop-blur-sm border border-purple-200/30">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-purple-800">Drag tasks</strong>
                  <p className="text-gray-600 mt-1">To different dates to change due dates</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200/50">
              <p className="text-sm text-gray-600 font-medium mb-3">
                <strong>Color coding:</strong> 
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-medium shadow-sm">High Priority</span>
                <span className="px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg text-sm font-medium shadow-sm">Medium Priority</span>
                <span className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium shadow-sm">Low Priority</span>
                <span className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium shadow-sm">Completed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduling Preview for Non-Premium Users */}
        <FeatureGate 
          feature="scheduling"
          upgradeMessage="Unlock advanced scheduling features including time slot management, drag & drop scheduling, and team coordination tools."
        >
          <div />
        </FeatureGate>

        {/* Calendar or List View */}
        <Card className="border-0 bg-white/40 backdrop-blur-sm shadow-xl">
          <CardContent className="p-8">
            {viewMode === 'calendar' ? (
              <TaskCalendar 
                companyTasks={filteredTasks} 
                onTaskUpdate={loadTasks}
              />
            ) : (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Task List View</h3>
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
                      <List className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">No tasks found matching your filters.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTasks.map(task => (
                      <Card key={task.id} className="group border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-4 h-4 rounded-full ${getPriorityColor(task.priority)} shadow-sm`}></div>
                              <div>
                                <h4 className="font-semibold text-gray-800 group-hover:text-primary transition-colors">{task.title}</h4>
                                <p className="text-sm text-gray-500 mt-1">
                                  {task.project?.name && <span className="font-medium text-gray-600">{task.project.name}</span>}
                                  {task.assignee?.full_name && (
                                    <span className="text-gray-500"> • Assigned to {task.assignee.full_name}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className={`${getStatusColor(task.status)} text-white border-none font-medium`}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                              {task.end_date && (
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                  Due: {new Date(task.end_date).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-3 ml-8 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Simple Task Creation Dialog */}
      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Task description (optional)"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={newTaskPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTaskPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowTaskForm(false)}
                className="border-2 hover:bg-gray-50 transition-all duration-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTask}
                className="group bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 font-semibold relative overflow-hidden"
              >
                <span className="relative z-10">Create Task</span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}