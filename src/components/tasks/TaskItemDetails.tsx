import React from 'react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { TaskComments } from './TaskComments';
import { TaskActivityFeed } from './TaskActivityFeed';
import { TaskFileAttachments } from './TaskFileAttachments';

interface TaskItemDetailsProps {
  taskId: number;
  isExpanded: boolean;
}

export const TaskItemDetails: React.FC<TaskItemDetailsProps> = ({
  taskId,
  isExpanded,
}) => {
  return (
    <Collapsible open={isExpanded}>
      <CollapsibleContent className="space-y-4 mt-4">
        <TaskComments taskId={taskId} />
        <TaskActivityFeed taskId={taskId} />
        <TaskFileAttachments taskId={taskId} />
      </CollapsibleContent>
    </Collapsible>
  );
};