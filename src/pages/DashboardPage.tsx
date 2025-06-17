import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ExternalLink, BarChart2, Copy, Clock, MousePointer, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { LinkAnalytics } from '@/components/analytics/LinkAnalytics';
import { supabase } from '@/lib/supabase';
import type { Link } from '@/types/supabase';

export default function DashboardPage() {
  const { user } = useAuth();

  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  // Fetch user's links
  useEffect(() => {
    const fetchLinks = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch links with clicks_count
        const { data: linksData, error: linksError } = await supabase
          .from('links')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (linksError) throw linksError;
        
        // Map the data to include clicks from clicks_count
        const formattedLinks = (linksData || []).map(link => {
          const { clicks_count, ...rest } = link;
          return {
            ...rest,
            clicks: clicks_count || 0
          };
        });
        
        setLinks(formattedLinks);

        // Check premium status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', user.id)
          .single();
          
        setIsPremium(profile?.is_premium || false);
        
        // Select first link if available
        if (linksData && linksData.length > 0) {
          setSelectedLink(linksData[0].id);
        }
      } catch (error) {
        console.error('Error fetching links:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, [user]);

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You might want to add a toast notification here
  };

  // Get short URL
  const getShortUrl = (slug: string) => {
    return `${window.location.origin}/${slug}`;
  };

  if (loading && links.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1.5">Manage your links and view analytics</p>
        </div>
        <Button asChild className="mt-2 sm:mt-0 shrink-0">
          <RouterLink to="/create" className="flex items-center gap-2 h-10 px-4">
            <Plus className="h-4 w-4" />
            Create New Link
          </RouterLink>
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        {links.length === 0 ? (
        <Card className="text-center p-8 max-w-2xl mx-auto bg-card/50">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <BarChart2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No links yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first short link to get started. Track clicks, manage settings, and analyze performance.
            </p>
            <Button asChild className="h-10 px-6">
              <RouterLink to="/create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Link
              </RouterLink>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Links list */}
          <div className="xl:col-span-3 space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Your Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                        selectedLink === link.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border/50 hover:border-border/70 bg-card/50'
                      }`}
                      onClick={() => setSelectedLink(link.id)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-medium truncate text-foreground/90">
                          {link.title || 'Untitled Link'}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1 rounded-full">
                            <MousePointer className="h-3 w-3" />
                            <span className="font-medium">{link.clicks}</span>
                          </div>
                          <RouterLink 
                            to={`/edit/${link.id}`}
                            className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted/50 rounded-md transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title="Edit link"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </RouterLink>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground truncate mt-1 font-mono">
                        {getShortUrl(link.slug)}
                      </div>
                      <div className="text-xs text-muted-foreground/80 mt-2 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>Created {formatDate(link.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {!isPremium && (
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-primary">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <CardTitle className="text-lg">Upgrade to Premium</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unlock advanced analytics, custom domains, and more with our premium plan.
                  </p>
                  <Button variant="default" size="sm" className="w-full h-9">
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Analytics */}
          <div className="xl:col-span-9 space-y-6">
            {selectedLink ? (
              (() => {
                const link = links.find((l) => l.id === selectedLink);
                if (!link) return null;
                
                return (
                  <>
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {link.title || 'Untitled Link'}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <a
                                href={getShortUrl(link.slug)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {getShortUrl(link.slug)}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(getShortUrl(link.slug));
                                }}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Created {formatDate(link.created_at)}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                              <MousePointer className="h-3.5 w-3.5" />
                              <span>Total Clicks</span>
                            </div>
                            <div className="text-2xl font-bold text-foreground">
                              {link.clicks}
                            </div>
                          </div>
                          
                          <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                              {link.is_active ? (
                                <>
                                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                  <span>Status</span>
                                </>
                              ) : (
                                <>
                                  <div className="h-2 w-2 rounded-full bg-muted-foreground/60"></div>
                                  <span>Status</span>
                                </>
                              )}
                            </div>
                            <div className={`text-xl font-semibold ${link.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {link.is_active ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                          
                          {link.expires_at ? (
                            <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Expires</span>
                              </div>
                              <div className="text-lg font-medium text-foreground">
                                {formatDate(link.expires_at)}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                <span>Expires</span>
                              </div>
                              <div className="text-lg font-medium text-foreground">
                                Never
                              </div>
                            </div>
                          )}
                          
                          <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                              {link.is_monetized ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-yellow-500">
                                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C3.688 15.36 1 12.174 1 8.25 1 3.66 5.343 0 10.5 0c5.09 0 9.22 3.224 9.504 7.27.017.22.032.441.046.662.003.05.006.1.006.15 0 .2-.1.39-.27.51l-1.85 1.26a.75.75 0 00-.26.37l-1.1 3.33a.75.75 0 00 .26.82l1.15.85a.75.75 0 01.26.66l-.5 3.5a.75.75 0 01-.45.58l-2.08.8a.75.75 0 00-.5.5l-.35 1.05a.75.75 0 01-.42.45l-1.4.7a.75.75 0 01-.68 0l-1.4-.7a.75.75 0 01-.42-.45l-.35-1.05a.75.75 0 00-.5-.5l-2.08-.8a.75.75 0 01-.45-.58l-.5-3.5a.75.75 0 01.26-.66l1.15-.85a.75.75 0 00.26-.82l-1.1-3.33a.75.75 0 00-.26-.37l-1.85-1.26a.75.75 0 01-.27-.51c0-.05.003-.1.006-.15.014-.22.03-.442.046-.662C2.28 3.724 6.41.5 11.5.5c5.157 0 9.5 3.66 9.5 8.25 0 4.1-2.81 7.43-6.59 7.95a.75.75 0 00-.66.6l-1.2 5.46a.75.75 0 01-.67.6 15.1 15.1 0 01-1.235.04z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-muted-foreground">
                                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span>Monetization</span>
                            </div>
                            <div className={`text-lg font-medium ${link.is_monetized ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                              {link.is_monetized ? 'Enabled' : 'Disabled'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <LinkAnalytics 
                      linkId={link.id} 
                      slug={link.slug} 
                      originalUrl={link.original_url} 
                    />
                  </>
                );
              })()
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 text-center">
                <BarChart2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-medium text-foreground/80 mb-1">No Link Selected</h3>
                <p className="text-muted-foreground max-w-md">
                  Select a link from the sidebar to view detailed analytics and manage its settings.
                </p>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
