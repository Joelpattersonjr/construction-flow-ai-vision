import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Settings, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Undo2,
  Bolt
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface PermissionTemplate {
  id: string;
  name: string;
  description?: string;
  role: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  is_default: boolean;
}

interface BulkOperation {
  id: string;
  type: 'role_change' | 'template_apply' | 'permission_update' | 'remove_members';
  description: string;
  affectedMembers: string[];
  data: any;
  timestamp: string;
  canRevert: boolean;
}

interface BulkOperationsDialogProps {
  projectId: string;
  members: ProjectMember[];
  templates: PermissionTemplate[];
  selectedMembers: string[];
  onBulkOperationComplete: () => void;
}

const BulkOperationsDialog: React.FC<BulkOperationsDialogProps> = ({
  projectId,
  members,
  templates,
  selectedMembers,
  onBulkOperationComplete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [operationType, setOperationType] = useState<'role_change' | 'template_apply' | 'permission_update' | 'remove_members'>('role_change');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customPermissions, setCustomPermissions] = useState({ read: true, write: false, admin: false });
  const [confirmOperation, setConfirmOperation] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recentOperations, setRecentOperations] = useState<BulkOperation[]>([]);
  const { toast } = useToast();

  const selectedMemberObjects = members.filter(m => selectedMembers.includes(m.id));

  const getOperationPreview = () => {
    switch (operationType) {
      case 'role_change':
        return {
          title: 'Change Role',
          description: `Change role to "${selectedRole}" for ${selectedMembers.length} members`,
          icon: Shield,
          color: 'text-blue-600',
          changes: selectedMemberObjects.map(member => ({
            member: member.profiles.full_name,
            from: member.role,
            to: selectedRole
          }))
        };
      case 'template_apply':
        const template = templates.find(t => t.id === selectedTemplate);
        return {
          title: 'Apply Template',
          description: `Apply "${template?.name}" template to ${selectedMembers.length} members`,
          icon: Settings,
          color: 'text-green-600',
          changes: selectedMemberObjects.map(member => ({
            member: member.profiles.full_name,
            from: `${member.role} (${JSON.stringify(member.permissions)})`,
            to: `${template?.role} (${JSON.stringify(template?.permissions)})`
          }))
        };
      case 'permission_update':
        return {
          title: 'Update Permissions',
          description: `Update permissions for ${selectedMembers.length} members`,
          icon: Shield,
          color: 'text-purple-600',
          changes: selectedMemberObjects.map(member => ({
            member: member.profiles.full_name,
            from: JSON.stringify(member.permissions),
            to: JSON.stringify(customPermissions)
          }))
        };
      case 'remove_members':
        return {
          title: 'Remove Members',
          description: `Remove ${selectedMembers.length} members from project`,
          icon: Users,
          color: 'text-red-600',
          changes: selectedMemberObjects.map(member => ({
            member: member.profiles.full_name,
            from: 'Active Member',
            to: 'Removed'
          }))
        };
      default:
        return null;
    }
  };

  const handleBulkOperation = async () => {
    if (!confirmOperation) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm the operation before proceeding",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Record the operation for potential revert
      const operation: BulkOperation = {
        id: crypto.randomUUID(),
        type: operationType,
        description: getOperationPreview()?.description || '',
        affectedMembers: selectedMembers,
        data: {
          role: selectedRole,
          template: selectedTemplate,
          permissions: customPermissions,
          originalStates: selectedMemberObjects.map(m => ({
            id: m.id,
            role: m.role,
            permissions: m.permissions
          }))
        },
        timestamp: new Date().toISOString(),
        canRevert: operationType !== 'remove_members'
      };

      setRecentOperations(prev => [operation, ...prev.slice(0, 4)]);
      
      toast({
        title: "Bulk Operation Completed",
        description: `Successfully processed ${selectedMembers.length} members`,
      });
      
      onBulkOperationComplete();
      setIsOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Bulk Operation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRevertOperation = async (operation: BulkOperation) => {
    if (!operation.canRevert) return;

    setProcessing(true);
    
    try {
      // Simulate revert API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Operation Reverted",
        description: `Successfully reverted changes for ${operation.affectedMembers.length} members`,
      });
      
      // Remove the reverted operation from recent operations
      setRecentOperations(prev => prev.filter(op => op.id !== operation.id));
      
      onBulkOperationComplete();
    } catch (error) {
      toast({
        title: "Revert Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setOperationType('role_change');
    setSelectedRole('');
    setSelectedTemplate('');
    setCustomPermissions({ read: true, write: false, admin: false });
    setConfirmOperation(false);
  };

  const canProceed = () => {
    switch (operationType) {
      case 'role_change':
        return selectedRole && selectedMembers.length > 0;
      case 'template_apply':
        return selectedTemplate && selectedMembers.length > 0;
      case 'permission_update':
        return selectedMembers.length > 0;
      case 'remove_members':
        return selectedMembers.length > 0;
      default:
        return false;
    }
  };

  const preview = getOperationPreview();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={selectedMembers.length === 0}>
          <Bolt className="h-4 w-4 mr-2" />
          Bulk Operations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Operations</DialogTitle>
          <DialogDescription>
            Perform operations on multiple members at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Selected Members ({selectedMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedMemberObjects.map(member => (
                  <Badge key={member.id} variant="outline">
                    {member.profiles.full_name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operation Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={operationType} onValueChange={(value: any) => setOperationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role_change">Change Role</SelectItem>
                  <SelectItem value="template_apply">Apply Template</SelectItem>
                  <SelectItem value="permission_update">Update Permissions</SelectItem>
                  <SelectItem value="remove_members">Remove Members</SelectItem>
                </SelectContent>
              </Select>

              {operationType === 'role_change' && (
                <div>
                  <Label>New Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {operationType === 'template_apply' && (
                <div>
                  <Label>Permission Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {operationType === 'permission_update' && (
                <div className="space-y-4">
                  <Label>Custom Permissions</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="read"
                        checked={customPermissions.read}
                        onCheckedChange={(checked) => 
                          setCustomPermissions(prev => ({ ...prev, read: checked as boolean }))
                        }
                      />
                      <Label htmlFor="read">Read Access</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="write"
                        checked={customPermissions.write}
                        onCheckedChange={(checked) => 
                          setCustomPermissions(prev => ({ ...prev, write: checked as boolean }))
                        }
                      />
                      <Label htmlFor="write">Write Access</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="admin"
                        checked={customPermissions.admin}
                        onCheckedChange={(checked) => 
                          setCustomPermissions(prev => ({ ...prev, admin: checked as boolean }))
                        }
                      />
                      <Label htmlFor="admin">Admin Access</Label>
                    </div>
                  </div>
                </div>
              )}

              {operationType === 'remove_members' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This action will remove selected members from the project. They will lose all access to project resources.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {preview && canProceed() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <preview.icon className={`h-5 w-5 ${preview.color}`} />
                  Operation Preview
                </CardTitle>
                <CardDescription>{preview.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {preview.changes.map((change, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-medium">{change.member}</span>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{change.from}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{change.to}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Confirmation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirmOperation"
                  checked={confirmOperation}
                  onCheckedChange={(checked) => setConfirmOperation(checked as boolean)}
                />
                <Label htmlFor="confirmOperation">
                  I confirm that I want to perform this bulk operation
                </Label>
              </div>
            </CardContent>
          </Card>

          {recentOperations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Operations
                </CardTitle>
                <CardDescription>
                  You can revert recent operations if needed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentOperations.map(operation => (
                    <div key={operation.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{operation.description}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(operation.timestamp).toLocaleString()}
                        </div>
                      </div>
                      {operation.canRevert && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevertOperation(operation)}
                          disabled={processing}
                        >
                          <Undo2 className="h-4 w-4 mr-2" />
                          Revert
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkOperation}
              disabled={!canProceed() || !confirmOperation || processing}
            >
              {processing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Execute Operation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkOperationsDialog;