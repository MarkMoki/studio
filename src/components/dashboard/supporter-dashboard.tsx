
"use client";

import type { AuthUser } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyTipsList } from "@/components/dashboard/my-tips-list";
import { UserProfileForm } from "@/components/dashboard/user-profile-form";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCog, Gift, Newspaper } from "lucide-react";

interface SupporterDashboardProps {
  user: AuthUser;
}

export function SupporterDashboard({ user }: SupporterDashboardProps) {
  return (
    <Tabs defaultValue="my-tips" className="w-full animate-slide-up" style={{animationDelay: '0.2s'}}>
      <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2 sm:grid-cols-3 lg:grid-cols-none mb-6 shadow-sm flex-wrap">
        <TabsTrigger value="my-tips" className="text-sm md:text-base"><Gift className="w-4 h-4 mr-2"/>My Sent Tips</TabsTrigger>
        <TabsTrigger value="activity" className="text-sm md:text-base"><Newspaper className="w-4 h-4 mr-2"/>Activity</TabsTrigger>
        <TabsTrigger value="my-profile" className="text-sm md:text-base"><UserCog className="w-4 h-4 mr-2"/>My Account</TabsTrigger>
      </TabsList>
      
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
