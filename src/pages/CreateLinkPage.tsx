import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Copy, Check, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateSlug } from '@/lib/slug-utils';
import { useToast } from '@/components/ui/use-toast';

// Form validation schema
const formSchema = z.object({
  originalUrl: z.string().url({ message: 'Please enter a valid URL' }),
  customSlug: z
    .string()
    .min(3, { message: 'Slug must be at least 3 characters' })
    .max(50, { message: 'Slug must be less than 50 characters' })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: 'Only letters, numbers, hyphens, and underscores are allowed',
    })
    .optional()
    .or(z.literal('')),
  title: z.string().max(100, { message: 'Title must be less than 100 characters' }).optional(),
  expiresAt: z.date().optional(),
  isMonetized: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateLinkPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [generatedSlug, setGeneratedSlug] = useState('');
  const [createdLink, setCreatedLink] = useState<{
    id: string;
    slug: string;
    shortUrl: string;
  } | null>(null);

  // Initialize form with react-hook-form and zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originalUrl: '',
      customSlug: '',
      title: '',
      expiresAt: undefined,
      isMonetized: false,
      isActive: true,
    },
  });

  const watchCustomSlug = watch('customSlug');
  const watchOriginalUrl = watch('originalUrl');
  const watchExpiresAt = watch('expiresAt');

  // Generate a random slug when the component mounts
  useEffect(() => {
    generateRandomSlug();
  }, []);

  // Check slug availability when custom slug changes
  useEffect(() => {
    const checkSlugAvailability = async () => {
      const slug = watchCustomSlug || generatedSlug;
      if (!slug) return;

      setIsCheckingSlug(true);
      try {
        const { data, error } = await supabase
          .from('links')
          .select('slug')
          .eq('slug', slug)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        // If no data is returned, the slug is available
        setIsSlugAvailable(!data);
      } catch (error) {
        console.error('Error checking slug availability:', error);
        toast({
          title: 'Error',
          description: 'Failed to check slug availability. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsCheckingSlug(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      if (watchCustomSlug) {
        checkSlugAvailability();
      } else {
        setIsSlugAvailable(null);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [watchCustomSlug, generatedSlug]);

  // Generate a random slug
  const generateRandomSlug = () => {
    const newSlug = generateSlug('8');
    setGeneratedSlug(newSlug);
    setValue('customSlug', '');
    setIsSlugAvailable(true);
  };

  // Handle form submission
  const onSubmit = async (formData: FormValues) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a link',
        variant: 'destructive',
      });
      return;
    }

    // If using a custom slug, check its availability
    if (formData.customSlug && !isSlugAvailable) {
      toast({
        title: 'Slug not available',
        description: 'The custom slug you entered is already in use. Please try another one.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const slug = formData.customSlug || generatedSlug;
      const expiresAt = formData.expiresAt ? formData.expiresAt.toISOString() : null;

      // Prepare the data for the RPC call
      const linkData = {
        original_url: formData.originalUrl,
        custom_slug: slug,
        expires_at: expiresAt,
        is_monetized: formData.isMonetized,
        title: formData.title || null,
      };

      // Call the create_link function
      const { data, error } = await supabase.rpc('create_link', linkData);

      if (error) throw error;
      if (!data) throw new Error('No data returned from create_link function');

      // Parse the response
      const link = typeof data === 'string' ? JSON.parse(data) : data;
      const shortUrl = `${window.location.origin}/${link.slug}`;
      
      setCreatedLink({
        id: link.id,
        slug: link.slug,
        shortUrl,
      });

      toast({
        title: 'Link created successfully!',
        description: 'Your short link is ready to share.',
      });
    } catch (error) {
      console.error('Error creating link:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
      variant: 'default',
    });
  };

  // Reset form
  const resetForm = () => {
    setCreatedLink(null);
    generateRandomSlug();
    reset({
      originalUrl: '',
      customSlug: '',
      title: '',
      expiresAt: undefined,
      isMonetized: false,
      isActive: true,
    });
  };

  if (createdLink) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Link Created Successfully!</h1>
          <p className="text-muted-foreground">
            Your short link is ready to share with the world.
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50 border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Share Your Link</CardTitle>
                <CardDescription>
                  Copy and share your short link anywhere
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/dashboard`)}
              >
                View in Dashboard
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="short-url" className="mb-2 block">
                  Short URL
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="short-url"
                      readOnly
                      value={createdLink.shortUrl}
                      className="font-mono"
                    />
                    <a
                      href={createdLink.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <Button
                    type="button"
                    onClick={() => copyToClipboard(createdLink.shortUrl)}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="original-url" className="mb-2 block">
                  Original URL
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="original-url"
                    readOnly
                    value={watchOriginalUrl}
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyToClipboard(watchOriginalUrl)}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={resetForm}>
                  Create Another
                </Button>
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Create New Link</h1>
        <p className="text-muted-foreground">
          Shorten your URL and track its performance
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Original URL */}
            <div className="space-y-2">
              <Label htmlFor="originalUrl">Destination URL *</Label>
              <Input
                id="originalUrl"
                placeholder="https://example.com/my-long-url"
                {...register('originalUrl')}
                className={errors.originalUrl ? 'border-destructive' : ''}
              />
              {errors.originalUrl && (
                <p className="text-sm text-destructive">
                  {errors.originalUrl.message}
                </p>
              )}
            </div>

            {/* Custom Slug */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="customSlug">Custom Slug (optional)</Label>
                <button
                  type="button"
                  onClick={generateRandomSlug}
                  className="text-sm text-primary hover:underline"
                >
                  Generate Random
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {window.location.hostname}/
                </div>
                <Input
                  id="customSlug"
                  placeholder={generatedSlug}
                  className={cn(
                    'pl-28',
                    errors.customSlug ? 'border-destructive' : '',
                    isSlugAvailable === false ? 'border-destructive' : ''
                  )}
                  {...register('customSlug')}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingSlug ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : isSlugAvailable === false ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : isSlugAvailable === true ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : null}
                </div>
              </div>
              {errors.customSlug ? (
                <p className="text-sm text-destructive">
                  {errors.customSlug.message}
                </p>
              ) : isSlugAvailable === false ? (
                <p className="text-sm text-destructive">
                  This slug is already taken. Please choose another one.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Leave empty to generate a random slug
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="My Awesome Link"
                {...register('title')}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expiration Date */}
              <div className="space-y-2">
                <Label>Expiration Date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !watchExpiresAt && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watchExpiresAt ? (
                        format(watchExpiresAt, 'PPP')
                      ) : (
                        <span>No expiration</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchExpiresAt}
                      onSelect={(date) => setValue('expiresAt', date || undefined)}
                      initialFocus
                      disabled={(date) =>
                        date < new Date() || date < new Date('1900-01-01')
                      }
                    />
                    <div className="p-2 border-t flex justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setValue('expiresAt', undefined)}
                      >
                        Clear
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Toggle Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Ad Monetization</Label>
                    <p className="text-xs text-muted-foreground">
                      Show ads on the redirect page
                    </p>
                  </div>
                  <Switch
                    id="isMonetized"
                    checked={watch('isMonetized')}
                    onCheckedChange={(checked) =>
                      setValue('isMonetized', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Active</Label>
                    <p className="text-xs text-muted-foreground">
                      Toggle link status
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={watch('isActive')}
                    onCheckedChange={(checked) =>
                      setValue('isActive', checked)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Link'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
