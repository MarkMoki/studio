
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const protectedRoutes = ['/dashboard', '/creator'];
const authRoutes = ['/auth'];
const publicHomeRoute = '/';

export function AppRouterRedirect() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return; // Wait until authentication status is resolved

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    const isHomePage = pathname === publicHomeRoute;

    if (user) { // User is logged in
      if (!user.fullName || !user.phoneNumber) { // Profile incomplete
        if (pathname !== '/auth') { // If not already on auth page (for profile completion)
          router.replace('/auth'); // Redirect to complete profile
        }
      } else { // Profile complete
        if (isAuthRoute || isHomePage) { // If on auth page or home page
          // Redirect to their specific dashboard
          router.replace(user.isCreator ? '/creator/dashboard' : '/dashboard');
        } else if (user.isCreator && pathname.startsWith('/dashboard') && !pathname.startsWith('/creator/dashboard')) {
           // Creator trying to access supporter dashboard
           router.replace('/creator/dashboard');
        } else if (!user.isCreator && pathname.startsWith('/creator')) {
           // Supporter trying to access creator dashboard
           router.replace('/dashboard');
        }
      }
    } else { // User is not logged in
      if (isProtectedRoute) {
        router.replace('/auth'); // Redirect to login if trying to access protected routes
      }
    }
  }, [user, authLoading, pathname, router]);

  // Show a global loader if auth is loading and trying to access a protected/auth page to prevent flicker
  if (authLoading && (protectedRoutes.some(r => pathname.startsWith(r)) || authRoutes.some(r => pathname.startsWith(r)))) {
    return (
      <div className="fixed inset-0 bg-background z-[9999] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  return null; // This component does not render anything itself
}
