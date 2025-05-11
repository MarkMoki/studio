
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, useEffect } from "react";
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; 
import type { Creator, User } from "@/types";

const creatorCategories = ["Art", "Music", "Dance", "Comedy", "Gaming", "Education", "Tech", "Lifestyle", "Other"];

export default function CreatorOnboardingPage() {
  const { user, firebaseUser, loading: authLoading, updateUserFirestoreProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [tipHandle, setTipHandle] = useState('');
  const [category, setCategory] = useState('');
  const [bio, setBio] = useState(user?.bio || ''); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.isCreator) {
      toast({ title: "Already a Creator", description: "Redirecting to your creator dashboard." });
      router.push('/creator/dashboard');
    }
     if (!authLoading && user && user.bio && !bio) {
      setBio(user.bio);
    }
  }, [user, authLoading, router, toast, bio]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!firebaseUser) { 
    router.push('/auth'); // Should be caught by AppRouterRedirect
    return null;
  }
   if (!user || !user.fullName || !user.phoneNumber) { // Profile must be complete first
    toast({ title: "Profile Incomplete", description: "Please complete your main profile before becoming a creator.", variant: "destructive" });
    router.push('/auth'); // Redirect to auth page for profile completion
    return null;
  }


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !user) { // Ensure user is also available for its properties
        toast({ title: "Error", description: "You must be logged in.", variant : "destructive"});
        return;
    }
    if (!tipHandle.match(/^@([a-zA-Z0-9_]+)$/)) {
      toast({ title: "Invalid Tip Handle", description: "Handle must start with @ and contain letters, numbers, or underscores.", variant : "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "Category Required", description: "Please select a creator category.", variant : "destructive" });
      return;
    }
    if (!bio.trim()) {
      toast({ title: "Bio Required", description: "Please provide a short bio.", variant : "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const userUpdatePayload: Partial<User> = { 
        isCreator: true, 
        tipHandle: tipHandle, 
        category: category, 
        bio: bio, // Update user's main bio as well
        updatedAt: serverTimestamp()
      };
      await updateUserFirestoreProfile(firebaseUser.uid, userUpdatePayload);

      const creatorDocRef = doc(db, "creators", firebaseUser.uid);
      const existingCreatorDoc = await getDoc(creatorDocRef);

      const creatorData: Partial<Creator> = {
        userId: firebaseUser.uid,
        tipHandle: tipHandle,
        fullName: user.fullName, // From existing AuthUser
        profilePicUrl: user.profilePicUrl, // From existing AuthUser
        coverImageUrl: existingCreatorDoc.data()?.coverImageUrl || null,
        bio: bio,
        category: category,
        totalTips: existingCreatorDoc.data()?.totalTips || 0,
        totalAmountReceived: existingCreatorDoc.data()?.totalAmountReceived || 0,
        active: true,
        featured: existingCreatorDoc.data()?.featured || false,
        socialLinks: existingCreatorDoc.data()?.socialLinks || [],
        email: user.email, // From existing AuthUser
        phoneNumber: user.phoneNumber, // From existing AuthUser
        updatedAt: serverTimestamp(),
      };
      if (!existingCreatorDoc.exists() || !existingCreatorDoc.data()?.createdAt) {
        creatorData.createdAt = serverTimestamp();
      }
      
      const cleanedCreatorData = Object.fromEntries(Object.entries(creatorData).filter(([_,v]) => v !== undefined)) as Partial<Creator>;
      await setDoc(creatorDocRef, cleanedCreatorData, { merge: true });

      toast({
        title: "You're a Creator! 🎉",
        description: "Your creator profile is set up. Redirecting to your dashboard...",
        action: <CheckCircle className="text-green-500" />,
      });
      
      router.push('/creator/dashboard');
    } catch (error) {
      console.error("Error submitting creator application:", error);
      toast({ title: "Submission Failed", description: (error as Error).message, variant : "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12 animate-fade-in">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Become a TipKesho Creator</CardTitle>
          <CardDescription>Share your talent and start receiving support from your fans!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit = {handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="tipHandle">Your Unique Tip Handle (e.g., @YourName)</Label>
              <Input 
                id="tipHandle" 
                placeholder="@MyAwesomeCreations" 
                value={tipHandle} 
                onChange={(e) => setTipHandle(e.target.value)} 
                required 
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">This will be your public tipping link: tipkesho.com/{tipHandle.startsWith('@') ? tipHandle.substring(1) : tipHandle}</p>
            </div>
            
            <div>
              <Label htmlFor="category">Primary Content Category</Label>
              <Select onValueChange={setCategory} value={category} required>
                <SelectTrigger id="category" className="w-full mt-1">
                  <SelectValue placeholder="Select your category" />
                </SelectTrigger>
                <SelectContent>
                  {creatorCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bio">Public Creator Bio (Tell fans about you & your content)</Label>
              <Textarea 
                id="bio" 
                placeholder="E.g., I create amazing digital art inspired by Kenyan culture..." 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                rows={4}
                required
                className="mt-1"
                maxLength={500}
              />
               <p className="text-xs text-muted-foreground mt-1">This will be shown on your public creator profile.</p>
            </div>
            
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-lg" disabled={isSubmitting || authLoading}>
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldAlert className="mr-2 h-5 w-5"/>}
              Finalize Creator Profile
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-xs text-muted-foreground">
            By applying, you agree to TipKesho&apos;s Creator Terms and Conditions.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
