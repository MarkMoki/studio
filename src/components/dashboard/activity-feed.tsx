
"use client";

import type { Tip, User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Gift, UserPlus, TrendingUp, Coins, Send, Loader2, AlertTriangle, Newspaper } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

interface ActivityItem {
  id: string;
  type: 'tip_received' | 'tip_sent';
  timestamp: string | Date | Timestamp;
  title: string;
  description?: string;
  icon: React.ReactNode;
  link?: string; 
}

export function ActivityFeed() {
  const { user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      if (!authLoading && !user) setError("User not authenticated.");
      return;
    }

    const fetchActivities = async () => {
      setLoading(true);
      setError(null);
      try {
        const tipsRef = collection(db, 'tips');
        let q;
        const fetchedActivities: ActivityItem[] = [];

        if (user.isCreator) {
          // Fetch tips received by the creator
          q = query(tipsRef, where('toCreatorId', '==', user.id), orderBy('timestamp', 'desc'), limit(10));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            const tip = doc.data() as Tip;
            fetchedActivities.push({
              id: doc.id,
              type: 'tip_received',
              timestamp: (tip.timestamp as Timestamp)?.toDate ? (tip.timestamp as Timestamp).toDate().toISOString() : tip.timestamp as string,
              title: `You received a KES ${tip.amount.toLocaleString()} tip!`,
              description: `From ${tip.fromUsername || 'Anonymous Supporter'}. ${tip.message ? `Message: "${tip.message}"` : ''}`,
              icon: <Coins className="w-5 h-5 text-accent" />,
              link: `/creators/${user.id}` // Link to their own profile or a specific tip detail page if exists
            });
          });
        } else {
          // Fetch tips sent by the supporter
          q = query(tipsRef, where('fromUserId', '==', user.id), orderBy('timestamp', 'desc'), limit(10));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            const tip = doc.data() as Tip;
            fetchedActivities.push({
              id: doc.id,
              type: 'tip_sent',
              timestamp: (tip.timestamp as Timestamp)?.toDate ? (tip.timestamp as Timestamp).toDate().toISOString() : tip.timestamp as string,
              title: `You sent KES ${tip.amount.toLocaleString()} to ${tip.toCreatorHandle || 'a creator'}!`,
              description: tip.message ? `Your message: "${tip.message}"` : 'Thank you for your support!',
              icon: <Send className="w-5 h-5 text-primary" />,
              link: `/creators/${tip.toCreatorId}`
            });
          });
        }
        setActivities(fetchedActivities);
      } catch (err) {
        console.error("Error fetching activities:", err);
        setError("Failed to load activities. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><Newspaper className="w-6 h-6 text-primary" /> Activity Feed</CardTitle>
          <CardDescription>Loading recent events...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
     return (
      <Card className="shadow-lg border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="w-6 h-6"/>Error</CardTitle>
          <CardDescription className="text-destructive/80">Could not load activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Newspaper className="w-6 h-6 text-primary" /> Activity Feed
        </CardTitle>
        <CardDescription>Stay updated with recent events and notifications.</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-10 animate-fade-in">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No recent activity to show.</p>
            {user && !user.isCreator && (
                 <Button asChild variant="link" className="text-primary mt-2">
                    <Link href="/creators">Discover creators to support</Link>
                </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity, index) => (
              <div 
                key={activity.id} 
                className="flex items-start gap-4 p-4 border-b last:border-b-0 animate-slide-up hover:bg-secondary/30 rounded-md transition-colors"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-3 bg-muted rounded-full mt-1 shadow-sm">
                  {activity.icon}
                </div>
                <div className="flex-grow">
                  <Link href={activity.link || "#"} className="group">
                    <p className="font-semibold group-hover:text-primary transition-colors">{activity.title}</p>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{activity.description}</p>
                    )}
                  </Link>
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp as string), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
