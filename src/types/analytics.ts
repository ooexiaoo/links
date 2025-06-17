export interface LinkAnalytics {
  id: string;
  link_id: string;
  clicked_at: string; // ISO date string
  ip_address?: string | null;
  country?: string | null;
  device_type?: string | null;
  referrer?: string | null;
  user_agent?: string | null;
}

export interface AnalyticsSummary {
  totalClicks: number;
  lastClickedAt: string | null;
  clicksByDay?: Array<{ date: string; count: number }>;
  clicksByCountry?: Array<{ country: string; count: number }>;
  clicksByDevice?: Array<{ device: string; count: number }>;
  clicksByReferrer?: Array<{ referrer: string; count: number }>;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}

// Utility function to detect device type from user agent
export function detectDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) {
    return 'Mobile';
  }
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'Tablet';
  }
  if (/mac|win|linux/i.test(userAgent)) {
    return 'Desktop';
  }
  return 'Unknown';
}

// Utility function to extract country from IP (this is a placeholder - in a real app, you'd use a service like ipinfo)
export function getCountryFromIP(ip: string): string | null {
  // In a real app, you would call an IP geolocation service here
  // For now, we'll return null and handle this in the API route
  return null;
}

// Format analytics data for charts
export function formatAnalyticsForCharts(analytics: LinkAnalytics[]): AnalyticsSummary {
  const summary: AnalyticsSummary = {
    totalClicks: analytics.length,
    lastClickedAt: analytics.length > 0 
      ? new Date(Math.max(...analytics.map(a => new Date(a.clicked_at).getTime()))).toISOString()
      : null,
    clicksByDay: [],
    clicksByCountry: [],
    clicksByDevice: [],
    clicksByReferrer: []
  };

  // Group by day
  const dayGroups = analytics.reduce((acc, curr) => {
    const date = new Date(curr.clicked_at).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  summary.clicksByDay = Object.entries(dayGroups)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group by country
  const countryGroups = analytics.reduce((acc, curr) => {
    if (!curr.country) return acc;
    acc[curr.country] = (acc[curr.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  summary.clicksByCountry = Object.entries(countryGroups)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  // Group by device
  const deviceGroups = analytics.reduce((acc, curr) => {
    const device = curr.device_type || 'Unknown';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  summary.clicksByDevice = Object.entries(deviceGroups)
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);

  // Group by referrer
  const referrerGroups = analytics.reduce((acc, curr) => {
    const referrer = curr.referrer || 'Direct';
    acc[referrer] = (acc[referrer] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  summary.clicksByReferrer = Object.entries(referrerGroups)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count);

  return summary;
}
