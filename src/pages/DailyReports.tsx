import React from 'react';
import { DailyReportsManager } from '@/components/daily-reports/DailyReportsManager';
import { AppLayout } from '@/components/layout/AppLayout';

export default function DailyReports() {
  return (
    <AppLayout>
      <DailyReportsManager />
    </AppLayout>
  );
}