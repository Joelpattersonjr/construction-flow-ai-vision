import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CustomField } from '@/types/admin';

export const useCustomFields = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.company_id) {
      fetchCustomFields();
    }
  }, [profile?.company_id]);

  const fetchCustomFields = async () => {
    try {
      setLoading(true);
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
      toast({
        title: "Error",
        description: "Failed to load custom fields",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addField = async (fieldData: {
    fieldName: string;
    fieldLabel: string;
    fieldType: string;
    fieldOptions: string;
    isRequired: boolean;
  }) => {
    if (!fieldData.fieldName || !fieldData.fieldLabel || !profile?.company_id) return false;

    try {
      const optionsArray = fieldData.fieldType === 'select' 
        ? fieldData.fieldOptions.split(',').map(o => o.trim()).filter(o => o) 
        : [];
      
      const { error } = await supabase
        .from('company_custom_fields')
        .insert({
          company_id: profile.company_id,
          field_name: fieldData.fieldName.toLowerCase().replace(/\s+/g, '_'),
          field_label: fieldData.fieldLabel,
          field_type: fieldData.fieldType,
          field_options: optionsArray,
          is_required: fieldData.isRequired,
          display_order: customFields.length
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Custom field added successfully",
      });

      await fetchCustomFields();
      return true;
    } catch (error) {
      console.error('Error adding custom field:', error);
      toast({
        title: "Error",
        description: "Failed to add custom field",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteField = async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from('company_custom_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Custom field deleted successfully",
      });

      await fetchCustomFields();
      return true;
    } catch (error) {
      console.error('Error deleting custom field:', error);
      toast({
        title: "Error",
        description: "Failed to delete custom field",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    customFields,
    loading,
    addField,
    deleteField,
    refreshFields: fetchCustomFields,
  };
};