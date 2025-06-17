import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { AnalyticsFilters } from '@/types/analytics';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { params = [] } = req.query;
  const [linkId] = params as string[];

  if (!linkId) {
    return res.status(400).json({ error: 'Link ID is required' });
  }

  try {
    // First, verify the user has access to this link
    const { data: link, error: linkError } = await supabaseAdmin
      .from('links')
      .select('user_id')
      .eq('id', linkId)
      .single();

    if (linkError || !link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Get the user's session
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if the user owns the link
    if (user.id !== link.user_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get the user's premium status
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single();

    const isPremium = profile?.is_premium || false;

    // Parse query parameters
    const { startDate, endDate, groupBy = 'day' } = req.query as unknown as AnalyticsFilters;
    
    // Build the query
    let query = supabaseAdmin
      .from('link_analytics')
      .select('*', { count: 'exact' })
      .eq('link_id', linkId);

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('clicked_at', startDate);
    }
    if (endDate) {
      query = query.lte('clicked_at', endDate);
    }

    // For premium users, we can return more detailed analytics
    if (isPremium) {
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching analytics:', error);
        return res.status(500).json({ error: 'Failed to fetch analytics' });
      }

      return res.status(200).json({
        data,
        count,
        isPremium: true,
      });
    } else {
      // For free users, only return basic analytics
      const { data, error, count } = await query
        .select('clicked_at')
        .order('clicked_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching analytics:', error);
        return res.status(500).json({ error: 'Failed to fetch analytics' });
      }

      return res.status(200).json({
        data: data.map(item => ({
          id: item.id,
          clicked_at: item.clicked_at,
        })),
        count,
        isPremium: false,
      });
    }
  } catch (error) {
    console.error('Error in analytics API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
