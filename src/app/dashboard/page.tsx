
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyTipsList } from "@/components/dashboard/my-tips-list";
import { UserProfileForm } from "@/components/dashboard/user-profile-form";
import { CreatorStats } from "@/components/dashboard/creator-stats";
// ActivityFeed can be re-added later when its data source is Firebase
// import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { useAuth } from "@/hooks/use-auth";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserCog, Gift, BarChart3, AlertTriangle, Edit3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
  
  const defaultTab = user.isCreator ? "creator-stats" : "my-tips";

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-up" style={{animationDelay: '0.1s'}}>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Karibu, {user.fullName || user.username || "User"}! <Sparkles className="inline-block w-8 h-8 text-accent" />
          </h1>
          <p className="text-lg text-muted-foreground">Manage your TipKesho world here.</p>
        </div>
        {!user.isCreator && (
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transform hover:scale-105 transition-all">
            <Link href="/dashboard/become-creator">Become a Creator</Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue={defaultTab} className="w-full animate-slide-up" style={{animationDelay: '0.2s'}}>
        <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2 sm:grid-cols-3 md:grid-cols-none mb-6 shadow-sm">
          {user.isCreator && <TabsTrigger value="creator-stats" className="text-sm md:text-base"><BarChart3 className="w-4 h-4 mr-2"/>Stats</TabsTrigger>}
          {user.isCreator && (
            // This now correctly links to a separate page
            <TabsTrigger value="creator-profile-nav" className="text-sm md:text-base" asChild> 
                <Link href="/dashboard/creator-profile"><Edit3 className="w-4 h-4 mr-2"/>Edit Creator Profile</Link>
            </TabsTrigger>
          )}
          <TabsTrigger value="my-tips" className="text-sm md:text-base"><Gift className="w-4 h-4 mr-2"/>My Tips</TabsTrigger>
          <TabsTrigger value="my-profile" className="text-sm md:text-base"><UserCog className="w-4 h-4 mr-2"/>My Account</TabsTrigger>
          {/* <TabsTrigger value="activity" className="text-sm md:text-base"><Newspaper className="w-4 h-4 mr-2"/>Activity</TabsTrigger> */}
        </TabsList>
        
        {user.isCreator && (
          <TabsContent value="creator-stats" className="animate-fade-in">
            <CreatorStats creatorId={user.id} />
          </TabsContent>
        )}
        
        {/* Content for creator-profile-nav is not needed here as it's a Link */}


        <TabsContent value="my-tips" className="animate-fade-in">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">My Sent Tips</CardTitle>
              <CardDescription>A record of all the tips you&apos;ve sent to amazing creators.</CardDescription>
            </CardHeader>
            <CardContent>
              <MyTipsList userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-profile" className="animate-fade-in">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">My Account Settings</CardTitle>
              <CardDescription>Update your personal information and preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserProfileForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="activity" className="animate-fade-in">
          <ActivityFeed userId={user.id} />
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
