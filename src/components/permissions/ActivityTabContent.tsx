import React from 'react';
import AuditLogTable from './AuditLogTable';
import { AuditLogEntry } from '@/services/auditService';

interface ActivityTabContentProps {
  auditLogs: AuditLogEntry[];
  loading: boolean;
}

const ActivityTabContent: React.FC<ActivityTabContentProps> = ({
  auditLogs,
  loading,
}) => {
  return (
    <AuditLogTable 
      auditLogs={auditLogs}
      loading={loading}
    />
  );
};

export default ActivityTabContent;