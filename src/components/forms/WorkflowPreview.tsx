import React from 'react';
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
  type: string;
  label: string;
  assignee?: string;
  action?: string;
  description?: string;
  position?: { x: number; y: number };
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

interface WorkflowPreviewProps {
  workflowSteps: WorkflowStep[];
  workflowConnections?: WorkflowConnection[];
  className?: string;
}

// Read-only node components with preview styling
const PreviewApprovalNode = ({ data }: { data: any }) => (
  <>
    <Handle type="target" position={Position.Left} />
    <div className="bg-background border-2 border-primary rounded-lg p-4 min-w-[200px] shadow-lg opacity-90">
      <div className="flex items-center gap-2 mb-2">
        <User className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Approval Step</span>
      </div>
      <div className="text-xs text-muted-foreground">
        <p className="font-medium">{data.label}</p>
        {data.assignee && <p>Assignee: {data.assignee}</p>}
        {data.description && <p className="mt-1 text-xs">{data.description}</p>}
      </div>
    </div>
    <Handle type="source" position={Position.Right} />
  </>
);

const PreviewNotificationNode = ({ data }: { data: any }) => (
  <>
    <Handle type="target" position={Position.Left} />
    <div className="bg-background border-2 border-blue-500 rounded-lg p-4 min-w-[200px] shadow-lg opacity-90">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-4 w-4 text-blue-500" />
        <span className="font-medium text-sm">Notification</span>
      </div>
      <div className="text-xs text-muted-foreground">
        <p className="font-medium">{data.label}</p>
        {data.action && <p>Type: {data.action}</p>}
        {data.description && <p className="mt-1 text-xs">{data.description}</p>}
      </div>
    </div>
    <Handle type="source" position={Position.Right} />
  </>
);

const PreviewConditionNode = ({ data }: { data: any }) => (
  <>
    <Handle type="target" position={Position.Left} />
    <div className="bg-background border-2 border-orange-500 rounded-lg p-4 min-w-[200px] shadow-lg opacity-90">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-orange-500 font-bold">?</span>
        <span className="font-medium text-sm">Condition</span>
      </div>
      <div className="text-xs text-muted-foreground">
        <p className="font-medium">{data.label}</p>
        {data.description && <p className="mt-1 text-xs">{data.description}</p>}
      </div>
    </div>
    <Handle type="source" position={Position.Right} id="yes" />
    <Handle type="source" position={Position.Bottom} id="no" />
  </>
);

const PreviewStartNode = ({ data }: { data: any }) => (
  <>
    <div className="bg-green-50 border-2 border-green-500 rounded-full p-4 min-w-[120px] text-center shadow-lg opacity-90">
      <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
      <span className="font-medium text-sm">{data.label || 'Start'}</span>
    </div>
    <Handle type="source" position={Position.Right} />
  </>
);

const PreviewEndNode = ({ data }: { data: any }) => (
  <>
    <Handle type="target" position={Position.Left} />
    <div className="bg-red-50 border-2 border-red-500 rounded-full p-4 min-w-[120px] text-center shadow-lg opacity-90">
      <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
      <span className="font-medium text-sm">{data.label || 'End'}</span>
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

export const WorkflowPreview: React.FC<WorkflowPreviewProps> = ({
  workflowSteps,
  workflowConnections = [],
  className = "",
}) => {
  // Transform workflow steps to ReactFlow nodes
  const nodes: Node[] = workflowSteps.map((step, index) => ({
    id: step.id,
    type: step.type,
    position: step.position || { x: index * 250 + 100, y: 200 },
    data: {
      label: step.label,
      assignee: step.assignee,
      action: step.action,
      description: step.description,
    },
    draggable: false, // Read-only mode
    selectable: false, // Read-only mode
  }));

  // Transform workflow connections to ReactFlow edges
  const edges: Edge[] = workflowConnections.map((connection, index) => ({
    id: `edge-${index}`,
    source: connection.source,
    target: connection.target,
    label: connection.label,
    style: { pointerEvents: 'none' }, // Read-only mode
  }));

  return (
    <div className={`h-[500px] w-full border rounded-lg ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={previewNodeTypes}
        fitView
        className="bg-muted/10"
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        preventScrolling={false}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap 
          nodeStrokeColor="#666"
          nodeColor="#ddd"
          pannable={false}
          zoomable={false}
        />
      </ReactFlow>
    </div>
  );
};