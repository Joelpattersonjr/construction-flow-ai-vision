import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { DailyReportsManager } from '@/components/daily-reports/DailyReportsManager';
import AppHeader from '@/components/navigation/AppHeader';

export default function DailyReports() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <AppHeader />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/projects')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
        <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/30">
          <DailyReportsManager />
        </div>
      </main>
    </div>
  );
}