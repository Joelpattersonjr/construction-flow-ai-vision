
import { User, Session } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, jobTitle?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  clearAuthState: () => Promise<void>;
}

export interface Company {
  id: number;
  name: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  job_title: string | null;
  company_id: number | null;
  company_role: string | null;
  updated_at: string;
  company?: Company | null;
}
