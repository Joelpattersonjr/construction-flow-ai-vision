import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CustomField, TeamMember } from '@/types/admin';

export const useUserDetailsModal = (
  member: TeamMember | null,
  isOpen: boolean,
  onRefresh?: () => void
) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
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

  const handleSave = async () => {
    if (!member) return;

    try {
      setLoading(true);
      
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

  return {
    isEditing,
    setIsEditing,
    customFields,
    customFieldValues,
    loading,
    editingName,
    setEditingName,
    editingJobTitle,
    setEditingJobTitle,
    handleSave,
    handleCustomFieldChange,
  };
};