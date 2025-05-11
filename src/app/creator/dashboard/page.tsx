
"use client";
import { useAuth } from "@/hooks/use-auth";
import { CreatorStats } from "@/components/dashboard/creator-stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2, Coins, Loader2, BarChart3, Users, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ReceivedTipsList } from "@/components/dashboard/received-tips-list";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Tip, User as AuthUserType } from "@/types"; // Renamed User to AuthUserType

interface TopSupporter extends Partial<AuthUserType> {
  id: string; // fromUserId
  totalTipped: number;
  displayName: string;
  profilePicUrl?: string | null;
}

export default function CreatorDashboardPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [topSupporters, setTopSupporters] = useState<TopSupporter[]>([]);
  const [loadingSupporters, setLoadingSupporters] = useState(true);

  useEffect(() => {
    if (user?.id) {
      const fetchTopSupporters = async () => {
        setLoadingSupporters(true);
        try {
          const tipsRef = collection(db, 'tips');
          const q = query(tipsRef, where('toCreatorId', '==', user.id), orderBy('timestamp', 'desc'));
          const tipsSnapshot = await getDocs(q);

          const supporterMap: Record<string, { totalTipped: number; count: number; latestUsername?: string }> = {};
          tipsSnapshot.forEach(tipDoc => {
            const tip = tipDoc.data() as Tip;
            if (tip.fromUserId && tip.fromUserId !== 'anonymous') { // Exclude anonymous tips from top supporters
              if (!supporterMap[tip.fromUserId]) {
                supporterMap[tip.fromUserId] = { totalTipped: 0, count: 0, latestUsername: tip.fromUsername };
              }
              supporterMap[tip.fromUserId].totalTipped += tip.amount;
              supporterMap[tip.fromUserId].count += 1;
              if(tip.fromUsername) supporterMap[tip.fromUserId].latestUsername = tip.fromUsername;
            }
          });
          
          const sortedSupporters = Object.entries(supporterMap)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.totalTipped - a.totalTipped)
            .slice(0, 5); // Get top 5

          const enrichedSupporters: TopSupporter[] = await Promise.all(
            sortedSupporters.map(async (supporter) => {
              let displayName = supporter.latestUsername || 'Supporter';
              let profilePicUrl: string | null = null;
              try {
                const userDocRef = doc(db, 'users', supporter.id);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                  const userData = userDocSnap.data() as AuthUserType;
                  displayName = userData.fullName || userData.username || displayName;
                  profilePicUrl = userData.profilePicUrl || null;
                }
              } catch (e) { console.warn(`Failed to fetch profile for ${supporter.id}`, e); }
              
              return {
                id: supporter.id,
                totalTipped: supporter.totalTipped,
                displayName: displayName,
                profilePicUrl: profilePicUrl,
              };
            })
          );
          setTopSupporters(enrichedSupporters);
        } catch (error) {
          console.error("Error fetching top supporters:", error);
          toast({ title: "Error", description: "Could not load top supporters.", variant: "destructive" });
        } finally {
          setLoadingSupporters(false);
        }
      };
      fetchTopSupporters();
    }
  }, [user, toast]);
  
  const getInitials = (name?: string | null) => {
    if (!name) return "S";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };


  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  // AppRouterRedirect handles these cases, but good as fallbacks
  if (!user || !user.isCreator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">You must be a registered creator to view this page.</p>
        <Link href="/auth"><Button>Sign In or Sign Up</Button></Link>
      </div>
    );
  }
  if (!user.fullName || !user.phoneNumber) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-4">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Profile Incomplete</h1>
        <p className="text-muted-foreground mb-4">Please complete your profile to access the creator dashboard.</p>
        <Link href="/auth"><Button>Complete Profile</Button></Link>
      </div>
    );
  }

  const tipLink = user.tipHandle ? `${typeof window !== 'undefined' ? window.location.origin : ''}/creators/${user.id}` : 'Not set';

  const handleShareLink = () => {
    if (user.id && typeof window !== 'undefined') { // Changed from tipHandle to user.id for link consistency
      const creatorProfileLink = `${window.location.origin}/creators/${user.id}`;
      navigator.clipboard.writeText(creatorProfileLink)
        .then(() => toast({ title: "Link Copied!", description: "Your TipKesho profile link is copied." }))
        .catch(() => toast({ title: "Copy Failed", description: "Could not copy link.", variant: "destructive" }));
    } else {
      toast({ title: "Link Unavailable", description: "Your creator profile link could not be generated.", variant: "destructive" });
    }
  };
  
  return (
    <div className="space-y-6 md:space-y-8">
      <section className="animate-fade-in">
        <Card className="shadow-xl bg-gradient-to-r from-primary/10 via-background to-accent/10 border-border">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl font-bold">Welcome back, {user.fullName || user.username}!</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">Here&apos;s what&apos;s happening with your TipKesho profile.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button onClick={handleShareLink} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
              <Share2 className="mr-2 h-5 w-5" /> Share Profile Link
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/creator/withdrawals">
                <Coins className="mr-2 h-5 w-5" /> Manage Withdrawals
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <CreatorStats creatorId={user.id} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg animate-slide-up flex flex-col" style={{animationDelay: '0.3s'}}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="text-primary"/> Recent Supporters</CardTitle>
            <CardDescription>Latest fans who&apos;ve tipped you.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow max-h-96 overflow-y-auto">
            <ReceivedTipsList creatorId={user.id} /> 
          </CardContent>
          <CardFooter>
             <Button variant="link" asChild className="text-primary p-0"><Link href="/creator/tips">View All Tips</Link></Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg animate-slide-up flex flex-col" style={{animationDelay: '0.4s'}}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="text-primary"/> Top Supporters</CardTitle>
            <CardDescription>Your most generous fans (Top 5).</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow max-h-96 overflow-y-auto">
            {loadingSupporters ? (
              <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
            ) : topSupporters.length > 0 ? (
            <ul className="space-y-4">
              {topSupporters.map(supporter => (
                <li key={supporter.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg shadow-sm hover:bg-secondary/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-accent">
                      <AvatarImage src={supporter.profilePicUrl || undefined} alt={supporter.displayName} data-ai-hint="avatar supporter" />
                      <AvatarFallback>{getInitials(supporter.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-foreground">{supporter.displayName}</span>
                  </div>
                  <span className="font-bold text-green-500 text-sm sm:text-base">KES {supporter.totalTipped.toLocaleString()}</span>
                </li>
              ))}
            </ul>
             ) : (
              <p className="text-muted-foreground text-center py-6">No supporter data available yet.</p>
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
            <p className="text-muted-foreground py-4">No pending withdrawals currently. (Feature coming soon)</p>
            <Button asChild variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
              <Link href="/creator/withdrawals">
                Request a Withdrawal
              </Link>
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
