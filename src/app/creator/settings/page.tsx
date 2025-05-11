
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfileForm } from "@/components/dashboard/user-profile-form";
import { CreatorPublicProfileForm } from "@/components/dashboard/creator-public-profile-form";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertTriangle, Settings as SettingsIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CreatorSettingsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Should be caught by layout/AppRouterRedirect, but as a fallback
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-semibold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You must be signed in.</p>
        <Button asChild className="mt-6">
          <Link href="/auth">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (!user.isCreator) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
        <h1 className="mt-4 text-2xl font-semibold">Not a Creator</h1>
        <p className="mt-2 text-muted-foreground">This settings page is for registered creators.</p>
        <Button asChild className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/creator/onboarding">Become a Creator</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <SettingsIcon className="mr-3 h-8 w-8 text-primary"/>
          Creator Settings
        </h1>
      </div>

      <Tabs defaultValue="public-profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex mb-6 shadow-sm">
          <TabsTrigger value="public-profile">Public Creator Profile</TabsTrigger>
          <TabsTrigger value="account-settings">Account Settings</TabsTrigger>
          <TabsTrigger value="danger-zone">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="public-profile">
          <Card className="shadow-xl animate-fade-in">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">Manage Your Public Creator Profile</CardTitle>
              <CardDescription className="text-lg">
                This is how fans see you! Keep your profile fresh and engaging.
              </CardDescription>
            </CardHeader>
            <CardContent className="animate-slide-up" style={{animationDelay: '0.2s'}}>
              <CreatorPublicProfileForm creatorId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account-settings">
          <Card className="shadow-xl animate-fade-in">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">Account Information</CardTitle>
              <CardDescription className="text-lg">
                Manage your general account details.
              </CardDescription>
            </CardHeader>
            <CardContent className="animate-slide-up" style={{animationDelay: '0.2s'}}>
              <UserProfileForm user={user} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger-zone">
          <Card className="shadow-xl animate-fade-in border-destructive bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-destructive">Danger Zone</CardTitle>
              <CardDescription className="text-lg text-destructive/80">
                Critical actions regarding your account. Proceed with caution.
              </CardDescription>
            </CardHeader>
            <CardContent className="animate-slide-up space-y-4" style={{animationDelay: '0.2s'}}>
              <div>
                <h3 className="font-semibold text-lg">Toggle Profile Visibility</h3>
                <p className="text-sm text-muted-foreground mb-2">Temporarily hide your creator profile from public discovery. You can re-enable it anytime.</p>
                <Button variant="outline" disabled>Toggle Visibility (Coming Soon)</Button>
              </div>
               <div className="pt-4 border-t border-destructive/20">
                <h3 className="font-semibold text-lg text-destructive">Delete Account</h3>
                <p className="text-sm text-muted-foreground mb-2">Permanently delete your TipKesho account and all associated data. This action cannot be undone.</p>
                <Button variant="destructive" disabled>Delete Account (Coming Soon)</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
