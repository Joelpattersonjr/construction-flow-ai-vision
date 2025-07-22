import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Progress } from "@/components/ui/progress";
import { Upload, MapPin, PenTool, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: any;
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'contains';
  };
  calculation?: {
    formula: string;
    fields: string[];
  };
}

interface FormSchema {
  fields: FormField[];
  pages?: FormField[][];
  styling?: any;
}

interface FormRendererProps {
  formTemplate: {
    id: string;
    name: string;
    description?: string;
    form_schema: FormSchema;
    category: string;
  };
  projectId?: string;
  onSubmit: (data: any) => void;
  onSaveDraft?: (data: any) => void;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  formTemplate,
  projectId,
  onSubmit,
  onSaveDraft,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [signatures, setSignatures] = useState<{ [key: string]: string }>({});
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File[] }>({});

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm();

  const watchedValues = watch();
  const schema = formTemplate.form_schema;
  const isMultiPage = schema.pages && schema.pages.length > 1;
  const currentFields = isMultiPage ? schema.pages![currentPage] : schema.fields;

  // Check if field should be visible based on conditional logic
  const isFieldVisible = (field: FormField) => {
    if (!field.conditional) return true;

    const watchedValue = watchedValues[field.conditional.field];
    const conditionValue = field.conditional.value;

    switch (field.conditional.operator) {
      case 'equals':
        return watchedValue === conditionValue;
      case 'not_equals':
        return watchedValue !== conditionValue;
      case 'contains':
        return String(watchedValue).includes(String(conditionValue));
      default:
        return true;
    }
  };

  // Calculate field values based on formulas
  const calculateFieldValue = (field: FormField) => {
    if (!field.calculation) return undefined;

    try {
      let formula = field.calculation.formula;
      field.calculation.fields.forEach(fieldId => {
        const value = Number(watchedValues[fieldId]) || 0;
        formula = formula.replace(`{${fieldId}}`, value.toString());
      });

      // Simple formula evaluation (for basic math operations)
      const result = eval(formula);
      return isNaN(result) ? 0 : result;
    } catch (error) {
      console.error('Formula calculation error:', error);
      return 0;
    }
  };

  const captureSignature = (fieldId: string) => {
    // Simple signature capture simulation
    const signature = prompt('Enter signature text (in a real app, this would open a signature pad):');
    if (signature) {
      setSignatures(prev => ({ ...prev, [fieldId]: signature }));
      setValue(fieldId, signature);
    }
  };

  const captureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(loc);
          toast.success('Location captured successfully');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Failed to capture location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser');
    }
  };

  const handleFileUpload = (fieldId: string, files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setUploadedFiles(prev => ({ ...prev, [fieldId]: fileArray }));
      setValue(fieldId, fileArray);
    }
  };

  const renderField = (field: FormField) => {
    if (!isFieldVisible(field)) return null;

    const calculatedValue = calculateFieldValue(field);
    if (calculatedValue !== undefined) {
      setValue(field.id, calculatedValue);
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              rules={{ required: field.required ? `${field.label} is required` : false }}
              render={({ field: formField }) => (
                <Input
                  {...formField}
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  className={errors[field.id] ? 'border-destructive' : ''}
                />
              )}
            />
            {errors[field.id] && (
              <p className="text-sm text-destructive">{errors[field.id]?.message as string}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              rules={{ required: field.required ? `${field.label} is required` : false }}
              render={({ field: formField }) => (
                <Textarea
                  {...formField}
                  id={field.id}
                  placeholder={field.placeholder}
                  className={errors[field.id] ? 'border-destructive' : ''}
                />
              )}
            />
            {errors[field.id] && (
              <p className="text-sm text-destructive">{errors[field.id]?.message as string}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              rules={{ required: field.required ? `${field.label} is required` : false }}
              render={({ field: formField }) => (
                <Input
                  {...formField}
                  id={field.id}
                  type="number"
                  placeholder={field.placeholder}
                  className={errors[field.id] ? 'border-destructive' : ''}
                  value={calculatedValue !== undefined ? calculatedValue : formField.value}
                  readOnly={calculatedValue !== undefined}
                />
              )}
            />
            {errors[field.id] && (
              <p className="text-sm text-destructive">{errors[field.id]?.message as string}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              rules={{ required: field.required ? `${field.label} is required` : false }}
              render={({ field: formField }) => (
                <Select onValueChange={formField.onChange} value={formField.value}>
                  <SelectTrigger className={errors[field.id] ? 'border-destructive' : ''}>
                    <SelectValue placeholder={field.placeholder || 'Select an option'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors[field.id] && (
              <p className="text-sm text-destructive">{errors[field.id]?.message as string}</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              rules={{ required: field.required ? `${field.label} is required` : false }}
              render={({ field: formField }) => (
                <RadioGroup onValueChange={formField.onChange} value={formField.value}>
                  {field.options?.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                      <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
            {errors[field.id] && (
              <p className="text-sm text-destructive">{errors[field.id]?.message as string}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Controller
                    name={`${field.id}.${option.value}`}
                    control={control}
                    render={({ field: formField }) => (
                      <Checkbox
                        id={`${field.id}-${option.value}`}
                        checked={formField.value}
                        onCheckedChange={formField.onChange}
                      />
                    )}
                  />
                  <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Controller
              name={field.id}
              control={control}
              rules={{ required: field.required ? `${field.label} is required` : false }}
              render={({ field: formField }) => (
                <DatePicker
                  date={formField.value}
                  onSelect={formField.onChange}
                />
              )}
            />
            {errors[field.id] && (
              <p className="text-sm text-destructive">{errors[field.id]?.message as string}</p>
            )}
          </div>
        );

      case 'file_upload':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <Label htmlFor={field.id} className="cursor-pointer">
                <span className="text-sm text-primary hover:underline">
                  Click to upload files
                </span>
                <Input
                  id={field.id}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(field.id, e.target.files)}
                />
              </Label>
              {uploadedFiles[field.id] && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {uploadedFiles[field.id].length} file(s) selected
                </div>
              )}
            </div>
          </div>
        );

      case 'signature':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <div className="border rounded-lg p-4 text-center">
              {signatures[field.id] ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Signature: {signatures[field.id]}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => captureSignature(field.id)}
                  >
                    Update Signature
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => captureSignature(field.id)}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Add Signature
                </Button>
              )}
            </div>
          </div>
        );

      case 'geolocation':
        return (
          <div key={field.id} className="space-y-2">
            <Label>{field.label}</Label>
            <div className="border rounded-lg p-4">
              {location ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={captureLocation}
                  >
                    Update Location
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={captureLocation}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Capture Location
                </Button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const nextPage = () => {
    if (isMultiPage && currentPage < schema.pages!.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const submitForm = async (data: any) => {
    const submissionData = {
      ...data,
      signatures,
      geolocation: location,
      attachments: uploadedFiles,
    };

    try {
      const { error } = await supabase
        .from('form_submissions')
        .insert({
          form_template_id: formTemplate.id,
          project_id: projectId,
          submission_data: submissionData,
          submitted_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      toast.success('Form submitted successfully!');
      onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form');
    }
  };

  const saveDraft = async (data: any) => {
    if (onSaveDraft) {
      const draftData = {
        ...data,
        signatures,
        geolocation: location,
        attachments: uploadedFiles,
      };
      onSaveDraft(draftData);
      toast.success('Draft saved successfully!');
    }
  };

  const progress = isMultiPage ? ((currentPage + 1) / schema.pages!.length) * 100 : 100;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{formTemplate.name}</CardTitle>
        {formTemplate.description && (
          <p className="text-muted-foreground">{formTemplate.description}</p>
        )}
        {isMultiPage && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Page {currentPage + 1} of {schema.pages!.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submitForm)} className="space-y-6">
          <div className="space-y-4">
            {currentFields.map(renderField)}
          </div>

          <div className="flex justify-between pt-6">
            <div className="flex gap-2">
              {currentPage > 0 && (
                <Button type="button" variant="outline" onClick={prevPage}>
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {onSaveDraft && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSubmit(saveDraft)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
              )}

              {isMultiPage && currentPage < schema.pages!.length - 1 ? (
                <Button type="button" onClick={nextPage}>
                  Next
                </Button>
              ) : (
                <Button type="submit">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Form
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};