
"use client";
import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar, SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarHeader, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, BarChart3, Coins, Send, Settings, Edit3, User, LogOut, HandCoins, Sparkles, Loader2, ShieldAlert, Users as UsersIcon } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import React from 'react'; 

const creatorNavItems = [
  { href: '/creator/dashboard', label: 'Dashboard', icon: <BarChart3 /> },
  { href: '/creator/tips', label: 'Tips Received', icon: <Coins /> },
  { href: '/creator/withdrawals', label: 'Withdrawals', icon: <Send /> },
  { href: '/creators', label: 'Explore Creators', icon: <UsersIcon /> },
  { href: '/creator/settings', label: 'Profile Settings', icon: <Settings /> },
];

export default function CreatorDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // router.replace('/auth'); // Handled by AppRouterRedirect
    return null;
  }
  if (!user.isCreator) {
    // router.replace('/dashboard'); // Handled by AppRouterRedirect
    return null;
  }
   if (!user.fullName || !user.phoneNumber) { // Profile incomplete
    // router.replace('/auth'); // Handled by AppRouterRedirect
    return null;
  }


  const getInitials = (name: string | undefined | null) => {
    if (!name) return "TK";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };


  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border hidden md:flex">
        <SidebarHeader>
          <Link href="/creator/dashboard" className="flex items-center gap-2 p-2 group">
            <HandCoins className="h-7 w-7 text-primary transition-transform duration-300 group-hover:rotate-[10deg]" />
            <span className="text-xl font-bold text-primary group-data-[collapsible=icon]:hidden">TipKesho</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {creatorNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/creator/dashboard')}
                    tooltip={item.label}
                    className="justify-start group-data-[collapsible=icon]:justify-center"
                  >
                    {React.cloneElement(item.icon as React.ReactElement, { className: "h-5 w-5"})}
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        {/* Sidebar Footer (Optional) */}
      </Sidebar>
      <SidebarInset className="md:ml-[var(--sidebar-width-icon)] group-data-[state=expanded]:md:ml-[var(--sidebar-width)] transition-[margin-left] ease-linear duration-200 pb-16 md:pb-0"> {/* Added pb-16 md:pb-0 for mobile nav */}
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:hidden">
             <SidebarTrigger className="md:hidden" />
             <Link href="/creator/dashboard" className="flex items-center gap-2 font-semibold">
                <HandCoins className="h-6 w-6 text-primary" />
                <span className="text-lg">TipKesho Creator</span>
            </Link>
          </header>
          <main className="flex-1 p-4 md:p-6 space-y-6">{children}</main>
        </div>
      </SidebarInset>

       {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
        <div className="container mx-auto grid h-16 grid-cols-5 items-center gap-1 px-2"> {/* Changed to grid-cols-5 and gap-1 */}
          {creatorNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-md p-1 text-xs font-medium transition-colors", // Reduced padding
                (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/creator/dashboard' && item.href !== '/creators')) || (pathname.startsWith('/creators') && item.href === '/creators')
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {React.cloneElement(item.icon as React.ReactElement, { className: "h-5 w-5"})}
              <span className="truncate w-full text-center">{item.label.split(' ')[0]}</span> {/* Ensure text fits */}
            </Link>
          ))}
        </div>
      </nav>
    </SidebarProvider>
  );
}
