
"use client";
import { useAuth } from "@/hooks/use-auth";
import { CreatorStats } from "@/components/dashboard/creator-stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Link as LinkIcon, Loader2, BarChart3, Users, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

// Mock data for recent supporters/top supporters - replace with actual data fetching
const mockRecentSupporters = [
  { id: '1', name: 'Aisha N.', amount: 250, message: "Love your art!" },
  { id: '2', name: 'John K.', amount: 100, message: "Keep it up!" },
  { id: '3', name: 'Brenda W.', amount: 500, message: "Amazing content!" },
];

const mockTopSupporters = [
  { id: '3', name: 'Brenda W.', totalTipped: 1500 },
  { id: '1', name: 'Aisha N.', totalTipped: 750 },
  { id: '4', name: 'Mike O.', totalTipped: 600 },
];

export default function CreatorDashboardPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!user || !user.isCreator) {
    // This should ideally be handled by layout auth guard
    return <p>Access Denied. You must be a creator to view this page.</p>;
  }

  const tipLink = user.tipHandle ? `${window.location.origin}/creators/${user.id}` : 'Not set';

  const handleShareLink = () => {
    if (user.tipHandle) {
      navigator.clipboard.writeText(tipLink)
        .then(() => toast({ title: "Link Copied!", description: "Your TipKesho link is copied to clipboard." }))
        .catch(() => toast({ title: "Copy Failed", description: "Could not copy link. Please try manually.", variant: "destructive" }));
    } else {
      toast({ title: "No Tip Handle", description: "Set up your tip handle in settings first.", variant: "destructive" });
    }
  };
  
  return (
    <div className="space-y-8">
      <section className="animate-fade-in">
        <Card className="shadow-xl bg-gradient-to-r from-primary/10 via-background to-accent/10 border-border">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl font-bold">Welcome back, {user.fullName || user.username}!</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">Here&apos;s what&apos;s happening with your TipKesho profile.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleShareLink} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Share2 className="mr-2 h-5 w-5" /> Share Your Tip Link
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/creator/withdrawals">
                <Coins className="mr-2 h-5 w-5" /> Manage Withdrawals
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <CreatorStats creatorId={user.id} />

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg animate-slide-up" style={{animationDelay: '0.3s'}}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="text-primary"/> Recent Supporters</CardTitle>
            <CardDescription>Latest fans who&apos;ve tipped you.</CardDescription>
          </CardHeader>
          <CardContent>
            {mockRecentSupporters.length > 0 ? (
              <ul className="space-y-3">
                {mockRecentSupporters.map(supporter => (
                  <li key={supporter.id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
                    <div>
                      <p className="font-semibold">{supporter.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-xs">{supporter.message}</p>
                    </div>
                    <span className="font-bold text-accent">KES {supporter.amount}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent supporters yet.</p>
            )}
             <Button variant="link" asChild className="mt-4 text-primary p-0"><Link href="/creator/tips">View All Tips</Link></Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg animate-slide-up" style={{animationDelay: '0.4s'}}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="text-primary"/> Top Supporters</CardTitle>
            <CardDescription>Your most generous fans.</CardDescription>
          </CardHeader>
          <CardContent>
            {mockTopSupporters.length > 0 ? (
            <ul className="space-y-3">
              {mockTopSupporters.map(supporter => (
                <li key={supporter.id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
                  <p className="font-semibold">{supporter.name}</p>
                  <span className="font-bold text-green-500">KES {supporter.totalTipped.toLocaleString()}</span>
                </li>
              ))}
            </ul>
             ) : (
              <p className="text-muted-foreground text-center py-4">No supporter data available.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg animate-slide-up" style={{animationDelay: '0.5s'}}>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Coins className="text-primary"/>Pending Withdrawals</CardTitle>
            <CardDescription>Status of your requested payouts.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <p className="text-muted-foreground py-4">No pending withdrawals currently.</p>
            {/* Logic to display pending withdrawals will go here */}
            <Button asChild variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/creator/withdrawals">
                Request a Withdrawal
              </Link>
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
