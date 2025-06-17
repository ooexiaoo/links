import { supabase } from '@/lib/supabase';
import type { AnalyticsFilters, LinkAnalytics } from '@/types/analytics';

class AnalyticsService {
  // Check if user has premium features
  static async hasPremiumFeatures(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking premium status:', error);
      return false;
    }

    return data?.is_premium || false;
  }

  // Get analytics for a specific link
  static async getLinkAnalytics(
    linkId: string,
    filters: AnalyticsFilters = {}
  ): Promise<{
    data: LinkAnalytics[];
    count: number;
    isPremium: boolean;
  }> {
    const { startDate, endDate, groupBy } = filters;
    
    let query = supabase
      .from('link_analytics')
      .select('*', { count: 'exact' })
      .eq('link_id', linkId);

    if (startDate) {
      query = query.gte('clicked_at', startDate);
    }
    if (endDate) {
      query = query.lte('clicked_at', endDate);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    const isPremium = user ? await this.hasPremiumFeatures(user.id) : false;
    
    return {
      data: data || [],
      count: count || 0,
      isPremium,
    };
  }

  // Get summary data for a link
  static async getLinkSummary(linkId: string) {
    const { data, error } = await supabase
      .from('links')
      .select('clicks_count, last_clicked_at')
      .eq('id', linkId)
      .single();

    if (error) {
      console.error('Error fetching link summary:', error);
      return { totalClicks: 0, lastClickedAt: null };
    }

    return {
      totalClicks: data.clicks_count || 0,
      lastClickedAt: data.last_clicked_at,
    };
  }
  
  // Log a click event
  static async logClick(linkId: string, metadata: Partial<LinkAnalytics> = {}) {
    console.group('=== logClick Debug ===');
    console.log('1. Starting logClick for linkId:', linkId);
    console.log('Metadata:', metadata);
    
    try {
      // First, increment the click count
      console.log('2. Attempting to increment click count...');
      const rpcResponse = await supabase.rpc('increment_link_clicks', {
        link_id: linkId,
      });
      
      console.log('3. Raw RPC response:', rpcResponse);
      
      if (rpcResponse.error) {
        console.error('4. RPC Error:', rpcResponse.error);
        throw rpcResponse.error;
      }
      
      console.log('5. RPC Success. Data:', rpcResponse.data);
      
      // If we got here, the RPC call was successful
      const incrementData = rpcResponse.data;
      
      if (incrementData && typeof incrementData === 'object' && 'error' in incrementData) {
        const errorMsg = `6. RPC Function Error: ${incrementData.error}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('7. Successfully incremented click count. Now logging analytics...');
      
      // Then log the analytics data
      const analyticsResponse = await supabase
        .from('link_analytics')
        .insert([{
          link_id: linkId,
          ip_address: metadata.ip_address || null,
          country: metadata.country || null,
          device_type: metadata.device_type || null,
          user_agent: metadata.user_agent || null,
          referrer: metadata.referrer || null,
        }])
        .select();

      console.log('8. Analytics insert response:', analyticsResponse);
      
      if (analyticsResponse.error) {
        console.error('9. Analytics Insert Error:', analyticsResponse.error);
      } else {
        console.log('10. Successfully logged analytics:', analyticsResponse.data);
      }
      
      return {
        increment: rpcResponse.data,
        analytics: analyticsResponse.data
      };
    } catch (error) {
      console.error('Error in logClick:', error);
    }
  }
  
  // Get summary stats for a link
  static async getLinkSummary(linkId: string): Promise<{
    totalClicks: number;
    lastClickedAt: string | null;
  }> {
    // Get total clicks from the links table
    const { data: linkData, error: linkError } = await supabase
      .from('links')
      .select('clicks, updated_at')
      .eq('id', linkId)
      .single();
    
    if (linkError) {
      console.error('Error fetching link data:', linkError);
      throw linkError;
    }
    
    // Get the most recent click timestamp from analytics
    let lastClickedAt = null;
    
    try {
      const { data: lastClickData, error: analyticsError } = await supabase
        .from('link_analytics')
        .select('clicked_at')
        .eq('link_id', linkId)
        .order('clicked_at', { ascending: false })
        .limit(1);
      
      if (analyticsError) {
        console.error('Error fetching last click:', analyticsError);
      } else if (lastClickData && lastClickData.length > 0) {
        lastClickedAt = lastClickData[0].clicked_at;
      }
    } catch (error) {
      console.error('Error in getLinkSummary:', error);
    }
    
    return {
      totalClicks: linkData?.clicks || 0,
      lastClickedAt: lastClickedAt,
    };
  }
  
  // Check if user has premium features
  static async hasPremiumFeatures(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
    
    return data?.is_premium || false;
  }
}

export default AnalyticsService;
