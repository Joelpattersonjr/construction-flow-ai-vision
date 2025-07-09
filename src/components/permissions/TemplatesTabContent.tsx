import React from 'react';
import CustomRoleBuilder from './CustomRoleBuilder';
import PermissionTemplatesTable from './PermissionTemplatesTable';

interface TemplatesTabContentProps {
  canManage: boolean;
  customRoles: any[];
  onRoleCreated: (role: any) => void;
  onRoleUpdated: (role: any) => void;
}

const TemplatesTabContent: React.FC<TemplatesTabContentProps> = ({
  canManage,
  customRoles,
  onRoleCreated,
  onRoleUpdated,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Permission Templates</h3>
          <p className="text-sm text-gray-500">Create and manage permission templates for consistent role assignments</p>
        </div>
        {canManage && (
          <CustomRoleBuilder
            onRoleCreated={onRoleCreated}
            onRoleUpdated={onRoleUpdated}
            existingRoles={customRoles}
          />
        )}
      </div>
      <PermissionTemplatesTable 
        canManage={canManage}
      />
    </div>
  );
};

export default TemplatesTabContent;