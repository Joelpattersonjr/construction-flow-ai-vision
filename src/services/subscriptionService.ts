import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionInfo {
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'cancelled' | 'expired';
  subscription_expires_at: string | null;
  subscription_features: {
    version_control: boolean;
    collaboration: boolean;
    advanced_analytics: boolean;
    time_tracking: boolean;
  };
  limits: {
    max_versions_per_file: number;
    max_collaborators: number;
    version_history_days: number;
  };
}

export interface SubscriptionPlan {
  id: 'free' | 'pro' | 'enterprise';
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
    id: 'free',
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
    id: 'pro',
    name: 'Premium',
    price: '$99.99/month',
    features: [
      'Advanced version control',
      'Real-time collaboration',
      'Up to 50 versions per file',
      '10 collaborators max',
      '1 year version history',
      'Advanced analytics',
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
    id: 'enterprise',
    name: 'Enterprise',
    price: '$399.99/month',
    features: [
      'Unlimited version control',
      'Unlimited collaboration',
      'Unlimited versions per file',
      'Unlimited collaborators',
      'Unlimited version history',
      'Advanced time tracking & reporting',
      'Advanced analytics & reporting',
      'Custom integrations',
      'Dedicated support',
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
      const { data: tierData } = await supabase.rpc('get_user_subscription_tier');
      const { data: limitsData } = await supabase.rpc('get_subscription_limits');
      
      // Get detailed subscription info
      const { data: companyData } = await supabase
        .from('companies')
        .select('subscription_tier, subscription_status, subscription_expires_at, subscription_features')
        .eq('id', await this.getCurrentCompanyId())
        .single();

      if (!companyData) return null;

      return {
        subscription_tier: (companyData.subscription_tier as 'free' | 'pro' | 'enterprise') || 'free',
        subscription_status: (companyData.subscription_status as 'active' | 'cancelled' | 'expired') || 'active',
        subscription_expires_at: companyData.subscription_expires_at,
        subscription_features: (companyData.subscription_features as any) || {
          version_control: false,
          collaboration: false,
          advanced_analytics: false,
          time_tracking: false,
        },
        limits: (limitsData as any) || {
          max_versions_per_file: 5,
          max_collaborators: 2,
          version_history_days: 30,
        },
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

  static async upgradeSubscription(newTier: 'pro' | 'enterprise'): Promise<{ success: boolean; error?: string }> {
    try {
      const companyId = await this.getCurrentCompanyId();
      if (!companyId) {
        return { success: false, error: 'Company not found' };
      }

      const features = {
        version_control: true,
        collaboration: true,
        advanced_analytics: true,
        time_tracking: newTier === 'enterprise',
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
    };
    return descriptions[featureName] || featureName;
  }
}