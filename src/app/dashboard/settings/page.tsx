
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfileForm } from "@/components/dashboard/user-profile-form";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertTriangle, Settings as SettingsIcon, CreditCard, Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SupporterSettingsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-semibold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You must be signed in to view settings.</p>
        <Button asChild className="mt-6">
          <Link href="/auth">Sign In</Link>
        </Button>
      </div>
    );
  }
  // Redirect if user is a creator and tries to access supporter settings
  if (user.isCreator) {
    // In a real app, you might redirect to /creator/settings or show a message
    // For now, let's assume layout handles this redirection.
    // router.replace('/creator/settings'); 
    // return null;
  }
  
  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <SettingsIcon className="mr-3 h-8 w-8 text-primary"/>
          Supporter Settings
        </h1>
      </div>

      <Card className="shadow-xl animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Account Information</CardTitle>
          <CardDescription className="text-lg">
            Update your personal details.
          </CardDescription>
        </CardHeader>
        <CardContent className="animate-slide-up" style={{animationDelay: '0.2s'}}>
          <UserProfileForm user={user} />
        </CardContent>
      </Card>

      <Card className="shadow-xl animate-fade-in" style={{animationDelay: '0.3s'}}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center"><CreditCard className="mr-2 h-6 w-6"/>Payment Methods</CardTitle>
          <CardDescription className="text-lg">
            Manage your preferred payment method for tipping.
          </CardDescription>
        </CardHeader>
        <CardContent className="animate-slide-up" style={{animationDelay: '0.4s'}}>
            <div className="p-4 border rounded-md bg-secondary/30">
                <p className="font-semibold">Default: M-Pesa</p>
                <p className="text-sm text-muted-foreground">Your phone number ({user.phoneNumber || "Not set"}) will be used for M-Pesa payments.</p>
                {/* Placeholder for adding/changing payment methods */}
            </div>
            <Button variant="outline" className="mt-4" disabled>Manage Payment Methods (Coming Soon)</Button>
        </CardContent>
      </Card>

      <Card className="shadow-xl animate-fade-in" style={{animationDelay: '0.5s'}}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center"><Bell className="mr-2 h-6 w-6"/>Notification Preferences</CardTitle>
          <CardDescription className="text-lg">
            Choose what updates you want to receive from TipKesho.
          </CardDescription>
        </CardHeader>
        <CardContent className="animate-slide-up space-y-4" style={{animationDelay: '0.6s'}}>
            <div className="flex items-center justify-between p-3 border rounded-md bg-secondary/20">
                <Label htmlFor="newCreatorNotification" className="flex-grow text-base">New Creator Alerts</Label>
                <Switch id="newCreatorNotification" disabled />
            </div>
             <div className="flex items-center justify-between p-3 border rounded-md bg-secondary/20">
                <Label htmlFor="promoNotification" className="flex-grow text-base">Promotions & Updates</Label>
                <Switch id="promoNotification" disabled defaultChecked/>
            </div>
            <p className="text-xs text-muted-foreground">Notification settings are currently placeholders.</p>
        </CardContent>
      </Card>
    </div>
  );
}
