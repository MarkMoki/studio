"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatorPublicProfileForm } from "@/components/dashboard/creator-public-profile-form";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CreatorProfileManagementPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Should be caught by dashboard page, but as a fallback
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-semibold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You must be signed in to manage a creator profile.</p>
        <Button asChild className="mt-6">
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (!user.isCreator) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
        <h1 className="mt-4 text-2xl font-semibold">Not a Creator</h1>
        <p className="mt-2 text-muted-foreground">This page is for registered creators. Want to become one?</p>
        <Button asChild className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/dashboard/become-creator">Become a Creator</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <Card className="shadow-xl animate-fade-in">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Manage Your Creator Profile</CardTitle>
          <CardDescription className="text-lg">
            This is how fans see you! Keep your profile fresh and engaging.
          </CardDescription>
        </CardHeader>
        <CardContent className="animate-slide-up" style={{animationDelay: '0.2s'}}>
          <CreatorPublicProfileForm creatorId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
