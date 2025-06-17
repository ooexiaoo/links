import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AnalyticsCard } from './AnalyticsCard';
import { LineChart } from './LineChart';
import { PieChart } from './PieChart';
import { BarChart } from './BarChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Globe, MousePointer, Smartphone, Laptop, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link as RouterLink } from 'react-router-dom';
import type { AnalyticsFilters } from '@/types/analytics';
import AnalyticsService from '@/services/analyticsService';

type AnalyticsData = {
  dailyData: Array<{ date: string; count: number }>;
  countryData: Array<{ name: string; value: number }>;
  deviceData: Array<{ name: string; value: number }>;
  referrerData: Array<{ name: string; value: number }>;
};

type ClickEvent = {
  clicked_at: string;
  country?: string;
  device_type?: string;
  referrer?: string;
};

interface LinkAnalyticsProps {
  linkId: string;
  slug: string;
  originalUrl: string;
}

export function LinkAnalytics({ linkId, slug, originalUrl }: LinkAnalyticsProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [summary, setSummary] = useState<{
    totalClicks: number;
    lastClickedAt: string | null;
  }>({ totalClicks: 0, lastClickedAt: null });

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Check if user has premium features
        const premiumStatus = await AnalyticsService.hasPremiumFeatures(user.id);
        setIsPremium(premiumStatus);
        
        // Set time range filter
        let startDate: Date | undefined;
        const endDate = new Date();
        
        switch (timeRange) {
          case '24h':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 1);
            break;
          case '7d':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30d':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90d':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 90);
            break;
          case 'all':
          default:
            startDate = undefined;
        }

        const filters: AnalyticsFilters = {
          startDate: startDate?.toISOString(),
          groupBy: 'day',
        };

        // Fetch analytics data
        const { data } = await AnalyticsService.getLinkAnalytics(linkId, filters);
        
        // Format data for charts
        const formattedData = formatAnalyticsData(data);
        setAnalyticsData(formattedData);
        
        // Get summary data
        const summaryData = await AnalyticsService.getLinkSummary(linkId);
        setSummary(summaryData);
        
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, linkId, timeRange]);

  // Format analytics data for charts
  const formatAnalyticsData = (data: ClickEvent[]): AnalyticsData | null => {
    if (!data || data.length === 0) return null;

    // Group by day for time series
    const dailyClicks: Record<string, number> = {};
    const countryClicks: Record<string, number> = {};
    const deviceClicks: Record<string, number> = {};
    const referrerClicks: Record<string, number> = {};

    data.forEach((item) => {
      // Format date for grouping by day
      const date = new Date(item.clicked_at).toISOString().split('T')[0];
      dailyClicks[date] = (dailyClicks[date] || 0) + 1;

      // Group by country
      if (item.country) {
        countryClicks[item.country] = (countryClicks[item.country] || 0) + 1;
      }

      // Group by device type
      if (item.device_type) {
        deviceClicks[item.device_type] = (deviceClicks[item.device_type] || 0) + 1;
      }

      // Group by referrer
      const referrer = item.referrer || 'Direct';
      referrerClicks[referrer] = (referrerClicks[referrer] || 0) + 1;
    });

    // Convert to array format for charts
    const dailyData = Object.entries(dailyClicks)
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const countryData = Object.entries(countryClicks)
      .map(([country, count]) => ({
        name: country,
        value: count,
      }))
      .sort((a, b) => b.value - a.value);

    const deviceData = Object.entries(deviceClicks)
      .map(([device, count]) => ({
        name: device,
        value: count,
      }))
      .sort((a, b) => b.value - a.value);

    const referrerData = Object.entries(referrerClicks)
      .map(([referrer, count]) => ({
        name: referrer,
        value: count,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      dailyData,
      countryData,
      deviceData,
      referrerData,
    };
  };

  // Format last clicked time
  const formatLastClicked = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return `${formatDistanceToNow(date, { addSuffix: true })} (${format(date, 'MMM d, yyyy h:mm a')})`;
  };

  // Get short URL
  const shortUrl = `${window.location.origin}/${slug}`;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Total Clicks"
          value={summary.totalClicks.toLocaleString()}
          icon={<MousePointer className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <AnalyticsCard
          title="Last Click"
          value={formatLastClicked(summary.lastClickedAt)}
          icon={<Clock className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <AnalyticsCard
          title="Created"
          value={formatLastClicked(new Date().toISOString())}
          icon={<Calendar className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <div className="flex flex-col">
          <AnalyticsCard
            title="Short URL"
            value={shortUrl}
            description={originalUrl}
            icon={<ExternalLink className="h-4 w-4" />}
            isLoading={isLoading}
            className="h-full"
          />
          {!isLoading && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => navigator.clipboard.writeText(shortUrl)}
            >
              Copy URL
            </Button>
          )}
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          {['24h', '7d', '30d', '90d', 'all'].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground hover:bg-muted'
              } border border-border ${
                range === '24h' ? 'rounded-l-lg' : ''
              } ${
                range === 'all' ? 'rounded-r-lg' : 'border-r-0'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="locations" disabled={!isPremium}>
              Locations
            </TabsTrigger>
            <TabsTrigger value="devices" disabled={!isPremium}>
              Devices
            </TabsTrigger>
            <TabsTrigger value="referrers" disabled={!isPremium}>
              Referrers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Click History</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <LineChart
                  data={analyticsData?.dailyData || []}
                  height={350}
                />
              </CardContent>
            </Card>

            {isPremium ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Countries</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <PieChart
                      data={analyticsData?.countryData || []}
                      height={350}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Devices</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <PieChart
                      data={analyticsData?.deviceData || []}
                      height={350}
                    />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="p-6 text-center">
                <h3 className="text-lg font-medium mb-2">Upgrade to Premium</h3>
                <p className="text-muted-foreground mb-4">
                  Unlock advanced analytics including geographic data, device information, and more.
                </p>
                <Button asChild>
                  <RouterLink to="/pricing">Upgrade Now</RouterLink>
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle>Locations</CardTitle>
              </CardHeader>
              <CardContent className="h-[500px]">
                <BarChart
                  data={analyticsData?.countryData || []}
                  title="Clicks by Country"
                  height={450}
                  yAxisLabel="Clicks"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <CardTitle>Devices</CardTitle>
              </CardHeader>
              <CardContent className="h-[500px]">
                <BarChart
                  data={analyticsData?.deviceData || []}
                  title="Clicks by Device Type"
                  height={450}
                  yAxisLabel="Clicks"
                  barColor="#10b981"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrers">
            <Card>
              <CardHeader>
                <CardTitle>Referrers</CardTitle>
              </CardHeader>
              <CardContent className="h-[500px]">
                <BarChart
                  data={analyticsData?.referrerData || []}
                  title="Top Referrers"
                  height={450}
                  yAxisLabel="Clicks"
                  barColor="#8b5cf6"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
