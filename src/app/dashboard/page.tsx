
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2, Gift, Users, Sparkles, ArrowRight, Palette, Music, Drama, Mic2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MyTipsList } from "@/components/dashboard/my-tips-list";
import Image from "next/image";
import type { Creator } from "@/types";
import { useEffect, useState } from "react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { ActivityFeed } from "@/components/dashboard/activity-feed";

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
  const [suggestedCreators, setSuggestedCreators] = useState<Creator[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(true);

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

  useEffect(() => {
    if (user && !user.isCreator) { 
        const fetchSuggestedCreators = async () => {
            setLoadingSuggested(true);
            try {
                const creatorsRef = collection(db, 'creators');
                const q = query(
                    creatorsRef,
                    where('active', '==', true),
                    orderBy('totalAmountReceived', 'desc'),
                    limit(3) 
                );
                const querySnapshot = await getDocs(q);
                const fetchedCreators: Creator[] = [];
                querySnapshot.forEach((doc) => {
                  if (doc.id !== user.id) { 
                    fetchedCreators.push({ id: doc.id, ...doc.data() } as Creator);
                  }
                });
                setSuggestedCreators(fetchedCreators.slice(0,3)); 
            } catch (error) {
                console.error("Error fetching suggested creators:", error);
            } finally {
                setLoadingSuggested(false);
            }
        };
        fetchSuggestedCreators();
    } else {
      setLoadingSuggested(false); 
      setSuggestedCreators([]);
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

  if (!user || user.isCreator || !user.fullName || !user.phoneNumber) return null;


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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <Card className="shadow-lg h-full">
            <CardHeader>
                <CardTitle className="text-2xl">Recent Tips You&apos;ve Sent</CardTitle>
                <CardDescription>A quick look at your latest support.</CardDescription>
            </CardHeader>
            <CardContent>
                <MyTipsList userId={user.id} />
            </CardContent>
            <CardFooter>
                <Button variant="link" asChild className="text-primary"><Link href="/dashboard/tips">View All My Tips</Link></Button>
            </CardFooter>
            </Card>
        </section>
        <section className="lg:col-span-1 animate-slide-up" style={{animationDelay: '0.25s'}}>
          <ActivityFeed />
        </section>
      </div>


      <section className="animate-slide-up" style={{animationDelay: '0.3s'}}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Discover More Creators</CardTitle>
            <CardDescription>Check out these talented individuals you might like.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingSuggested ? (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                <p className="ml-2 text-muted-foreground">Loading suggestions...</p>
              </div>
            ) : suggestedCreators.length > 0 ? (
              suggestedCreators.map((creator) => (
                <Link key={creator.id} href={`/creators/${creator.id}`} legacyBehavior>
                <a className="block group">
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow h-full">
                    <CardHeader className="p-0">
                       <Image 
                          src={creator.profilePicUrl || `https://picsum.photos/seed/${creator.id}/200/150`} 
                          alt={creator.fullName || creator.tipHandle || ""} 
                          data-ai-hint={creator.profilePicUrl ? "profile creator" : "abstract pattern"}
                          width={200} height={150} 
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                       />
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="text-lg mb-1 group-hover:text-primary transition-colors">{creator.fullName || creator.tipHandle}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground flex items-center gap-1">
                          {categoryIcons[creator.category] || categoryIcons.Default} {creator.category}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </a>
                </Link>
              ))
            ) : (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-10">
                <p className="text-muted-foreground">No suggested creators at the moment. <Link href="/creators" className="text-primary hover:underline">Explore all creators</Link>.</p>
              </div>
            )}
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
       {!user.isCreator && user.fullName && user.phoneNumber && ( 
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

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
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

    
