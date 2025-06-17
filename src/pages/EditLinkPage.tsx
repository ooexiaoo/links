import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

// Form validation schema
const formSchema = z.object({
  originalUrl: z.string().url({ message: 'Please enter a valid URL' }),
  title: z.string().max(100, { message: 'Title must be less than 100 characters' }).optional(),
  expiresAt: z.date().nullable().optional(),
  isMonetized: z.boolean(),
  isActive: z.boolean(),
});

type FormValues = {
  originalUrl: string;
  title?: string;
  expiresAt: Date | null;
  isMonetized: boolean;
  isActive: boolean;
};

export default function EditLinkPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<FormValues>({
    // @ts-ignore - TypeScript has issues with zodResolver inference
    resolver: zodResolver(formSchema),
    defaultValues: {
      originalUrl: '',
      title: '',
      expiresAt: null,
      isMonetized: false,
      isActive: true,
    },
  });

  // Fetch link data
  useEffect(() => {
    const fetchLink = async () => {
      if (!user || !id) return;

      try {
        const { data: link, error } = await supabase
          .from('links')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (!link) throw new Error('Link not found');

        // Set form values
        reset({
          originalUrl: link.original_url,
          title: link.title || '',
          expiresAt: link.expires_at ? new Date(link.expires_at) : null,
          isMonetized: link.is_monetized,
          isActive: link.is_active,
        });
      } catch (error) {
        console.error('Error fetching link:', error);
        toast({
          title: 'Error',
          description: 'Failed to load link. It may have been deleted or you may not have permission to edit it.',
          variant: 'destructive',
        });
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLink();
  }, [id, user, reset, toast, navigate]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!user || !id) return;

    setIsSubmitting(true);

    try {
      const updates = {
        original_url: data.originalUrl,
        title: data.title || null,
        expires_at: data.expiresAt ? data.expiresAt.toISOString() : null,
        is_monetized: data.isMonetized,
        is_active: data.isActive,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('links')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Link updated successfully!',
      });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      console.error('Error updating link:', error);
      toast({
        title: 'Error',
        description: 'Failed to update link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Edit Link</h1>
        <p className="text-muted-foreground">Update your short link details and settings</p>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Original URL */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="originalUrl" className="text-base font-medium">
                  Destination URL <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  The URL that your short link will redirect to
                </p>
              </div>
              <Input
                id="originalUrl"
                placeholder="https://example.com"
                {...register('originalUrl')}
                className={`h-12 text-base ${errors.originalUrl ? 'border-red-500' : ''}`}
              />
              {errors.originalUrl && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.originalUrl.message}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="title" className="text-base font-medium">
                  Title (Optional)
                </Label>
                <p className="text-sm text-muted-foreground">
                  A descriptive name for your link (max 100 characters)
                </p>
              </div>
              <Input
                id="title"
                placeholder="My Awesome Link"
                {...register('title')}
                maxLength={100}
                className={`h-12 text-base ${errors.title ? 'border-red-500' : ''}`}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Expiration Date */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-base font-medium">
                  Expiration Date (Optional)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Set an expiration date for this link (leave empty for no expiration)
                </p>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full h-12 justify-start text-left font-normal text-base',
                      !watch('expiresAt') ? 'text-muted-foreground' : 'text-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5" />
                    {watch('expiresAt') ? (
                      format(watch('expiresAt') as Date, 'PPP')
                    ) : (
                      <span>No expiration date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-lg shadow-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={watch('expiresAt') || undefined}
                    onSelect={(date) => setValue('expiresAt', date || null)}
                    initialFocus
                    className="border-0"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monetization Toggle */}
              <div className="flex items-center justify-between p-5 border rounded-lg bg-card">
                <div className="space-y-1">
                  <Label htmlFor="isMonetized" className="text-base font-medium">
                    Monetization
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show ads on this link
                  </p>
                </div>
                <Switch
                  id="isMonetized"
                  checked={watch('isMonetized')}
                  onCheckedChange={(checked) => setValue('isMonetized', checked)}
                  className="data-[state=checked]:bg-primary h-6 w-11"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-5 border rounded-lg bg-card">
                <div className="space-y-1">
                  <Label htmlFor="isActive" className="text-base font-medium">
                    Link Status
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {watch('isActive') ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={watch('isActive')}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                  className="data-[state=checked]:bg-primary h-6 w-11"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={isSubmitting}
                className="h-11 px-6 text-base"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="h-11 px-6 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
