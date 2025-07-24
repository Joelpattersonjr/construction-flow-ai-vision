import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { User, Mail, CheckCircle, XCircle } from "lucide-react";

interface WorkflowStep {
  id: string;
  type: 'start' | 'approval' | 'notification' | 'condition' | 'end';
  label: string;
  assignee?: string;
  action?: string;
  description?: string;
  position: { x: number; y: number };
  order: number;
}

interface WorkflowConnection {
  source: string;
  target: string;
  condition_field?: string;
  condition_operator?: string;
  condition_value?: string;
  label?: string;
}

interface WorkflowVisualizationProps {
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
}

// Read-only node components for preview
const PreviewApprovalNode = ({ data }: { data: any }) => (
  <>
    <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
    <div className="bg-background border-2 border-primary rounded-lg p-4 min-w-[200px] shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <User className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Approval Step</span>
      </div>
      <div className="text-xs text-muted-foreground">
        <p className="font-medium">{data.label}</p>
        {data.assignee && <p className="mt-1">Assignee: {data.assignee}</p>}
        {data.description && <p className="mt-1">{data.description}</p>}
      </div>
    </div>
    <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
  </>
);

const PreviewNotificationNode = ({ data }: { data: any }) => (
  <>
    <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
    <div className="bg-background border-2 border-blue-500 rounded-lg p-4 min-w-[200px] shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-4 w-4 text-blue-500" />
        <span className="font-medium text-sm">Notification</span>
      </div>
      <div className="text-xs text-muted-foreground">
        <p className="font-medium">{data.label}</p>
        {data.action && <p className="mt-1">Type: {data.action}</p>}
        {data.description && <p className="mt-1">{data.description}</p>}
      </div>
    </div>
    <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
  </>
);

const PreviewConditionNode = ({ data }: { data: any }) => (
  <>
    <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
    <div className="bg-background border-2 border-orange-500 rounded-lg p-4 min-w-[200px] shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-orange-500 font-bold">?</span>
        <span className="font-medium text-sm">Condition</span>
      </div>
      <div className="text-xs text-muted-foreground">
        <p className="font-medium">{data.label}</p>
        {data.description && <p className="mt-1">{data.description}</p>}
      </div>
    </div>
    <Handle type="source" position={Position.Right} id="yes" style={{ visibility: 'hidden' }} />
    <Handle type="source" position={Position.Bottom} id="no" style={{ visibility: 'hidden' }} />
  </>
);

const PreviewStartNode = ({ data }: { data: any }) => (
  <>
    <div className="bg-green-50 border-2 border-green-500 rounded-full p-4 min-w-[120px] text-center shadow-lg">
      <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
      <span className="font-medium text-sm">Start</span>
    </div>
    <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
  </>
);

const PreviewEndNode = ({ data }: { data: any }) => (
  <>
    <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
    <div className="bg-red-50 border-2 border-red-500 rounded-full p-4 min-w-[120px] text-center shadow-lg">
      <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
      <span className="font-medium text-sm">End</span>
    </div>
  </>
);

const previewNodeTypes: NodeTypes = {
  approval: PreviewApprovalNode,
  notification: PreviewNotificationNode,
  condition: PreviewConditionNode,
  start: PreviewStartNode,
  end: PreviewEndNode,
};

export const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
  steps,
  connections,
}) => {
  const nodes: Node[] = useMemo(() => {
    return steps.map((step) => ({
      id: step.id,
      type: step.type,
      position: step.position,
      data: {
        label: step.label,
        assignee: step.assignee,
        action: step.action,
        description: step.description,
        type: step.type,
      },
      draggable: false,
      selectable: false,
    }));
  }, [steps]);

  const edges: Edge[] = useMemo(() => {
    return connections.map((connection, index) => ({
      id: `edge-${index}`,
      source: connection.source,
      target: connection.target,
      label: connection.label,
      style: { pointerEvents: 'none' },
      labelStyle: { 
        fontSize: '12px',
        fontWeight: 500,
      },
      animated: false,
    }));
  }, [connections]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={previewNodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-muted/30"
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnDoubleClick={false}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap 
          nodeColor="#e2e8f0"
          maskColor="rgba(0, 0, 0, 0.1)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
};