import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Settings, Wifi, WifiOff } from 'lucide-react';
import AddMemberDialog from './AddMemberDialog';

interface ProjectPermissionsHeaderProps {
  projectName: string;
  isConnected: boolean;
  canManage: boolean;
  projectId: string;
  onMemberAdded: () => void;
}

const ProjectPermissionsHeader: React.FC<ProjectPermissionsHeaderProps> = ({
  projectName,
  isConnected,
  canManage,
  projectId,
  onMemberAdded,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Project Permissions
          </h1>
          <Badge 
            variant={isConnected ? "default" : "secondary"}
            className={`flex items-center gap-1 ${
              isConnected 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-yellow-100 text-yellow-800 border-yellow-200"
            }`}
          >
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? "Live" : "Offline"}
          </Badge>
        </div>
        <p className="text-gray-600 mt-2">
          Manage access and permissions for "{projectName}"
          {isConnected && (
            <span className="text-green-600 text-sm ml-2">
              • Updates will appear in real-time
            </span>
          )}
        </p>
      </div>
      
      {canManage && (
        <AddMemberDialog 
          projectId={projectId}
          onMemberAdded={onMemberAdded}
        />
      )}
    </div>
  );
};

export default ProjectPermissionsHeader;