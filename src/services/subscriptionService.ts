import { supabase } from '@/integrations/supabase/client';

export interface TrialInfo {
  is_trial: boolean;
  is_trial_active: boolean;
  trial_expired?: boolean;
  days_remaining: number;
  trial_ends_at?: string;
}

export interface SubscriptionInfo {
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'trial' | 'trial_expired' | 'cancelled' | 'expired';
  subscription_expires_at: string | null;
  subscription_features: {
    version_control: boolean;
    collaboration: boolean;
    advanced_analytics: boolean;
    time_tracking: boolean;
    scheduling: boolean;
  };
  limits: {
    max_versions_per_file: number;
    max_collaborators: number;
    version_history_days: number;
    max_projects: number;
    max_users: number;
    max_storage_gb: number;
    max_files_per_project: number;
    max_tasks_per_project: number;
  };
  usage: {
    current_projects: number;
    current_users: number;
    current_storage_bytes: number;
    current_storage_gb: number;
  };
  trial_info?: TrialInfo;
}

export interface SubscriptionPlan {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  price: string;
  features: string[];
  limits: {
    max_projects: number;
    max_users: number;
    max_storage_gb: number;
    max_files_per_project: number;
    max_tasks_per_project: number;
    max_versions_per_file: number;
    max_collaborators: number;
    version_history_days: number;
  };
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 'Free',
    features: [
      '3 Projects',
      '5 Team Members',
      '1 GB Storage',
      '100 Files per Project',
      '50 Tasks per Project',
      '5 File Versions',
      'Basic Support'
    ],
    limits: {
      max_projects: 3,
      max_users: 5,
      max_storage_gb: 1,
      max_files_per_project: 100,
      max_tasks_per_project: 50,
      max_versions_per_file: 5,
      max_collaborators: 5,
      version_history_days: 90,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29.99/month',
    features: [
      '25 Projects',
      '25 Team Members',
      '10 GB Storage',
      '1,000 Files per Project',
      '500 Tasks per Project',
      '50 File Versions',
      'Real-time Collaboration',
      'Advanced Analytics',
      'Priority Support'
    ],
    limits: {
      max_projects: 25,
      max_users: 25,
      max_storage_gb: 10,
      max_files_per_project: 1000,
      max_tasks_per_project: 500,
      max_versions_per_file: 50,
      max_collaborators: 10,
      version_history_days: 365,
    },
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom pricing',
    features: [
      'Unlimited Projects',
      'Unlimited Team Members',
      'Unlimited Storage',
      'Unlimited Files & Tasks',
      'Unlimited File Versions',
      'Advanced Security',
      'Custom Integrations',
      'Dedicated Support',
      'SLA Guarantee'
    ],
    limits: {
      max_projects: -1,
      max_users: -1,
      max_storage_gb: -1,
      max_files_per_project: -1,
      max_tasks_per_project: -1,
      max_versions_per_file: -1,
      max_collaborators: -1,
      version_history_days: -1,
    },
  },
];

export class SubscriptionService {
  static async getCurrentSubscription(): Promise<SubscriptionInfo | null> {
    try {
      // Get subscription info via check-subscription function which includes trial logic
      const { data: subscriptionData, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      const { data: limitsData } = await supabase.rpc('get_subscription_limits');
      const { data: usageData } = await supabase.rpc('get_usage_stats');
      
      // Get detailed subscription info from companies table
      const { data: companyData } = await supabase
        .from('companies')
        .select('subscription_tier, subscription_status, subscription_expires_at, subscription_features')
        .eq('id', await this.getCurrentCompanyId())
        .single();

      if (!companyData) return null;

      return {
        subscription_tier: (companyData.subscription_tier as 'free' | 'pro' | 'enterprise') || 'free',
        subscription_status: (companyData.subscription_status as 'active' | 'trial' | 'trial_expired' | 'cancelled' | 'expired') || 'active',
        subscription_expires_at: companyData.subscription_expires_at,
        subscription_features: (companyData.subscription_features as any) || {
          version_control: false,
          collaboration: false,
          advanced_analytics: false,
          time_tracking: false,
          scheduling: false,
        },
        limits: (limitsData as any) || {
          max_versions_per_file: 5,
          max_collaborators: 5,
          version_history_days: 90,
          max_projects: 3,
          max_users: 5,
          max_storage_gb: 1,
          max_files_per_project: 100,
          max_tasks_per_project: 50,
        },
        usage: (usageData as any) || {
          current_projects: 0,
          current_users: 0,
          current_storage_bytes: 0,
          current_storage_gb: 0,
        },
        trial_info: subscriptionData?.trial_info || {
          is_trial: false,
          is_trial_active: false,
          trial_expired: false,
          days_remaining: 0
        }
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  static async hasFeature(featureName: string): Promise<boolean> {
    try {
      const { data } = await supabase.rpc('has_subscription_feature', { 
        feature_name: featureName 
      });
      return data || false;
    } catch (error) {
      console.error('Error checking feature:', error);
      return false;
    }
  }

  static async checkVersionLimit(documentId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    try {
      const subscription = await this.getCurrentSubscription();
      if (!subscription) {
        return { allowed: false, current: 0, limit: 5 };
      }

      const { data: versionCount } = await supabase
        .from('file_versions')
        .select('id', { count: 'exact' })
        .eq('document_id', parseInt(documentId));

      const current = versionCount?.length || 0;
      const limit = subscription.limits.max_versions_per_file;
      
      // -1 means unlimited
      const allowed = limit === -1 || current < limit;

      return { allowed, current, limit };
    } catch (error) {
      console.error('Error checking version limit:', error);
      return { allowed: false, current: 0, limit: 5 };
    }
  }

  static async checkCollaboratorLimit(documentId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    try {
      const subscription = await this.getCurrentSubscription();
      if (!subscription) {
        return { allowed: false, current: 0, limit: 2 };
      }

      const { data: collaboratorCount } = await supabase
        .from('file_collaborators')
        .select('id', { count: 'exact' })
        .eq('document_id', parseInt(documentId));

      const current = collaboratorCount?.length || 0;
      const limit = subscription.limits.max_collaborators;
      
      // -1 means unlimited
      const allowed = limit === -1 || current < limit;

      return { allowed, current, limit };
    } catch (error) {
      console.error('Error checking collaborator limit:', error);
      return { allowed: false, current: 0, limit: 2 };
    }
  }

  static async checkProjectLimit(): Promise<{ allowed: boolean; current: number; limit: number }> {
    try {
      const { data, error } = await supabase.rpc('can_create_project');
      if (error) throw error;

      const subscription = await this.getCurrentSubscription();
      const limit = subscription?.limits.max_projects || 0;
      const current = subscription?.usage.current_projects || 0;

      return {
        allowed: data,
        current,
        limit
      };
    } catch (error) {
      console.error('Error checking project limit:', error);
      return { allowed: false, current: 0, limit: 0 };
    }
  }

  static async checkUserLimit(): Promise<{ allowed: boolean; current: number; limit: number }> {
    try {
      const { data, error } = await supabase.rpc('can_add_user');
      if (error) throw error;

      const subscription = await this.getCurrentSubscription();
      const limit = subscription?.limits.max_users || 0;
      const current = subscription?.usage.current_users || 0;

      return {
        allowed: data,
        current,
        limit
      };
    } catch (error) {
      console.error('Error checking user limit:', error);
      return { allowed: false, current: 0, limit: 0 };
    }
  }

  static async checkStorageLimit(): Promise<{ allowed: boolean; current: number; limit: number }> {
    try {
      const subscription = await this.getCurrentSubscription();
      const limitGb = subscription?.limits.max_storage_gb || 0;
      const currentGb = subscription?.usage.current_storage_gb || 0;

      return {
        allowed: limitGb === -1 || currentGb < limitGb,
        current: currentGb,
        limit: limitGb
      };
    } catch (error) {
      console.error('Error checking storage limit:', error);
      return { allowed: false, current: 0, limit: 0 };
    }
  }

  static async upgradeSubscription(newTier: 'pro' | 'enterprise'): Promise<{ success: boolean; error?: string }> {
    try {
      // Enterprise plan is handled via contact sales dialog
      if (newTier === 'enterprise') {
        return { success: true };
      }
      
      // Create checkout session for paid plans
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: newTier }
      });

      if (error) {
        return { success: false, error: 'Failed to create checkout session' };
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        return { success: true };
      }

      return { success: false, error: 'No checkout URL received' };
    } catch (error) {
      return { success: false, error: 'Failed to upgrade subscription' };
    }
  }

  private static async getCurrentCompanyId(): Promise<number | null> {
    try {
      const { data } = await supabase.rpc('current_user_company_id');
      return data;
    } catch (error) {
      console.error('Error getting company ID:', error);
      return null;
    }
  }

  static getPlanByTier(tier: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === tier);
  }

  static getFeatureDescription(featureName: string): string {
    const descriptions: Record<string, string> = {
      version_control: 'Advanced version control with unlimited history and rollback capabilities',
      collaboration: 'Real-time collaborative editing with live cursors and presence',
      advanced_analytics: 'Detailed analytics and reporting on file usage and team activity',
      time_tracking: 'Advanced time tracking and reporting with detailed analytics',
      scheduling: 'Advanced scheduling with time slot management, drag & drop, and team scheduling capabilities',
    };
    return descriptions[featureName] || featureName;
  }
}