
"use client";

import type { AuthUser } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyTipsList } from "@/components/dashboard/my-tips-list";
import { ReceivedTipsList } from "@/components/dashboard/received-tips-list";
import { UserProfileForm } from "@/components/dashboard/user-profile-form";
import { CreatorStats } from "@/components/dashboard/creator-stats";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog, Gift, BarChart3, Edit3, Newspaper, Coins } from "lucide-react";

interface CreatorDashboardProps {
  user: AuthUser;
}

export function CreatorDashboard({ user }: CreatorDashboardProps) {
  return (
    <Tabs defaultValue="creator-stats" className="w-full animate-slide-up" style={{animationDelay: '0.2s'}}>
      <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2 sm:grid-cols-3 lg:grid-cols-none mb-6 shadow-sm flex-wrap">
        <TabsTrigger value="creator-stats" className="text-sm md:text-base"><BarChart3 className="w-4 h-4 mr-2"/>Stats</TabsTrigger>
        <TabsTrigger value="received-tips" className="text-sm md:text-base"><Coins className="w-4 h-4 mr-2"/>Tips Received</TabsTrigger>
        <TabsTrigger value="my-tips" className="text-sm md:text-base"><Gift className="w-4 h-4 mr-2"/>My Sent Tips</TabsTrigger>
        <TabsTrigger value="creator-profile-nav" className="text-sm md:text-base" asChild> 
            <Link href="/dashboard/creator-profile"><Edit3 className="w-4 h-4 mr-2"/>Edit Creator Profile</Link>
        </TabsTrigger>
        <TabsTrigger value="activity" className="text-sm md:text-base"><Newspaper className="w-4 h-4 mr-2"/>Activity</TabsTrigger>
        <TabsTrigger value="my-profile" className="text-sm md:text-base"><UserCog className="w-4 h-4 mr-2"/>My Account</TabsTrigger>
      </TabsList>
      
      <TabsContent value="creator-stats" className="animate-fade-in">
        <CreatorStats creatorId={user.id} />
      </TabsContent>

      <TabsContent value="received-tips" className="animate-fade-in">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Tips You&apos;ve Received</CardTitle>
            <CardDescription>A log of all the support you&apos;ve gotten from your fans.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReceivedTipsList creatorId={user.id} />
          </CardContent>
        </Card>
      </TabsContent>
      
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

      <TabsContent value="activity" className="animate-fade-in">
        <ActivityFeed />
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
    </Tabs>
  );
}
