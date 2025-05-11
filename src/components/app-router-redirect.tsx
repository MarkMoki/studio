
"use client";

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Define base paths for dashboards
const supporterDashboardBase = '/dashboard';
const creatorDashboardBase = '/creator';
const authRoute = '/auth';
const homeRoute = '/';


export function AppRouterRedirect() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Define these outside useEffect so they are accessible by shouldShowGlobalLoader
  const isSupporterDashboardArea = pathname === supporterDashboardBase || pathname.startsWith(`${supporterDashboardBase}/`);
  const isCreatorDashboardArea = pathname === creatorDashboardBase || pathname.startsWith(`${creatorDashboardBase}/`);
  const isProtectedPath = isSupporterDashboardArea || isCreatorDashboardArea;
  const isAuthPage = pathname === authRoute;
  const isHomePage = pathname === homeRoute;

  useEffect(() => {
    if (authLoading) return; // Wait until authentication status is resolved

    if (user) { // User is logged in
      if (!user.fullName || !user.phoneNumber) { // Profile incomplete
        if (!isAuthPage) { // If not already on auth page (for profile completion)
          router.replace(authRoute); // Redirect to complete profile
        }
      } else { // Profile complete
        if (isAuthPage || isHomePage) { // If on auth page or home page after profile completion
          // Redirect to their specific dashboard
          router.replace(user.isCreator ? `${creatorDashboardBase}/dashboard` : supporterDashboardBase);
        } else if (user.isCreator && isSupporterDashboardArea) {
           // Creator trying to access supporter dashboard area
           router.replace(`${creatorDashboardBase}/dashboard`);
        } else if (!user.isCreator && isCreatorDashboardArea) {
           // Supporter trying to access creator dashboard area
           router.replace(supporterDashboardBase);
        }
        // No explicit redirection for other public pages like /creators, /about, /contact
        // if user is logged in and profile is complete. They can access these pages.
      }
    } else { // User is not logged in
      if (isProtectedPath) {
        router.replace(authRoute); // Redirect to login if trying to access protected dashboard routes
      }
      // Logged-out users can access public pages like /creators, /about, /contact, /auth, /
    }
  }, [user, authLoading, pathname, router, isAuthPage, isHomePage, isProtectedPath, isCreatorDashboardArea, isSupporterDashboardArea]);

  // Show a global loader if auth is loading and trying to access a protected page or auth page to prevent flicker
  const shouldShowGlobalLoader = authLoading && (isProtectedPath || isAuthPage);

  if (shouldShowGlobalLoader) {
    return (
      <div className="fixed inset-0 bg-background z-[9999] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  return null; // This component does not render anything itself
}

