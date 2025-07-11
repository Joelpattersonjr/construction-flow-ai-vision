import React from 'react';
import AppHeader from '@/components/navigation/AppHeader';

const Tasks = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">
              Task management is temporarily being rebuilt.
            </p>
          </div>
        </div>
        
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground">
            The task management system is currently being rebuilt after the revert.
            Core functionality will be restored shortly.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Tasks;