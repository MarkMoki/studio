"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Users, LayoutDashboard, LogIn, UserPlus, HandCoins } from 'lucide-react';
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

export function Navbar() {
  const { user, loading, signOut } = useAuth();

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "TK";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <HandCoins className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-primary">TipKesho</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-primary">
            Home
          </Link>
          <Link href="/creators" className="transition-colors hover:text-primary">
            Creators
          </Link>
          {user && (
            <Link href="/dashboard" className="transition-colors hover:text-primary">
              Dashboard
            </Link>
          )}
        </nav>
        <div className="flex items-center space-x-2">
          {loading ? (
            <Button variant="ghost" size="sm" disabled>Loading...</Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profilePicUrl || undefined} alt={user.fullName || "User"} data-ai-hint="profile avatar" />
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
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
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/auth/signin" passHref legacyBehavior>
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-2 h-4 w-4" /> Sign In
                </Button>
              </Link>
              <Link href="/auth/signup" passHref legacyBehavior>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
