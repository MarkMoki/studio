
"use client";

import type { Tip, User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Loader2, Coins, UserCircle } from 'lucide-react';

interface ReceivedTipsListProps {
  creatorId: string;
}

interface EnrichedTip extends Tip {
  supporterProfile?: Partial<User>;
}

export function ReceivedTipsList({ creatorId }: ReceivedTipsListProps) {
  const [enrichedTips, setEnrichedTips] = useState<EnrichedTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creatorId) {
      setLoading(false);
      setError("Creator ID is missing.");
      return;
    }

    const fetchReceivedTips = async () => {
      setLoading(true);
      setError(null);
      try {
        const tipsRef = collection(db, 'tips');
        const q = query(tipsRef, where('toCreatorId', '==', creatorId), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const fetchedTips: Tip[] = [];
        querySnapshot.forEach((tipDoc) => {
          const data = tipDoc.data();
          fetchedTips.push({ 
            id: tipDoc.id, 
            ...data,
            timestamp: (data.timestamp as Timestamp)?.toDate ? (data.timestamp as Timestamp).toDate().toISOString() : data.timestamp,
          } as Tip);
        });

        // Fetch supporter profiles
        const supporterIds = Array.from(new Set(fetchedTips.map(tip => tip.fromUserId)));
        const supporterProfiles: Record<string, Partial<User>> = {};

        for (const id of supporterIds) {
          if (id === 'anonymous') continue; // Skip fetching for explicitly anonymous
          try {
            const userDocRef = doc(db, 'users', id);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              supporterProfiles[id] = { id: userDocSnap.id, ...userDocSnap.data() } as Partial<User>;
            }
          } catch (profileError) {
            console.warn(`Could not fetch profile for supporter ${id}:`, profileError);
          }
        }

        const finalEnrichedTips = fetchedTips.map(tip => ({
          ...tip,
          supporterProfile: tip.fromUserId !== 'anonymous' ? supporterProfiles[tip.fromUserId] : undefined
        }));

        setEnrichedTips(finalEnrichedTips);

      } catch (err) {
        console.error("Error fetching received tips:", err);
        setError("Failed to load received tips. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReceivedTips();
  }, [creatorId]);

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading received tips...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-destructive py-8">{error}</p>;
  }

  if (enrichedTips.length === 0) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-3">No tips received yet.</p>
        <p className="text-sm text-muted-foreground">Share your profile to start receiving support!</p>
        <Button asChild variant="link" className="text-primary mt-2">
          <Link href={`/creators/${creatorId}`}>View Your Public Profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From Supporter</TableHead>
            <TableHead className="text-right">Amount (KES)</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrichedTips.map((tip, index) => (
            <TableRow 
              key={tip.id} 
              className="animate-slide-up"
              style={{animationDelay: `${index * 0.05}s`}}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={tip.supporterProfile?.profilePicUrl || undefined} alt={tip.fromUsername} data-ai-hint="avatar supporter" />
                    <AvatarFallback>
                      {tip.fromUserId === 'anonymous' ? 'A' : getInitials(tip.supporterProfile?.fullName || tip.fromUsername)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {tip.fromUserId === 'anonymous' ? 'Anonymous Supporter' : (tip.supporterProfile?.fullName || tip.fromUsername || 'Supporter')}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right font-semibold text-accent">{tip.amount.toLocaleString()}</TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">
                {tip.message || <span className="italic">No message</span>}
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(tip.timestamp as string), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
