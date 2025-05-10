"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyTipsList } from "@/components/dashboard/my-tips-list";
import { UserProfileForm } from "@/components/dashboard/user-profile-form";
import { CreatorStats } from "@/components/dashboard/creator-stats";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserCog, Gift, BarChart3, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
         <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">Please sign in to view your dashboard.</p>
        <Link href="/auth/signin" passHref legacyBehavior>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Welcome, {user.fullName || user.username || "User"}!
          </h1>
          <p className="text-lg text-muted-foreground">Manage your tips, profile, and creator settings here.</p>
        </div>
        {!user.isCreator && (
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/dashboard/become-creator">Become a Creator</Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue={user.isCreator ? "creator-stats" : "my-tips"} className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2 md:grid-cols-none">
          {user.isCreator && <TabsTrigger value="creator-stats" className="text-sm md:text-base"><BarChart3 className="w-4 h-4 mr-2"/>Creator Stats</TabsTrigger>}
          <TabsTrigger value="my-tips" className="text-sm md:text-base"><Gift className="w-4 h-4 mr-2"/>My Tips</TabsTrigger>
          <TabsTrigger value="my-profile" className="text-sm md:text-base"><UserCog className="w-4 h-4 mr-2"/>My Profile</TabsTrigger>
        </TabsList>
        
        {user.isCreator && (
          <TabsContent value="creator-stats">
            <CreatorStats creatorId={user.id} />
          </TabsContent>
        )}

        <TabsContent value="my-tips">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">My Sent Tips</CardTitle>
              <CardDescription>A record of all the tips you've sent to amazing creators.</CardDescription>
            </CardHeader>
            <CardContent>
              <MyTipsList userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">My Profile</CardTitle>
              <CardDescription>Update your personal information and preferences.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserProfileForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
