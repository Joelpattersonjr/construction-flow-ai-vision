import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppHeader from '@/components/navigation/AppHeader';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskItem } from '@/components/tasks/TaskItem';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { BulkOperations } from '@/components/tasks/BulkOperations';
import { TaskTemplateDialog } from '@/components/tasks/TaskTemplateDialog';
import { useTasks } from '@/hooks/useTasks';
import { TaskWithDetails, TaskStatus } from '@/types/tasks';

const Tasks = () => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: '',
    project: '',
    search: ''
  });

  const {
    tasks,
    projects,
    teamMembers,
    tasksLoading,
    tasksError,
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    handleStatusChange,
    handleAddLabel,
    handleRemoveLabel,
  } = useTasks();

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.assignee && task.assignee_id !== filters.assignee) return false;
    if (filters.project && task.project_id !== filters.project) return false;
    if (filters.search && !task.title?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Group tasks by status for kanban view
  const tasksByStatus = filteredTasks.reduce((acc, task) => {
    const status = (task.status as TaskStatus) || 'todo';
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {} as Record<TaskStatus, TaskWithDetails[]>);

  const statusColumns: { key: TaskStatus; label: string; color: string }[] = [
    { key: 'todo', label: 'To Do', color: 'bg-gray-100' },
    { key: 'in_progress', label: 'In Progress', color: 'bg-blue-100' },
    { key: 'review', label: 'Review', color: 'bg-yellow-100' },
    { key: 'completed', label: 'Completed', color: 'bg-green-100' },
    { key: 'blocked', label: 'Blocked', color: 'bg-red-100' },
  ];

  const handleTaskSelect = (taskId: number, selected: boolean) => {
    if (selected) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTasks(filteredTasks.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleBulkStatusChange = async (status: TaskStatus) => {
    try {
      await Promise.all(
        selectedTasks.map(taskId => handleStatusChange(taskId, status))
      );
      setSelectedTasks([]);
    } catch (error) {
      console.error('Error updating task statuses:', error);
    }
  };

  const handleEdit = (task: TaskWithDetails) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const getDependencyTask = (dependencyId: number | null) => {
    if (!dependencyId) return null;
    return tasks.find(task => task.id === dependencyId) || null;
  };

  if (tasksError) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto py-6 px-4">
          <div className="text-center py-8">
            <p className="text-lg text-destructive">
              Error loading tasks: {tasksError.message}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track your project tasks
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(true)}
            >
              Templates
            </Button>
            <Button onClick={() => setShowTaskForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Filters */}
        <TaskFilters
          filters={filters}
          onFiltersChange={setFilters}
          projects={projects}
          teamMembers={teamMembers}
        />

        {/* Bulk Operations */}
        {selectedTasks.length > 0 && (
          <BulkOperations
            selectedTasks={selectedTasks}
            tasks={filteredTasks}
            onBulkStatusChange={(taskIds, status) => {
              Promise.all(taskIds.map(taskId => handleStatusChange(taskId, status)));
              setSelectedTasks([]);
            }}
            onBulkDelete={(taskIds) => {
              Promise.all(taskIds.map(taskId => handleDeleteTask(taskId)));
              setSelectedTasks([]);
            }}
            onClearSelection={() => setSelectedTasks([])}
          />
        )}

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {tasksLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {tasks.length === 0 ? 'No tasks yet. Create your first task!' : 'No tasks match the current filters.'}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                  onAddLabel={handleAddLabel}
                  onRemoveLabel={handleRemoveLabel}
                  isSelected={selectedTasks.includes(task.id)}
                  onSelect={handleTaskSelect}
                  dependencyTask={getDependencyTask(task.dependency_id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="kanban" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {statusColumns.map(({ key, label, color }) => (
                <Card key={key} className="min-h-[400px]">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span>{label}</span>
                      <Badge variant="secondary" className={color}>
                        {tasksByStatus[key]?.length || 0}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tasksByStatus[key]?.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onEdit={handleEdit}
                        onDelete={handleDeleteTask}
                        onStatusChange={handleStatusChange}
                        onAddLabel={handleAddLabel}
                        onRemoveLabel={handleRemoveLabel}
                        isSelected={selectedTasks.includes(task.id)}
                        onSelect={handleTaskSelect}
                        dependencyTask={getDependencyTask(task.dependency_id)}
                      />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Task Form Dialog */}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          projects={projects}
          teamMembers={teamMembers}
          tasks={tasks}
          onSubmit={editingTask ? 
            (data) => handleUpdateTask(editingTask.id, data) : 
            handleCreateTask
          }
          onClose={handleCloseForm}
        />
      )}

      {/* Task Template Dialog */}
      {showTemplateDialog && (
        <TaskTemplateDialog
          onClose={() => setShowTemplateDialog(false)}
          onCreateFromTemplate={(templateData) => {
            handleCreateTask(templateData);
            setShowTemplateDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default Tasks;