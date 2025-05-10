"use client";

import { placeholderTips } from '@/lib/placeholder-data';
import type { Tip } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface MyTipsListProps {
  userId: string;
}

export function MyTipsList({ userId }: MyTipsListProps) {
  // In a real app, fetch tips for the user
  const userTips = placeholderTips.filter(tip => tip.fromUserId === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (userTips.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You haven't sent any tips yet.</p>
        <Link href="/creators" legacyBehavior>
          <Button variant="link" className="mt-2">Discover creators to support</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
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
          {userTips.map((tip) => (
            <TableRow key={tip.id}>
              <TableCell>
                <Link href={`/creators/${tip.toCreatorId}`} className="font-medium hover:text-primary">
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
