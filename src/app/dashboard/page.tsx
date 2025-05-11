
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Loader2, Gift, Users, Sparkles, ArrowRight, Palette, Music, Drama, Mic2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MyTipsList } from "@/components/dashboard/my-tips-list"; // Can show a snippet here
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { Creator } from "@/types"; // For suggested creators
import { useEffect, useState } from "react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';


const mockSuggestedCreators: Partial<Creator>[] = [
    { id: 'sugg1', fullName: 'Artistic Alice', tipHandle: '@ArtAlice', category: 'Art', profilePicUrl: 'https://picsum.photos/seed/sugg_alice/100/100', dataAiHint: "female artist" },
    { id: 'sugg2', fullName: 'Musical Mike', tipHandle: '@MikeBeats', category: 'Music', profilePicUrl: 'https://picsum.photos/seed/sugg_mike/100/100', dataAiHint: "male musician" },
    { id: 'sugg3', fullName: 'Dancing Diana', tipHandle: '@DianaDances', category: 'Dance', profilePicUrl: 'https://picsum.photos/seed/sugg_diana/100/100', dataAiHint: "female dancer" },
];

const categoryIcons: { [key: string]: React.ReactNode } = {
  Art: <Palette className="w-4 h-4" />,
  Dance: <Drama className="w-4 h-4" />,
  Music: <Music className="w-4 h-4" />,
  Comedy: <Mic2 className="w-4 h-4" />,
  Default: <Users className="w-4 h-4" />,
};

export default function SupporterDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [recentTipsCount, setRecentTipsCount] = useState(0);
  const [totalTippedAmount, setTotalTippedAmount] = useState(0);
  const [supportedCreatorsCount, setSupportedCreatorsCount] = useState(0);

  useEffect(() => {
    if (user && !user.isCreator) {
      const fetchTipStats = async () => {
        try {
          const tipsRef = collection(db, 'tips');
          const q = query(tipsRef, where('fromUserId', '==', user.id));
          const querySnapshot = await getDocs(q);
          
          let totalAmount = 0;
          const creatorIds = new Set<string>();
          querySnapshot.forEach(doc => {
            const tip = doc.data();
            totalAmount += tip.amount;
            creatorIds.add(tip.toCreatorId);
          });
          setRecentTipsCount(querySnapshot.size);
          setTotalTippedAmount(totalAmount);
          setSupportedCreatorsCount(creatorIds.size);
        } catch (error) {
          console.error("Error fetching tip stats:", error);
        }
      };
      fetchTipStats();
    }
  }, [user]);


  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  // This page should only be for supporters. Creator guard is in layout.
  // Profile completion guard is also in layout/AppRouterRedirect.
  if (!user) return null; // Handled by layout/redirect

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="animate-slide-up">
        <Card className="shadow-xl bg-gradient-to-r from-accent/10 via-background to-primary/10 border-border">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl font-bold flex items-center">
              Welcome, {user.fullName || user.username}! <Sparkles className="ml-2 h-8 w-8 text-accent animate-pulse" />
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Discover and support amazing Kenyan talent. Your generosity makes a difference!
            </CardDescription>
          </CardHeader>
           <CardContent>
             <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/creators">
                  <Users className="mr-2 h-5 w-5" /> Tip More Creators
                </Link>
              </Button>
           </CardContent>
        </Card>
      </section>

      <section className="grid md:grid-cols-3 gap-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
        <StatCard title="Total Tips Sent" value={recentTipsCount.toLocaleString()} icon={<Gift className="h-6 w-6 text-primary"/>} />
        <StatCard title="Total Amount Tipped" value={`KES ${totalTippedAmount.toLocaleString()}`} icon={<Sparkles className="h-6 w-6 text-primary"/>} />
        <StatCard title="Creators Supported" value={supportedCreatorsCount.toLocaleString()} icon={<Users className="h-6 w-6 text-primary"/>} />
      </section>

      <section className="animate-slide-up" style={{animationDelay: '0.2s'}}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Recent Tips You&apos;ve Sent</CardTitle>
            <CardDescription>A quick look at your latest support.</CardDescription>
          </CardHeader>
          <CardContent>
            <MyTipsList userId={user.id} /> {/* MyTipsList already fetches and displays */}
          </CardContent>
           <CardFooter>
            <Button variant="link" asChild className="text-primary"><Link href="/dashboard/tips">View All My Tips</Link></Button>
          </CardFooter>
        </Card>
      </section>

      <section className="animate-slide-up" style={{animationDelay: '0.3s'}}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Discover More Creators</CardTitle>
            <CardDescription>Check out these talented individuals you might like.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockSuggestedCreators.map((creator) => (
              <Link key={creator.id} href={`/creators/${creator.id}`} legacyBehavior>
              <a className="block group">
                <Card className="overflow-hidden hover:shadow-xl transition-shadow h-full">
                  <CardHeader className="p-0">
                     <Image 
                        src={creator.profilePicUrl || `https://picsum.photos/seed/${creator.id}/200/150`} 
                        alt={creator.fullName || ""} 
                        data-ai-hint={creator.dataAiHint || "profile creator"}
                        width={200} height={150} 
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                     />
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-1 group-hover:text-primary transition-colors">{creator.fullName}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground flex items-center gap-1">
                        {categoryIcons[creator.category || 'Default']} {creator.category}
                    </CardDescription>
                  </CardContent>
                </Card>
              </a>
              </Link>
            ))}
          </CardContent>
          <CardFooter>
            <Button asChild variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/creators">
                  Explore All Creators <ArrowRight className="ml-2 h-4 w-4"/>
                </Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
       {!user.isCreator && (
          <section className="text-center py-6 animate-slide-up" style={{animationDelay: '0.4s'}}>
            <Card className="shadow-lg p-6 bg-secondary/30">
                <CardTitle className="text-2xl mb-2 text-primary">Share Your Talents?</CardTitle>
                <CardDescription className="text-muted-foreground mb-4">
                    Join TipKesho as a creator and start receiving support for your work.
                </CardDescription>
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transform hover:scale-105 transition-all">
                    <Link href="/creator/onboarding">Become a Creator</Link>
                </Button>
            </Card>
          </section>
        )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
