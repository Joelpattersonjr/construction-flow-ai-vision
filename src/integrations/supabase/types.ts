export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_lockouts: {
        Row: {
          created_at: string
          email: string
          id: string
          locked_at: string
          lockout_count: number
          unlock_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          locked_at?: string
          lockout_count?: number
          unlock_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          locked_at?: string
          lockout_count?: number
          unlock_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_password_resets: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          temporary_password: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          temporary_password: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          temporary_password?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          project_id: string
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          project_id: string
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          project_id?: string
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_audit_log_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_log_target_user"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_log_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: number
          name: string | null
          owner_id: string | null
          subscription_expires_at: string | null
          subscription_features: Json | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
          owner_id?: string | null
          subscription_expires_at?: string | null
          subscription_features?: Json | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
          owner_id?: string | null
          subscription_expires_at?: string | null
          subscription_features?: Json | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_custom_fields: {
        Row: {
          company_id: number
          created_at: string
          display_order: number
          field_label: string
          field_name: string
          field_options: Json | null
          field_type: string
          id: string
          is_required: boolean
          updated_at: string
        }
        Insert: {
          company_id: number
          created_at?: string
          display_order?: number
          field_label: string
          field_name: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_required?: boolean
          updated_at?: string
        }
        Update: {
          company_id?: number
          created_at?: string
          display_order?: number
          field_label?: string
          field_name?: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_required?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_custom_fields_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_report_team_members: {
        Row: {
          created_at: string
          daily_report_id: string
          hours_worked: number | null
          id: string
          role_description: string | null
          tasks_completed: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_report_id: string
          hours_worked?: number | null
          id?: string
          role_description?: string | null
          tasks_completed?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          daily_report_id?: string
          hours_worked?: number | null
          id?: string
          role_description?: string | null
          tasks_completed?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_report_team_members_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          created_at: string
          created_by: string
          crew_count: number | null
          delays_issues: string | null
          equipment_status: string | null
          id: string
          materials_delivered: string | null
          overall_progress_percentage: number | null
          photos_taken: number | null
          progress_summary: string | null
          project_id: string
          report_date: string
          safety_incidents: number | null
          status: string | null
          temperature_high: number | null
          temperature_low: number | null
          updated_at: string
          visitors: string | null
          weather_conditions: string | null
          work_completed: string | null
          work_hours_end: string | null
          work_hours_start: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          crew_count?: number | null
          delays_issues?: string | null
          equipment_status?: string | null
          id?: string
          materials_delivered?: string | null
          overall_progress_percentage?: number | null
          photos_taken?: number | null
          progress_summary?: string | null
          project_id: string
          report_date: string
          safety_incidents?: number | null
          status?: string | null
          temperature_high?: number | null
          temperature_low?: number | null
          updated_at?: string
          visitors?: string | null
          weather_conditions?: string | null
          work_completed?: string | null
          work_hours_end?: string | null
          work_hours_start?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          crew_count?: number | null
          delays_issues?: string | null
          equipment_status?: string | null
          id?: string
          materials_delivered?: string | null
          overall_progress_percentage?: number | null
          photos_taken?: number | null
          progress_summary?: string | null
          project_id?: string
          report_date?: string
          safety_incidents?: number | null
          status?: string | null
          temperature_high?: number | null
          temperature_low?: number | null
          updated_at?: string
          visitors?: string | null
          weather_conditions?: string | null
          work_completed?: string | null
          work_hours_end?: string | null
          work_hours_start?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          content: string | null
          content_type: string | null
          created_at: string
          file_name: string | null
          file_size: number | null
          file_type: string | null
          id: number
          is_editable: boolean | null
          project_id: string | null
          storage_path: string | null
          uploader_id: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          content_type?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: number
          is_editable?: boolean | null
          project_id?: string | null
          storage_path?: string | null
          uploader_id?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          content_type?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: number
          is_editable?: boolean | null
          project_id?: string | null
          storage_path?: string | null
          uploader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      file_analytics: {
        Row: {
          action_type: string
          created_at: string
          file_id: number
          file_size: number | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          file_id: number
          file_size?: number | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          file_id?: number
          file_size?: number | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_analytics_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_analytics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      file_collaborators: {
        Row: {
          cursor_position: number | null
          document_id: number
          id: string
          last_activity: string
          selection_end: number | null
          selection_start: number | null
          user_color: string | null
          user_id: string
        }
        Insert: {
          cursor_position?: number | null
          document_id: number
          id?: string
          last_activity?: string
          selection_end?: number | null
          selection_start?: number | null
          user_color?: string | null
          user_id: string
        }
        Update: {
          cursor_position?: number | null
          document_id?: number
          id?: string
          last_activity?: string
          selection_end?: number | null
          selection_start?: number | null
          user_color?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_collaborators_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      file_locks: {
        Row: {
          document_id: number
          expires_at: string
          id: string
          locked_at: string
          session_data: Json | null
          user_id: string
        }
        Insert: {
          document_id: number
          expires_at?: string
          id?: string
          locked_at?: string
          session_data?: Json | null
          user_id: string
        }
        Update: {
          document_id?: number
          expires_at?: string
          id?: string
          locked_at?: string
          session_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_locks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      file_versions: {
        Row: {
          change_description: string | null
          content: string
          content_hash: string
          created_at: string
          created_by: string
          document_id: number
          file_size: number | null
          id: string
          version_number: number
        }
        Insert: {
          change_description?: string | null
          content: string
          content_hash: string
          created_at?: string
          created_by: string
          document_id: number
          file_size?: number | null
          id?: string
          version_number: number
        }
        Update: {
          change_description?: string | null
          content?: string
          content_hash?: string
          created_at?: string
          created_by?: string
          document_id?: number
          file_size?: number | null
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "file_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          answer: string
          category: string
          company_id: number | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          keywords: string[] | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          company_id?: number | null
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          company_id?: number | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      permission_templates: {
        Row: {
          company_id: number
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          permissions: Json
          role: string
          updated_at: string
        }
        Insert: {
          company_id: number
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          permissions?: Json
          role?: string
          updated_at?: string
        }
        Update: {
          company_id?: number
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          permissions?: Json
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_permission_templates_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_permission_templates_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: number | null
          company_role: string | null
          custom_fields: Json | null
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          preferences: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: number | null
          company_role?: string | null
          custom_fields?: Json | null
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          preferences?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: number | null
          company_role?: string | null
          custom_fields?: Json | null
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          preferences?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          id: number
          project_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members_enhanced: {
        Row: {
          created_at: string | null
          id: string
          permissions: Json | null
          project_id: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          project_id?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          permissions?: Json | null
          project_id?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_enhanced_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_enhanced_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_storage_stats: {
        Row: {
          id: string
          last_updated: string
          project_id: string
          total_files: number
          total_size_bytes: number
        }
        Insert: {
          id?: string
          last_updated?: string
          project_id: string
          total_files?: number
          total_size_bytes?: number
        }
        Update: {
          id?: string
          last_updated?: string
          project_id?: string
          total_files?: number
          total_size_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_storage_stats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          company_id: number | null
          created_at: string
          end_date: string | null
          id: string
          name: string | null
          owner_company: string | null
          owner_email: string | null
          owner_id: string | null
          owner_name: string | null
          owner_phone: string | null
          project_number: string | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          address?: string | null
          company_id?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string | null
          owner_company?: string | null
          owner_email?: string | null
          owner_id?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          project_number?: string | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          address?: string | null
          company_id?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string | null
          owner_company?: string | null
          owner_email?: string | null
          owner_id?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          project_number?: string | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_analytics: {
        Row: {
          actual_hours: number | null
          created_at: string | null
          date: string
          efficiency_score: number | null
          id: string
          scheduled_hours: number | null
          tasks_completed: number | null
          tasks_scheduled: number | null
          user_id: string
        }
        Insert: {
          actual_hours?: number | null
          created_at?: string | null
          date: string
          efficiency_score?: number | null
          id?: string
          scheduled_hours?: number | null
          tasks_completed?: number | null
          tasks_scheduled?: number | null
          user_id: string
        }
        Update: {
          actual_hours?: number | null
          created_at?: string | null
          date?: string
          efficiency_score?: number | null
          id?: string
          scheduled_hours?: number | null
          tasks_completed?: number | null
          tasks_scheduled?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activity: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          task_id: number
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: number
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_files: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          storage_path: string
          task_id: number
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path: string
          task_id: number
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path?: string
          task_id?: number
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_labels: {
        Row: {
          created_at: string | null
          id: string
          label_color: string | null
          label_name: string
          task_id: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          label_color?: string | null
          label_name: string
          task_id: number
        }
        Update: {
          created_at?: string | null
          id?: string
          label_color?: string | null
          label_name?: string
          task_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_labels_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_schedule_slots: {
        Row: {
          created_at: string | null
          date: string
          duration_minutes: number
          end_time: string
          id: string
          is_locked: boolean | null
          start_time: string
          task_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          duration_minutes: number
          end_time: string
          id?: string
          is_locked?: boolean | null
          start_time: string
          task_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          duration_minutes?: number
          end_time?: string
          id?: string
          is_locked?: boolean | null
          start_time?: string
          task_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_schedule_slots_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_schedule_slots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          company_id: number
          created_at: string
          created_by: string
          description: string | null
          description_template: string | null
          estimated_hours: number | null
          id: string
          name: string
          priority: string | null
          tags: Json | null
          title_template: string
          updated_at: string
        }
        Insert: {
          company_id: number
          created_at?: string
          created_by: string
          description?: string | null
          description_template?: string | null
          estimated_hours?: number | null
          id?: string
          name: string
          priority?: string | null
          tags?: Json | null
          title_template: string
          updated_at?: string
        }
        Update: {
          company_id?: number
          created_at?: string
          created_by?: string
          description?: string | null
          description_template?: string | null
          estimated_hours?: number | null
          id?: string
          name?: string
          priority?: string | null
          tags?: Json | null
          title_template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_time_entries: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number | null
          end_time: string | null
          id: string
          start_time: string
          task_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          start_time?: string
          task_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          start_time?: string
          task_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string | null
          created_by: string | null
          dependency_id: number | null
          description: string | null
          end_date: string | null
          id: number
          priority: string | null
          project_id: string | null
          start_date: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string | null
          created_by?: string | null
          dependency_id?: number | null
          description?: string | null
          end_date?: string | null
          id?: number
          priority?: string | null
          project_id?: string | null
          start_date?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          created_at?: string | null
          created_by?: string | null
          dependency_id?: number | null
          description?: string | null
          end_date?: string | null
          id?: number
          priority?: string | null
          project_id?: string | null
          start_date?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_assignee_id"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tasks_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_dependency_id_fkey"
            columns: ["dependency_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_schedule_templates: {
        Row: {
          break_duration_minutes: number | null
          company_id: number
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          work_hours_end: string | null
          work_hours_start: string | null
        }
        Insert: {
          break_duration_minutes?: number | null
          company_id: number
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          work_hours_end?: string | null
          work_hours_start?: string | null
        }
        Update: {
          break_duration_minutes?: number | null
          company_id?: number
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          work_hours_end?: string | null
          work_hours_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_schedule_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_schedule_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          company_id: number
          company_role: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          project_roles: Json | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: number
          company_role?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by: string
          project_roles?: Json | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: number
          company_role?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          project_roles?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_cache: {
        Row: {
          condition: string | null
          created_at: string
          humidity: number | null
          id: string
          last_updated: string
          project_id: string
          temperature_current: number | null
          temperature_high: number | null
          temperature_low: number | null
          weather_icon: string | null
          wind_speed: number | null
        }
        Insert: {
          condition?: string | null
          created_at?: string
          humidity?: number | null
          id?: string
          last_updated?: string
          project_id: string
          temperature_current?: number | null
          temperature_high?: number | null
          temperature_low?: number | null
          weather_icon?: string | null
          wind_speed?: number | null
        }
        Update: {
          condition?: string | null
          created_at?: string
          humidity?: number | null
          id?: string
          last_updated?: string
          project_id?: string
          temperature_current?: number | null
          temperature_high?: number | null
          temperature_low?: number | null
          weather_icon?: string | null
          wind_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      belongs_to_company: {
        Args: { company_id_param: number }
        Returns: boolean
      }
      calculate_lockout_duration: {
        Args: { lockout_count: number }
        Returns: unknown
      }
      calculate_schedule_efficiency: {
        Args: { p_user_id: string; p_date: string }
        Returns: number
      }
      can_add_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_create_project: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_schedule_overlap: {
        Args: {
          p_user_id: string
          p_date: string
          p_start_time: string
          p_end_time: string
          p_slot_id?: string
        }
        Returns: boolean
      }
      cleanup_expired_locks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_weather_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      current_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      current_user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      debug_policy_check: {
        Args: { user_id: string; project_company_id: number }
        Returns: boolean
      }
      debug_storage_path: {
        Args: { test_path: string; test_project_id: string }
        Returns: {
          path_input: string
          project_id_extracted: string
          folder_parts: string[]
          first_folder: string
          project_exists: boolean
          user_company_id: number
          project_company_id: number
          access_granted: boolean
        }[]
      }
      generate_temporary_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_company_name: {
        Args: { company_id_param: number }
        Returns: string
      }
      get_my_company_id: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_subscription_limits: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_trial_status: {
        Args: { company_id_param: number }
        Returns: Json
      }
      get_usage_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_company_from_jwt: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_subscription_tier: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      handle_failed_login: {
        Args: {
          user_email: string
          user_ip?: string
          user_agent_string?: string
        }
        Returns: Json
      }
      handle_successful_login: {
        Args: {
          user_email: string
          user_ip?: string
          user_agent_string?: string
        }
        Returns: undefined
      }
      has_subscription_feature: {
        Args: { feature_name: string }
        Returns: boolean
      }
      is_account_locked: {
        Args: { user_email: string }
        Returns: boolean
      }
      is_company_admin: {
        Args: { company_id_param: number }
        Returns: boolean
      }
      is_company_owner: {
        Args: { owner_id_param: string }
        Returns: boolean
      }
      is_user_company_admin: {
        Args: { user_id: string; company_id: number }
        Returns: boolean
      }
      validate_temporary_password: {
        Args: { temp_password: string; user_email: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
