import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Crown, User, Mail, Briefcase, Calendar, Building2, Edit, Save, X } from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  job_title: string;
  company_role: 'company_admin' | 'company_member';
  updated_at: string;
  custom_fields?: Record<string, any>;
}

interface CustomField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  field_options: string[];
  is_required: boolean;
}

interface UserDetailsModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onRefresh?: () => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  member,
  isOpen,
  onClose,
  userEmail,
  onRefresh
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  
  // Editable standard fields
  const [editingName, setEditingName] = useState('');
  const [editingJobTitle, setEditingJobTitle] = useState('');

  useEffect(() => {
    if (member && isOpen && profile?.company_id) {
      fetchCustomFields();
      setCustomFieldValues(member.custom_fields || {});
      setEditingName(member.full_name || '');
      setEditingJobTitle(member.job_title || '');
    }
  }, [member, isOpen, profile?.company_id]);

  const fetchCustomFields = async () => {
    try {
      const { data, error } = await supabase
        .from('company_custom_fields')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('display_order');

      if (error) throw error;
      // Transform the data to match our interface
      const transformedData = (data || []).map(field => ({
        ...field,
        field_options: Array.isArray(field.field_options) 
          ? field.field_options.filter((opt): opt is string => typeof opt === 'string')
          : []
      })) as CustomField[];
      setCustomFields(transformedData);
    } catch (error) {
      console.error('Error fetching custom fields:', error);
    }
  };

  const handleSaveCustomFields = async () => {
    if (!member) return;

    try {
      setLoading(true);
      
      // Update both standard fields and custom fields
      const updates: any = {
        custom_fields: customFieldValues
      };
      
      if (editingName !== member.full_name) {
        updates.full_name = editingName;
      }
      
      if (editingJobTitle !== member.job_title) {
        updates.job_title = editingJobTitle;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', member.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setIsEditing(false);
      onRefresh?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderCustomField = (field: CustomField) => {
    const value = customFieldValues[field.field_name] || '';

    if (!isEditing) {
      return (
        <div key={field.id} className="flex items-start space-x-3">
          <Briefcase className="h-4 w-4 text-muted-foreground mt-1" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">{field.field_label}</p>
            <p className="text-sm">{value || 'Not provided'}</p>
          </div>
        </div>
      );
    }

    switch (field.field_type) {
      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {field.field_label} {field.is_required && '*'}
            </label>
            <Select value={value} onValueChange={(val) => handleCustomFieldChange(field.field_name, val)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.field_label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.field_options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {field.field_label} {field.is_required && '*'}
            </label>
            <Textarea
              value={value}
              onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
              placeholder={`Enter ${field.field_label.toLowerCase()}`}
            />
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {field.field_label} {field.is_required && '*'}
            </label>
            <Input
              type={field.field_type}
              value={value}
              onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
              placeholder={`Enter ${field.field_label.toLowerCase()}`}
            />
          </div>
        );
    }
  };

  if (!member) return null;

  const getRoleBadge = (role: string) => {
    return role === 'company_admin' ? (
      <Badge variant="default" className="flex items-center space-x-1">
        <Crown className="h-3 w-3" />
        <span>Company Admin</span>
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center space-x-1">
        <User className="h-3 w-3" />
        <span>Team Member</span>
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Team Member Details</span>
            </DialogTitle>
            {profile?.company_role === 'company_admin' && (
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSaveCustomFields} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with name and role */}
          <div className="text-center space-y-2">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="Enter full name"
                  className="text-center text-lg font-semibold"
                />
              </div>
            ) : (
              <h3 className="text-lg font-semibold">
                {member.full_name || 'No name provided'}
              </h3>
            )}
            {getRoleBadge(member.company_role)}
          </div>

          {/* Standard Details */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{userEmail || 'Not available'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Briefcase className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Job Title</p>
                {isEditing ? (
                  <Input
                    value={editingJobTitle}
                    onChange={(e) => setEditingJobTitle(e.target.value)}
                    placeholder="Enter job title"
                    className="text-sm mt-1"
                  />
                ) : (
                  <p className="text-sm">{member.job_title || 'No title specified'}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Company Role</p>
                <p className="text-sm capitalize">
                  {member.company_role === 'company_admin' ? 'Company Administrator' : 'Team Member'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p className="text-sm">
                  {new Date(member.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          {(customFields.length > 0 || isEditing) && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-4">Additional Information</h4>
              <div className="space-y-4">
                {customFields.map(renderCustomField)}
              </div>
            </div>
          )}

          {customFields.length === 0 && !isEditing && (
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground text-center">
                No custom fields configured. Company admins can add custom fields in the admin panel.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};