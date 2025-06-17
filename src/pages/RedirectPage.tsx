import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, ExternalLink } from 'lucide-react';
import AnalyticsService from '@/services/analyticsService';

export default function RedirectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<{
    original_url: string;
    title: string | null;
    is_monetized: boolean;
    expires_at: string | null;
    created_at: string;
  } | null>(null);

  // Function to get client IP and other analytics data
  const getClientInfo = async () => {
    try {
      // Get client IP address (this is a simple method, consider a more robust solution for production)
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      // Get geolocation data
      let country = null;
      try {
        const geoResponse = await fetch(`https://ipapi.co/${ip}/country_name/`);
        country = await geoResponse.text();
      } catch (e) {
        console.error('Error fetching geolocation:', e);
      }

      // Get device type
      const userAgent = window.navigator.userAgent;
      let deviceType = 'desktop';
      if (/Mobi|Android|iPhone|iPad|iPod/i.test(userAgent)) {
        deviceType = 'mobile';
        if (/iPad|tablet/i.test(userAgent)) {
          deviceType = 'tablet';
        }
      }

      return {
        ip_address: ip,
        country: country || null,
        device_type: deviceType,
        user_agent: userAgent,
        referrer: document.referrer || null,
      };
    } catch (error) {
      console.error('Error getting client info:', error);
      return {
        ip_address: null,
        country: null,
        device_type: null,
        user_agent: null,
        referrer: null,
      };
    }
  };

  // Handle the redirect and track analytics
  useEffect(() => {
    const processRedirect = async () => {
      if (!slug) {
        setError('No link specified');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 1. Fetch the link from the database
        const { data: linkData, error: linkError } = await supabase
          .from('links')
          .select('*')
          .eq('slug', slug)
          .single();

        if (linkError || !linkData) {
          throw new Error('Link not found');
        }

        // Check if link is active
        if (!linkData.is_active) {
          throw new Error('This link is currently inactive');
        }

        // Check if link has expired
        if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
          throw new Error('This link has expired');
        }

        setLink({
          original_url: linkData.original_url,
          title: linkData.title,
          is_monetized: linkData.is_monetized,
          expires_at: linkData.expires_at,
          created_at: linkData.created_at,
        });

        // 2. Get client info for analytics
        const clientInfo = await getClientInfo();

        // 3. Track the click in the database
        console.log('Before logClick');
        const logResult = await AnalyticsService.logClick(linkData.id, {
          ip_address: clientInfo.ip_address || '',
          country: clientInfo.country || '',
          device_type: clientInfo.device_type || 'unknown',
          user_agent: clientInfo.user_agent || '',
          referrer: clientInfo.referrer || null,
        });
        console.log('After logClick. Result:', logResult);

        // 4. If not monetized, redirect immediately
        if (!linkData.is_monetized) {
          window.location.href = linkData.original_url;
          return;
        }

        // If monetized, we'll show the ad preview first
        setLoading(false);
      } catch (error) {
        console.error('Redirect error:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        setLoading(false);
      }
    };

    processRedirect();
  }, [slug]);

  const handleRedirect = () => {
    if (link) {
      window.location.href = link.original_url;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32 mx-auto" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show ad preview if link is monetized
  if (link?.is_monetized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/50">
        <Card className="w-full max-w-2xl overflow-hidden">
          <div className="bg-primary/10 p-4 border-b">
            <h1 className="text-xl font-semibold text-center">
              {link.title || 'You are being redirected...'}
            </h1>
          </div>
          
          <CardContent className="p-6">
            <div className="bg-muted/30 rounded-lg p-6 mb-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                This link contains sponsored content
              </p>
              <div className="bg-background border rounded p-4 mb-4">
                {/* Ad content would go here */}
                <div className="h-40 flex items-center justify-center bg-muted/50 rounded">
                  <p className="text-muted-foreground">Sponsored Content</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                You're seeing this because the link owner has enabled monetization.
              </p>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center justify-between">
                <span>Original URL:</span>
                <span className="font-medium text-foreground truncate max-w-[60%]" title={link.original_url}>
                  {new URL(link.original_url).hostname}
                </span>
              </p>
              {link.expires_at && (
                <p className="flex items-center justify-between">
                  <span>Expires in:</span>
                  <span className="font-medium">
                    {formatDistanceToNow(new Date(link.expires_at))}
                  </span>
                </p>
              )}
              <p className="flex items-center justify-between">
                <span>Created:</span>
                <span className="font-medium">
                  {new Date(link.created_at).toLocaleDateString()}
                </span>
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-3 p-6 pt-0">
            <Button 
              onClick={handleRedirect}
              className="w-full py-6 text-base font-medium"
              size="lg"
            >
              Continue to {new URL(link.original_url).hostname}
              <Icons.externalLink className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Go back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Fallback (shouldn't reach here)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Icons.loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Redirecting you now...</p>
      </div>
    </div>
  );
}
