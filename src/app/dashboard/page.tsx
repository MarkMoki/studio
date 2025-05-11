
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreatorDashboard } from "@/components/dashboard/creator-dashboard";
import { SupporterDashboard } from "@/components/dashboard/supporter-dashboard";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
         <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">Please sign in to view your dashboard.</p>
        <Link 
            href="/auth" 
            className={cn(
                buttonVariants({}),
                "bg-primary hover:bg-primary/90 text-primary-foreground transform hover:scale-105 transition-transform"
            )}
        >
            Sign In
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-up" style={{animationDelay: '0.1s'}}>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Karibu, {user.fullName || user.username || "User"}! <Sparkles className="inline-block w-8 h-8 text-accent animate-pulse" />
          </h1>
          <p className="text-lg text-muted-foreground">Manage your TipKesho world here.</p>
        </div>
        {!user.isCreator && (
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transform hover:scale-105 transition-all">
            <Link href="/dashboard/become-creator">Become a Creator</Link>
          </Button>
        )}
      </div>

      {user.isCreator ? (
        <CreatorDashboard user={user} />
      ) : (
        <SupporterDashboard user={user} />
      )}
    </div>
  );
}

