
"use client";

import type { Tip } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Loader2, Coins, TrendingDown } from 'lucide-react'; // Using Coins or TrendingDown for received tips

interface ReceivedTipsListProps {
  creatorId: string;
}

export function ReceivedTipsList({ creatorId }: ReceivedTipsListProps) {
  const [receivedTips, setReceivedTips] = useState<Tip[]>([]);
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
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedTips.push({ 
            id: doc.id, 
            ...data,
            timestamp: (data.timestamp as Timestamp)?.toDate ? (data.timestamp as Timestamp).toDate().toISOString() : data.timestamp,
          } as Tip);
        });
        setReceivedTips(fetchedTips);
      } catch (err) {
        console.error("Error fetching received tips:", err);
        setError("Failed to load received tips. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReceivedTips();
  }, [creatorId]);

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

  if (receivedTips.length === 0) {
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
          {receivedTips.map((tip, index) => (
            <TableRow 
              key={tip.id} 
              className="animate-slide-up"
              style={{animationDelay: `${index * 0.05}s`}}
            >
              <TableCell className="font-medium">
                {tip.fromUsername || 'Anonymous Supporter'}
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
