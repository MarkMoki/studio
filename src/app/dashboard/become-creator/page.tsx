"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const creatorCategories = ["Art", "Music", "Dance", "Comedy", "Gaming", "Education", "Tech", "Lifestyle", "Other"];

export default function BecomeCreatorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [tipHandle, setTipHandle] = useState('');
  const [category, setCategory] = useState('');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }
  
  if (user.isCreator) {
     router.push('/dashboard'); // Already a creator, redirect to dashboard
     return null;
  }


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call to update user to creator
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real app, you would update the user's status in Firebase/backend
    // and create a creator profile.
    // For this mock, we'll just show a success toast and redirect.
    
    console.log("Creator application:", { userId: user.id, tipHandle, category, bio });
    toast({
      title: "Application Submitted!",
      description: "Your creator profile is being set up. You'll be redirected shortly.",
      action: <CheckCircle className="text-green-500" />,
    });

    // Simulate updating auth state - in real app, this would come from backend/auth provider
    // For now, to reflect change immediately, we might need a way to update useAuth's user
    // Or, on next load of dashboard, it would reflect. Let's assume redirect is enough.
    
    setIsSubmitting(false);
    router.push('/dashboard'); // Redirect to dashboard where they might see creator stats
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Become a TipKesho Creator</CardTitle>
          <CardDescription>Share your talent and start receiving support from your fans!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <p className="text-xs text-muted-foreground mt-1">This will be your public tipping link: tipkesho.com/{tipHandle}</p>
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
              <Label htmlFor="bio">Short Bio (Tell us about yourself and your content)</Label>
              <Textarea 
                id="bio" 
                placeholder="E.g., I create amazing digital art inspired by Kenyan culture..." 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                rows={4}
                required
                className="mt-1"
              />
            </div>
            
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
