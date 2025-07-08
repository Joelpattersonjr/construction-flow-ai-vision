
import { User, Session } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, companyName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  clearAuthState: () => Promise<void>;
}

export interface Profile {
  id: string;
  full_name: string | null;
  company_name: string | null;
  job_title: string | null;
  company_id: number | null;
  updated_at: string;
}
