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
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; // Removed updateDoc as setDoc({merge:true}) handles it
import type { Creator, User } from "@/types";

const creatorCategories = ["Art", "Music", "Dance", "Comedy", "Gaming", "Education", "Tech", "Lifestyle", "Other"];

export default function BecomeCreatorPage() {
  const { user, firebaseUser, loading: authLoading, updateUserFirestoreProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [tipHandle, setTipHandle] = useState('');
  const [category, setCategory] = useState('');
  const [bio, setBio] = useState(user?.bio || ''); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.isCreator) {
      toast({ title: "Already a Creator", description: "Redirecting to your dashboard." });
      router.push('/dashboard');
    }
     if (!authLoading && user && user.bio && !bio) { // Pre-fill bio if user has one and form field is empty
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
    router.push('/auth');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
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
      // 1. Update user document in 'users' collection
      const userUpdatePayload: Partial<User> = { 
        isCreator: true, 
        tipHandle: tipHandle, 
        category: category, 
        bio: bio,
        updatedAt: serverTimestamp() // ensure updatedAt is part of the update
      };
      await updateUserFirestoreProfile(firebaseUser.uid, userUpdatePayload);

      // 2. Create/Update creator document in 'creators' collection
      const creatorDocRef = doc(db, "creators", firebaseUser.uid);
      const existingCreatorDoc = await getDoc(creatorDocRef);

      const creatorData: Partial<Creator> = {
        userId: firebaseUser.uid,
        tipHandle: tipHandle,
        fullName: user?.fullName || firebaseUser.displayName || null,
        profilePicUrl: user?.profilePicUrl || firebaseUser.photoURL || null,
        coverImageUrl: existingCreatorDoc.data()?.coverImageUrl || null, // Preserve existing or null
        bio: bio,
        category: category,
        totalTips: existingCreatorDoc.data()?.totalTips || 0, // Preserve existing
        totalAmountReceived: existingCreatorDoc.data()?.totalAmountReceived || 0, // Preserve existing
        active: true,
        featured: existingCreatorDoc.data()?.featured || false, // Preserve existing
        socialLinks: existingCreatorDoc.data()?.socialLinks || [], // Preserve existing
        email: user?.email || firebaseUser.email || null,
        phoneNumber: user?.phoneNumber || firebaseUser.phoneNumber || null,
        updatedAt: serverTimestamp(),
      };
      if (!existingCreatorDoc.exists() || !existingCreatorDoc.data()?.createdAt) {
        creatorData.createdAt = serverTimestamp();
      }
      
      const cleanedCreatorData = Object.fromEntries(Object.entries(creatorData).filter(([_,v]) => v !== undefined)) as Partial<Creator>;
      await setDoc(creatorDocRef, cleanedCreatorData, { merge: true });

      toast({
        title: "Application Submitted!",
        description: "Your creator profile is set up. You'll be redirected shortly.",
        action: <CheckCircle className="text-green-500" />,
      });
      
      router.push('/dashboard');
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
              <Label htmlFor="bio">Short Bio (Tell fans about you & your content)</Label>
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
            </div>
            
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-lg" disabled={isSubmitting || authLoading}>
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldAlert className="mr-2 h-5 w-5"/>}
              Submit Application
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
