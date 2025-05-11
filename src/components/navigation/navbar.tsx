
"use client";
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Home, Users, LayoutDashboard, LogIn, UserPlus, HandCoins, Sparkles, Search, Bell, UserCircle, Edit3, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from '@/components/ui/input';
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';


export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "TK";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };
  
  const handleDashboardNavigation = () => {
    if (user) {
      router.push(user.isCreator ? '/creator/dashboard' : '/dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <HandCoins className="h-8 w-8 text-primary transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110" />
          <span className="text-2xl font-bold text-primary group-hover:text-primary/80 transition-colors">TipKesho</span>
           <Sparkles className="h-5 w-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
        
        <div className="flex-1 flex justify-center px-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input type="search" placeholder="Search creators..." className="pl-10 w-full rounded-full" />
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-4 text-sm font-medium">
          {!user && <Link href="/" className="transition-colors hover:text-primary">Home</Link>}
          <Link href="/creators" className="transition-colors hover:text-primary">Explore</Link>
          {user && user.fullName && user.phoneNumber && (
             <Button variant="link" onClick={handleDashboardNavigation} className="transition-colors hover:text-primary p-0 h-auto">Dashboard</Button>
          )}
        </nav>

        <div className="flex items-center space-x-2">
          {loading ? (
            <Button variant="ghost" size="icon" disabled className="rounded-full h-10 w-10">
              <Loader2 className="h-5 w-5 animate-spin"/>
            </Button>
          ) : user ? (
            <>
              {/* "Become a Creator" CTA Button removed from here */}
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="h-5 w-5" />
                {/* Placeholder for notification dot */}
                {/* <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-destructive ring-2 ring-background" /> */}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/50 hover:border-primary transition-colors">
                      <AvatarImage src={user.profilePicUrl || undefined} alt={user.fullName || "User"} data-ai-hint="profile avatar" />
                      <AvatarFallback>{getInitials(user.fullName || user.username)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.fullName || user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.fullName && user.phoneNumber && (
                    <DropdownMenuItem onClick={handleDashboardNavigation} className="md:hidden">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => router.push('/creators')} className="md:hidden">
                    <Users className="mr-2 h-4 w-4" />
                    Explore
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => router.push(user.isCreator ? '/creator/settings' : '/dashboard/settings')}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  {!user.isCreator && user.fullName && user.phoneNumber && (
                     <DropdownMenuItem className="sm:hidden" onClick={() => router.push('/creator/onboarding')}> {/* Kept sm:hidden for mobile-specific logic consistency */}
                        <Edit3 className="mr-2 h-4 w-4" /> Become a Creator
                     </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link 
                href="/auth" 
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "hover:text-primary"
                )}
              >
                <span>
                  <LogIn className="mr-2 h-4 w-4 inline-block" /> Sign In
                </span>
              </Link>
              <Link 
                href="/auth" 
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
                )}
              >
                <span>
                  <UserPlus className="mr-2 h-4 w-4 inline-block" /> Sign Up
                </span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

