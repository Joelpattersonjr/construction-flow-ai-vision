import React, { useState, useEffect } from 'react';
import { Plus, ListIcon, Grid3X3Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import AppHeader from '@/components/navigation/AppHeader';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskItem } from '@/components/tasks/TaskItem';
import { SimpleKanban } from '@/components/tasks/SimpleKanban';
import { TaskFilters } from '@/components/tasks/TaskFilters';
// import { BulkOperations } from '@/components/tasks/BulkOperations';
import { TaskWithDetails } from '@/types/tasks';
import { useTasks } from '@/hooks/useTasks';
import { useTasksRealtime } from '@/hooks/useTasksRealtime';
import { useTaskFilters } from '@/hooks/useTaskFilters';

const Tasks = () => {
  console.log('🔥 Tasks component rendering');
  
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);

  console.log('✅ State initialized successfully');

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

  // Set up real-time subscriptions
  useTasksRealtime();

  // Set up filters
  const {
    searchTerm,
    setSearchTerm,
    selectedProject,
    setSelectedProject,
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
    filteredTasks,
    clearFilters,
  } = useTaskFilters(tasks);

  // Log any task loading errors
  React.useEffect(() => {
    if (tasksError) {
      console.error('Tasks loading error:', tasksError);
    }
  }, [tasksError]);

  const handleFormSubmit = async (taskData: any) => {
    if (editingTask) {
      await handleUpdateTask(editingTask.id, taskData);
      setEditingTask(null);
    } else {
      await handleCreateTask(taskData);
    }
  };

  const handleEditTask = (task: TaskWithDetails) => {
    setEditingTask(task);
  };

  // Bulk operations handlers
  const handleTaskSelect = (taskId: number, selected: boolean) => {
    setSelectedTasks(prev => 
      selected 
        ? [...prev, taskId]
        : prev.filter(id => id !== taskId)
    );
  };

  const handleBulkStatusChange = async (taskIds: number[], status: string) => {
    await Promise.all(
      taskIds.map(id => handleStatusChange(id, status as any))
    );
  };

  const handleBulkDelete = async (taskIds: number[]) => {
    await Promise.all(
      taskIds.map(id => handleDeleteTask(id))
    );
  };

  const clearSelection = () => {
    setSelectedTasks([]);
  };

  // Helper to find dependency task
  const getDependencyTask = (dependencyId: number | null) => {
    if (!dependencyId) return null;
    return tasks.find(t => t.id === dependencyId) || null;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track project tasks
            </p>
          </div>
          
          <TaskForm
            tasks={tasks}
            projects={projects}
            teamMembers={teamMembers}
            onSubmit={handleFormSubmit}
            task={editingTask}
          >
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </TaskForm>
        </div>

        {/* Filters */}
        <TaskFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedPriority={selectedPriority}
          setSelectedPriority={setSelectedPriority}
          projects={projects}
          onClearFilters={clearFilters}
        />

        {/* Task Views */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <ListIcon className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <Grid3X3Icon className="h-4 w-4" />
              Kanban Board
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            {tasksLoading ? (
              <div className="text-center py-8">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No tasks found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                    onAddLabel={handleAddLabel}
                    onRemoveLabel={handleRemoveLabel}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="kanban" className="mt-6">
            <SimpleKanban
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onEditTask={handleEditTask}
              onAddLabel={handleAddLabel}
              onRemoveLabel={handleRemoveLabel}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Tasks;