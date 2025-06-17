import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, options?: { data?: Record<string, any> }) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ data: any; error: any }>;
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<{ data: any; error: any }>;
  updateUser: (attributes: { email?: string; password?: string; data?: Record<string, any> }) => Promise<{ data: any; error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and set the user
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, options?: { data?: Record<string, any> }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: options?.data,
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    return { data, error };
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Send password reset email
  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  };

  // Reset password with token
  const resetPasswordWithToken = async (_token: string, newPassword: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { data, error };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Update user data
  const updateUser = async (attributes: { email?: string; password?: string; data?: Record<string, any> }) => {
    const { data, error } = await supabase.auth.updateUser(attributes);
    return { data, error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resetPasswordWithToken,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
