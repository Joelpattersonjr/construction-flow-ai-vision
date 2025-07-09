import React from 'react';
import RoleAnalytics from './RoleAnalytics';

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  profiles: {
    full_name: string;
    job_title: string;
  };
  created_at?: string;
}

interface AnalyticsTabContentProps {
  members: ProjectMember[];
  templates: any[];
  projectId: string;
}

const AnalyticsTabContent: React.FC<AnalyticsTabContentProps> = ({
  members,
  templates,
  projectId,
}) => {
  return (
    <RoleAnalytics
      members={members}
      templates={templates}
      projectId={projectId}
    />
  );
};

export default AnalyticsTabContent;