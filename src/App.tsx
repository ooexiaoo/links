import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider, ToastViewport } from '@/components/ui/toaster';
import { ThemeProvider, useTheme } from '@/components/theme-provider';

// Import page components
import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CreateLinkPage from './pages/CreateLinkPage';
import EditLinkPage from './pages/EditLinkPage';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Moon, Sun } from 'lucide-react';

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

const RedirectPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const redirectToOriginalUrl = async () => {
      if (!slug) {
        setError('No short link provided');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch the original URL from the database
        const { data, error: fetchError } = await supabase
          .from('links')
          .select('original_url, is_active')
          .eq('slug', slug)
          .single();

        if (fetchError || !data) {
          throw new Error('Link not found');
        }

        if (!data.is_active) {
          throw new Error('This link is inactive');
        }

        // Update the click count
        await supabase.rpc('increment_clicks', { link_slug: slug });
        
        // Redirect to the original URL
        window.location.href = data.original_url;
      } catch (err) {
        console.error('Redirect error:', err);
        setError('Failed to redirect. The link may be invalid or expired.');
        setIsLoading(false);
      }
    };

    redirectToOriginalUrl();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Redirecting you...</h1>
          <p className="text-muted-foreground">Please wait while we take you to your destination.</p>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Unable to redirect</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
};

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-6">Page not found</p>
      <a href="/" className="text-primary hover:underline">Return to home</a>
    </div>
  </div>
);

// Layout
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut } = useAuth();
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="/dashboard" className="text-xl font-bold">LinkShort</a>
            <nav className="flex items-center space-x-4">
              <a href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</a>
              <a href="/create" className="text-sm font-medium hover:text-primary transition-colors">Create</a>
              <ThemeToggle />
              <button 
                onClick={() => signOut()}
                className="text-sm font-medium hover:text-primary px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
              >
                Sign out
              </button>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full">
        <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (for auth pages)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }


  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Theme toggle component
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-md p-2 hover:bg-accent"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
};

// Main App Component
function App() {
  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="system">
        <AuthProvider>
          <Router>
            <ToastProvider>
              <div className="min-h-screen bg-background text-foreground">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  } />
                  <Route path="/signup" element={
                    <PublicRoute>
                      <SignupPage />
                    </PublicRoute>
                  } />
                  <Route path="/forgot-password" element={
                    <PublicRoute>
                      <ForgotPasswordPage />
                    </PublicRoute>
                  } />
                  <Route path="/reset-password" element={
                    <PublicRoute>
                      <ResetPasswordPage />
                    </PublicRoute>
                  } />

                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <DashboardPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/create" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <CreateLinkPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/edit/:id" element={
                    <ProtectedRoute>
                      <MainLayout>
                        <EditLinkPage />
                      </MainLayout>
                    </ProtectedRoute>
                  } />

                  {/* Redirect route for short links */}
                  <Route path="/:slug" element={<RedirectPage />} />
                
                  {/* 404 - Not Found */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                <ToastViewport />
              </div>
            </ToastProvider>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

export default App;
