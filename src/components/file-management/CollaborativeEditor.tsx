import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useCollaborativeEditor } from '@/hooks/useCollaborativeEditor';
import { useSubscription } from '@/hooks/useSubscription';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { 
  Save, 
  Users, 
  History, 
  Tag, 
  AlertCircle,
  Clock,
  CheckCircle,
  Crown
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileVersionHistory } from './FileVersionHistory';

interface CollaborativeEditorProps {
  documentId: string;
  fileName: string;
  onClose?: () => void;
}

export const CollaborativeEditor = ({ documentId, fileName, onClose }: CollaborativeEditorProps) => {
  const { isFeatureEnabled, checkVersionLimit, checkCollaboratorLimit } = useSubscription();
  const {
    content,
    setContent,
    activeUsers,
    isConnected,
    isLoading,
    hasUnsavedChanges,
    lastSavedVersion,
    saveDocument,
    createManualVersion,
  } = useCollaborativeEditor(documentId);

  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCreateVersion, setShowCreateVersion] = useState(false);
  const [versionDescription, setVersionDescription] = useState('');
  const [versionLimitReached, setVersionLimitReached] = useState(false);
  const [collaboratorLimitReached, setCollaboratorLimitReached] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setContent(newContent, cursorPosition);
  };

  const handleCreateVersion = async () => {
    if (versionDescription.trim()) {
      // Check version limit before creating
      const versionCheck = await checkVersionLimit(documentId);
      if (!versionCheck.allowed) {
        setVersionLimitReached(true);
        return;
      }
      
      await createManualVersion(versionDescription.trim());
      setVersionDescription('');
      setShowCreateVersion(false);
    }
  };

  // Check limits on component mount
  useEffect(() => {
    const checkLimits = async () => {
      const versionCheck = await checkVersionLimit(documentId);
      const collaboratorCheck = await checkCollaboratorLimit(documentId);
      
      setVersionLimitReached(!versionCheck.allowed);
      setCollaboratorLimitReached(!collaboratorCheck.allowed);
    };
    
    checkLimits();
  }, [documentId, checkVersionLimit, checkCollaboratorLimit]);

  const getUserInitials = (userName: string) => {
    return userName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if version control features are enabled
  const hasVersionControl = isFeatureEnabled('version_control');
  const hasCollaboration = isFeatureEnabled('collaboration');

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Connecting to collaborative session...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If collaboration is not enabled, show basic editor with upgrade prompt
  if (!hasCollaboration) {
    return (
      <div className="h-full flex flex-col">
        <Card className="mb-4">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <span>{fileName}</span>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <Crown className="h-3 w-3 mr-1" />
                Basic Mode
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        <FeatureGate
          feature="collaboration"
          upgradeMessage="Real-time collaborative editing requires a Pro or Enterprise subscription. Upgrade to edit files with your team simultaneously."
        >
          {/* This won't be shown due to the gate */}
          <div />
        </FeatureGate>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>{fileName}</span>
              {isConnected ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Save status */}
              {hasUnsavedChanges ? (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Unsaved changes
                </Badge>
              ) : lastSavedVersion && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Saved v{lastSavedVersion}
                </Badge>
              )}

              {/* Action buttons */}
              <Button variant="outline" size="sm" onClick={saveDocument}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>

              <Dialog open={showCreateVersion} onOpenChange={setShowCreateVersion}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!hasVersionControl || versionLimitReached}
                  >
                    <Tag className="h-4 w-4 mr-1" />
                    Create Version
                    {!hasVersionControl && <Crown className="h-3 w-3 ml-1" />}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Manual Version</DialogTitle>
                    <DialogDescription>
                      Create a manual checkpoint for this document with a custom description.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description">Version Description</Label>
                      <Input
                        id="description"
                        placeholder="e.g., Major feature update, Bug fixes, etc."
                        value={versionDescription}
                        onChange={(e) => setVersionDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateVersion(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateVersion} disabled={!versionDescription.trim()}>
                      Create Version
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowVersionHistory(true)}
                disabled={!hasVersionControl}
              >
                <History className="h-4 w-4 mr-1" />
                History
                {!hasVersionControl && <Crown className="h-3 w-3 ml-1" />}
              </Button>

              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>

          {/* Active users - show warning if collaboration limit reached */}
          {activeUsers.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{activeUsers.length} active {activeUsers.length === 1 ? 'user' : 'users'}</span>
                  {collaboratorLimitReached && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600 ml-2">
                      <Crown className="h-3 w-3 mr-1" />
                      Limit reached
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {activeUsers.map((user) => (
                    <div key={user.userId} className="flex items-center gap-1">
                      <Avatar className="h-6 w-6" style={{ borderColor: user.color, borderWidth: 2 }}>
                        <AvatarFallback 
                          className="text-xs font-medium text-white"
                          style={{ backgroundColor: user.color }}
                        >
                          {getUserInitials(user.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{user.userName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardHeader>
      </Card>

      {/* Editor */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-0">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            placeholder="Start typing to begin collaborative editing..."
            className="min-h-full border-0 resize-none focus-visible:ring-0 rounded-none"
            style={{ minHeight: '500px' }}
          />
        </CardContent>
      </Card>

      {/* Version History Dialog - wrapped in feature gate */}
      {hasVersionControl ? (
        <FileVersionHistory
          documentId={documentId}
          fileName={fileName}
          isOpen={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          onVersionRestore={() => {
            // Refresh editor content after version restore
            window.location.reload();
          }}
        />
      ) : (
        showVersionHistory && (
          <FeatureGate
            feature="version_control"
            upgradeMessage="Version history and rollback capabilities require a Pro or Enterprise subscription."
          >
            <div />
          </FeatureGate>
        )
      )}
      {/* Show upgrade prompts if limits are reached */}
      {versionLimitReached && (
        <FeatureGate
          feature="version_control"
          upgradeMessage="You've reached the version limit for your current plan. Upgrade to create more versions."
        >
          <div />
        </FeatureGate>
      )}
    </div>
  );
};