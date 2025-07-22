import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  NodeTypes,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, User, Mail, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface WorkflowNode extends Node {
  data: {
    label: string;
    type: 'start' | 'approval' | 'notification' | 'condition' | 'end';
    assignee?: string;
    action?: string;
    description?: string;
    conditionField?: string;
    conditionOperator?: string;
    conditionValue?: string;
    ifTrue?: string;
    ifFalse?: string;
  };
}

interface VisualWorkflowBuilderProps {
  formTemplateId?: string;
  workflowId?: string;
  onSave: (workflow: any) => void;
  onCancel: () => void;
}

// Custom node components
const ApprovalNode = ({ data }: { data: any }) => (
  <>
    <Handle type="target" position={Position.Left} />
    <div className="bg-background border-2 border-primary rounded-lg p-4 min-w-[200px] shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <User className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Approval Step</span>
      </div>
      <div className="text-xs text-muted-foreground">
        <p>{data.label}</p>
        {data.assignee && <p>Assignee: {data.assignee}</p>}
      </div>
    </div>
    <Handle type="source" position={Position.Right} />
  </>
);

const NotificationNode = ({ data }: { data: any }) => (
  <>
    <Handle type="target" position={Position.Left} />
    <div className="bg-background border-2 border-blue-500 rounded-lg p-4 min-w-[200px] shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-4 w-4 text-blue-500" />
        <span className="font-medium text-sm">Notification</span>
      </div>
      <div className="text-xs text-muted-foreground">
        <p>{data.label}</p>
      </div>
    </div>
    <Handle type="source" position={Position.Right} />
  </>
);

const ConditionNode = ({ data }: { data: any }) => (
  <>
    <Handle type="target" position={Position.Left} />
    <div className="bg-background border-2 border-orange-500 rounded-lg p-4 min-w-[200px] shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-orange-500 font-bold">?</span>
        <span className="font-medium text-sm">Condition</span>
      </div>
      <div className="text-xs text-muted-foreground">
        <p>{data.label}</p>
      </div>
    </div>
    <Handle type="source" position={Position.Right} id="yes" />
    <Handle type="source" position={Position.Bottom} id="no" />
  </>
);

const StartNode = ({ data }: { data: any }) => (
  <>
    <div className="bg-green-50 border-2 border-green-500 rounded-full p-4 min-w-[120px] text-center shadow-lg">
      <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
      <span className="font-medium text-sm">Start</span>
    </div>
    <Handle type="source" position={Position.Right} />
  </>
);

const EndNode = ({ data }: { data: any }) => (
  <>
    <Handle type="target" position={Position.Left} />
    <div className="bg-red-50 border-2 border-red-500 rounded-full p-4 min-w-[120px] text-center shadow-lg">
      <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
      <span className="font-medium text-sm">End</span>
    </div>
  </>
);

const nodeTypes: NodeTypes = {
  approval: ApprovalNode,
  notification: NotificationNode,
  condition: ConditionNode,
  start: StartNode,
  end: EndNode,
};

const initialNodes: WorkflowNode[] = [
  {
    id: '1',
    type: 'start',
    position: { x: 100, y: 100 },
    data: { label: 'Form Submitted', type: 'start' },
  },
];

const initialEdges: Edge[] = [];

export const VisualWorkflowBuilder: React.FC<VisualWorkflowBuilderProps> = ({
  formTemplateId,
  workflowId,
  onSave,
  onCancel,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: WorkflowNode['data']['type']) => {
    const newNode: WorkflowNode = {
      id: `${nodes.length + 1}`,
      type: type === 'start' || type === 'end' ? type : type,
      position: { x: Math.random() * 300 + 200, y: Math.random() * 300 + 200 },
      data: {
        label: getDefaultLabel(type),
        type,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const getDefaultLabel = (type: WorkflowNode['data']['type']) => {
    switch (type) {
      case 'approval': return 'Review & Approve';
      case 'notification': return 'Send Notification';
      case 'condition': return 'Check Condition';
      case 'start': return 'Start';
      case 'end': return 'End';
      default: return 'New Step';
    }
  };

  const handleNodeClick = (event: React.MouseEvent, node: WorkflowNode) => {
    setSelectedNode(node);
    setShowNodeEditor(true);
  };

  const updateSelectedNode = (updates: Partial<WorkflowNode['data']>) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, ...updates } });
  };

  const handleSave = () => {
    if (!workflowName.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    const workflowData = {
      name: workflowName,
      description: workflowDescription,
      form_template_id: formTemplateId,
      workflow_steps: nodes.map((node, index) => ({
        id: node.id,
        type: node.data.type,
        label: node.data.label,
        assignee: node.data.assignee,
        action: node.data.action,
        description: node.data.description,
        position: node.position,
        order: index,
      })),
      workflow_connections: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        condition: edge.label,
      })),
    };

    onSave(workflowData);
  };

  return (
    <div className="h-screen flex">
      {/* Workflow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-muted/30"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>

        {/* Floating Toolbar */}
        <div className="absolute top-4 left-4 z-10">
          <Card className="w-64">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Add Workflow Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addNode('approval')}
                className="w-full justify-start"
              >
                <User className="h-4 w-4 mr-2" />
                Approval Step
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addNode('notification')}
                className="w-full justify-start"
              >
                <Mail className="h-4 w-4 mr-2" />
                Notification
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addNode('condition')}
                className="w-full justify-start"
              >
                <span className="mr-2">?</span>
                Condition
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addNode('end')}
                className="w-full justify-start"
              >
                <XCircle className="h-4 w-4 mr-2" />
                End Point
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Save/Cancel Buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Workflow
          </Button>
        </div>
      </div>

      {/* Node Editor Panel */}
      {showNodeEditor && selectedNode && (
        <div className="w-80 border-l bg-background">
          <Card className="h-full rounded-none border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Edit Step
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNodeEditor(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="step-label">Step Name</Label>
                <Input
                  id="step-label"
                  value={selectedNode.data.label}
                  onChange={(e) => updateSelectedNode({ label: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="step-description">Description</Label>
                <Textarea
                  id="step-description"
                  value={selectedNode.data.description || ''}
                  onChange={(e) => updateSelectedNode({ description: e.target.value })}
                  placeholder="Optional description..."
                />
              </div>

              {selectedNode.data.type === 'approval' && (
                <div>
                  <Label htmlFor="assignee">Assignee</Label>
                  <Input
                    id="assignee"
                    value={selectedNode.data.assignee || ''}
                    onChange={(e) => updateSelectedNode({ assignee: e.target.value })}
                    placeholder="Enter email or role..."
                  />
                </div>
              )}

              {selectedNode.data.type === 'notification' && (
                <div>
                  <Label htmlFor="action">Notification Type</Label>
                  <Select
                    value={selectedNode.data.action || ''}
                    onValueChange={(value) => updateSelectedNode({ action: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select notification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="in_app">In-App Notification</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedNode.data.type === 'condition' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="condition-field">Field to Check</Label>
                    <Select
                      value={selectedNode.data.conditionField || ''}
                      onValueChange={(value) => updateSelectedNode({ conditionField: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field to check" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">Amount</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
                        <SelectItem value="custom_field">Custom Field</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="condition-operator">Condition</Label>
                    <Select
                      value={selectedNode.data.conditionOperator || ''}
                      onValueChange={(value) => updateSelectedNode({ conditionOperator: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="greater_than">Greater than</SelectItem>
                        <SelectItem value="less_than">Less than</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="not_equals">Not equals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="condition-value">Value</Label>
                    <Input
                      id="condition-value"
                      value={selectedNode.data.conditionValue || ''}
                      onChange={(e) => updateSelectedNode({ conditionValue: e.target.value })}
                      placeholder="Enter comparison value..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="if-true">If True (Yes path)</Label>
                      <Input
                        id="if-true"
                        value={selectedNode.data.ifTrue || ''}
                        onChange={(e) => updateSelectedNode({ ifTrue: e.target.value })}
                        placeholder="Action if condition is true"
                      />
                    </div>
                    <div>
                      <Label htmlFor="if-false">If False (No path)</Label>
                      <Input
                        id="if-false"
                        value={selectedNode.data.ifFalse || ''}
                        onChange={(e) => updateSelectedNode({ ifFalse: e.target.value })}
                        placeholder="Action if condition is false"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <div className="space-y-2">
                  <Label>Workflow Settings</Label>
                  <div>
                    <Label htmlFor="workflow-name">Workflow Name</Label>
                    <Input
                      id="workflow-name"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                      placeholder="Enter workflow name..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="workflow-description">Workflow Description</Label>
                    <Textarea
                      id="workflow-description"
                      value={workflowDescription}
                      onChange={(e) => setWorkflowDescription(e.target.value)}
                      placeholder="Describe this workflow..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};