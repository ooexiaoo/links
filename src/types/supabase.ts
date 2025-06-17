export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      links: {
        Row: {
          id: string
          user_id: string
          original_url: string
          slug: string
          title: string | null
          created_at: string
          updated_at: string | null
          expires_at: string | null
          is_active: boolean
          is_monetized: boolean
          clicks_count: number | null
          last_clicked_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          original_url: string
          slug: string
          title?: string | null
          created_at?: string
          updated_at?: string | null
          expires_at?: string | null
          is_active?: boolean
          is_monetized?: boolean
          clicks_count?: number | null
          last_clicked_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          original_url?: string
          slug?: string
          title?: string | null
          created_at?: string
          updated_at?: string | null
          expires_at?: string | null
          is_active?: boolean
          is_monetized?: boolean
          clicks_count?: number | null
          last_clicked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "links_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          is_premium: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          is_premium?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          is_premium?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      link_analytics: {
        Row: {
          id: string
          link_id: string
          clicked_at: string
          ip_address: string | null
          country: string | null
          device_type: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          link_id: string
          clicked_at?: string
          ip_address?: string | null
          country?: string | null
          device_type?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          link_id?: string
          clicked_at?: string
          ip_address?: string | null
          country?: string | null
          device_type?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_analytics_link_id_fkey"
            columns: ["link_id"]
            referencedRelation: "links"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_link: {
        Args: {
          original_url: string
          custom_slug?: string
          title?: string | null
          expires_at?: string | null
          is_monetized?: boolean
        }
        Returns: Json
      }
      track_link_click: {
        Args: {
          link_id: string
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          country?: string | null
          device_type?: string | null
        }
        Returns: undefined
      }
      get_link_analytics: {
        Args: {
          p_link_id: string
          p_time_range?: string
        }
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

export interface Link extends Database['public']['Tables']['links']['Row'] {
  clicks?: number;
  analytics?: {
    totalClicks: number;
    clicksByDay: Array<{ date: string; count: number }>;
    clicksByCountry: Array<{ country: string; count: number }>;
    clicksByDevice: Array<{ device: string; count: number }>;
    clicksByReferrer: Array<{ referrer: string; count: number }>;
  };
}
export type LinkAnalytics = Database['public']['Tables']['link_analytics']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

// Analytics related types
export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all'

export type AnalyticsData = {
  totalClicks: number
  clicksByDay: { date: string; count: number }[]
  clicksByCountry: { country: string; count: number }[]
  clicksByDevice: { device: string; count: number }[]
  clicksByReferrer: { referrer: string; count: number }[]
}
