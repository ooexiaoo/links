import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Icons } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Explicitly type the error from resetPassword
  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      const { error } = await handleResetPassword(data.email);
      
      if (error) throw error;
      
      setEmailSent(true);
      toast({
        title: 'Email sent',
        description: 'Check your email for a link to reset your password.',
      });
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send reset email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription>
              We've sent a password reset link to {form.watch('email')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-6">
              <p className="mb-4">
                If you don't see the email, check your spam folder or click the button below to resend.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  onSubmit({ email: form.watch('email') });
                }}
                disabled={isLoading}
              >
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Resend email
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              variant="link" 
              className="text-muted-foreground" 
              onClick={() => navigate('/login')}
            >
              Back to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Forgot your password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Send reset link
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            variant="link" 
            className="text-muted-foreground" 
            onClick={() => navigate('/login')}
          >
            Back to login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
