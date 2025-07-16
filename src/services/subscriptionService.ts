import { supabase } from '@/integrations/supabase/client';

export interface TrialInfo {
  is_trial: boolean;
  is_trial_active: boolean;
  trial_expired?: boolean;
  days_remaining: number;
  trial_ends_at?: string;
}

export interface SubscriptionInfo {
  subscription_tier: 'trial' | 'basic' | 'premium' | 'professional' | 'enterprise';
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
  };
  trial_info?: TrialInfo;
}

export interface SubscriptionPlan {
  id: 'trial' | 'basic' | 'premium' | 'professional' | 'enterprise';
  name: string;
  price: string;
  features: string[];
  limits: {
    max_versions_per_file: number;
    max_collaborators: number;
    version_history_days: number;
  };
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'trial',
    name: 'Trial',
    price: 'Free for 30 days',
    features: [
      'Full version control access',
      'Team collaboration (up to 10 collaborators)',
      'Real-time editing',
      '30 days version history',
      'All premium features',
      'Standard Support',
    ],
    limits: {
      max_versions_per_file: 50,
      max_collaborators: 10,
      version_history_days: 30,
    },
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$69.99/month',
    features: [
      'File Management & Storage',
      'Version Control (5 versions per file)',
      'Team Collaboration (up to 5 collaborators)',
      '90 days version history',
      'Basic File Sharing',
      'Standard Support',
    ],
    limits: {
      max_versions_per_file: 5,
      max_collaborators: 5,
      version_history_days: 90,
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$199.99/month',
    features: [
      'Advanced version control',
      'Real-time collaboration',
      'Up to 50 versions per file',
      '10 collaborators max',
      '1 year version history',
      'Advanced analytics',
      'Time tracking',
      'Scheduling features',
      'Priority support',
    ],
    limits: {
      max_versions_per_file: 50,
      max_collaborators: 10,
      version_history_days: 365,
    },
    popular: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$399.99/month',
    features: [
      'Everything in Premium',
      'Up to 100 versions per file',
      '25 collaborators max',
      '2 years version history',
      'Advanced time tracking & reporting',
      'Advanced scheduling',
      'Custom integrations',
      'Priority support',
    ],
    limits: {
      max_versions_per_file: 100,
      max_collaborators: 25,
      version_history_days: 730,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$499.99/month',
    features: [
      'Everything in Professional',
      'Unlimited version control',
      'Unlimited collaboration',
      'Unlimited versions per file',
      'Unlimited collaborators',
      'Unlimited version history',
      'Advanced analytics & reporting',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
    ],
    limits: {
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
      
      
      // Get detailed subscription info from companies table
      const { data: companyData } = await supabase
        .from('companies')
        .select('subscription_tier, subscription_status, subscription_expires_at, subscription_features')
        .eq('id', await this.getCurrentCompanyId())
        .single();

      if (!companyData) return null;

      return {
        subscription_tier: (companyData.subscription_tier as 'trial' | 'basic' | 'premium' | 'professional' | 'enterprise') || 'basic',
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
          max_collaborators: 2,
          version_history_days: 30,
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

  static async upgradeSubscription(newTier: 'basic' | 'premium' | 'professional' | 'enterprise'): Promise<{ success: boolean; error?: string }> {
    try {
      const companyId = await this.getCurrentCompanyId();
      if (!companyId) {
        return { success: false, error: 'Company not found' };
      }

      const features = {
        version_control: newTier !== 'basic',
        collaboration: true,
        advanced_analytics: newTier === 'premium' || newTier === 'professional' || newTier === 'enterprise',
        time_tracking: newTier === 'premium' || newTier === 'professional' || newTier === 'enterprise',
        scheduling: newTier === 'premium' || newTier === 'professional' || newTier === 'enterprise',
      };

      const { error } = await supabase
        .from('companies')
        .update({
          subscription_tier: newTier,
          subscription_status: 'active',
          subscription_features: features,
          subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        })
        .eq('id', companyId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
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