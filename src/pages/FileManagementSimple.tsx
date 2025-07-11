import React from 'react';
import AppHeader from '@/components/navigation/AppHeader';

const FileManagementSimple = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold">Files (Simple)</h1>
        <p>This is a simple files page to test if the basic structure works.</p>
      </main>
    </div>
  );
};

export default FileManagementSimple;