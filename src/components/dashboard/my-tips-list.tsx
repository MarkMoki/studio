
"use client";

import type { Tip } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Loader2, Gift } from 'lucide-react';

interface MyTipsListProps {
  userId: string;
}

export function MyTipsList({ userId }: MyTipsListProps) {
  const [userTips, setUserTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError("User ID is missing.");
      return;
    }

    const fetchUserTips = async () => {
      setLoading(true);
      setError(null);
      try {
        const tipsRef = collection(db, 'tips');
        const q = query(tipsRef, where('fromUserId', '==', userId), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedTips: Tip[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedTips.push({ 
            id: doc.id, 
            ...data,
            // Ensure timestamp is a string for formatDistanceToNow if it's Firestore Timestamp
            timestamp: (data.timestamp as Timestamp)?.toDate ? (data.timestamp as Timestamp).toDate().toISOString() : data.timestamp,
          } as Tip);
        });
        setUserTips(fetchedTips);
      } catch (err) {
        console.error("Error fetching user tips:", err);
        setError("Failed to load your tips. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserTips();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading your tips...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-destructive py-8">{error}</p>;
  }

  if (userTips.length === 0) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-3">You haven&apos;t sent any tips yet.</p>
        <Button asChild variant="link" className="text-primary">
          <Link href="/creators">Discover creators to support</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>To Creator</TableHead>
            <TableHead className="text-right">Amount (KES)</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userTips.map((tip, index) => (
            <TableRow 
              key={tip.id} 
              className="animate-slide-up"
              style={{animationDelay: `${index * 0.05}s`}}
            >
              <TableCell>
                <Link href={`/creators/${tip.toCreatorId}`} className="font-medium hover:text-primary transition-colors">
                  {tip.toCreatorHandle || 'Unknown Creator'}
                </Link>
              </TableCell>
              <TableCell className="text-right font-semibold text-primary">{tip.amount.toLocaleString()}</TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">
                {tip.message || <span className="italic">No message</span>}
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(tip.timestamp), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
