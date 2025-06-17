import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Get environment variables with type safety
const getEnv = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'link-shortener/1.0.0',
    },
  },
});

// Helper function to handle errors
export const handleError = (error: unknown, context: string) => {
  console.error(`Error in ${context}:`, error);
  throw error;
};

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper function to sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

// Helper function to sign up with email and password
export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Helper function to create a new link
export const createLink = async (
  originalUrl: string,
  customSlug?: string,
  expiresAt?: Date | null,
  monetized: boolean = false
) => {
  const { data, error } = await supabase
    .rpc('create_link', {
      original_url: originalUrl,
      custom_slug: customSlug || null,
      expires_at: expiresAt?.toISOString() || null,
      monetized,
    });
  
  if (error) throw error;
  return data;
};

// Helper function to get user's links
export const getUserLinks = async () => {
  const { data, error } = await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Helper function to update link views
// This would be called when a link is accessed
export const trackLinkView = async (slug: string) => {
  const { data, error } = await supabase
    .rpc('increment_link_views', { link_slug: slug });
  
  if (error) throw error;
  return data;
};
