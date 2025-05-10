"use client";

import { placeholderCreators, placeholderTips } from '@/lib/placeholder-data';
import type { Tip, Creator } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow, format } from 'date-fns';
import { DollarSign, Gift, Users, TrendingUp, Download } from 'lucide-react';
import Link from 'next/link';

interface CreatorStatsProps {
  creatorId: string;
}

// Mock data for chart - last 7 days earnings
const generateMockChartData = () => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      name: format(date, 'MMM d'),
      earnings: Math.floor(Math.random() * 500) + 50, // Random earnings between 50-550
    });
  }
  return data;
};

const chartData = generateMockChartData();

export function CreatorStats({ creatorId }: CreatorStatsProps) {
  // In a real app, fetch creator data and their tips
  const creator = placeholderCreators.find(c => c.id === creatorId);
  const receivedTips = placeholderTips.filter(tip => tip.toCreatorId === creatorId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (!creator) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Creator Not Found</CardTitle>
          <CardDescription>Could not load creator statistics.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please ensure your creator profile is set up correctly.</p>
        </CardContent>
      </Card>
    );
  }

  const totalEarnings = receivedTips.reduce((sum, tip) => sum + tip.amount, 0);
  const averageTipAmount = receivedTips.length > 0 ? totalEarnings / receivedTips.length : 0;
  const monthlyGoal = 50000; // Example monthly goal
  const progressToGoal = Math.min((totalEarnings / monthlyGoal) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Earnings" value={`KES ${totalEarnings.toLocaleString()}`} icon={<DollarSign className="h-6 w-6 text-primary" />} />
        <StatCard title="Total Tips Received" value={receivedTips.length.toString()} icon={<Gift className="h-6 w-6 text-primary" />} />
        <StatCard title="Average Tip Amount" value={`KES ${averageTipAmount.toFixed(2)}`} icon={<TrendingUp className="h-6 w-6 text-primary" />} />
        <StatCard title="Unique Supporters" value={(new Set(receivedTips.map(t => t.fromUserId))).size.toString()} icon={<Users className="h-6 w-6 text-primary" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
          <CardDescription>Your earnings for the last 7 days.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Earnings"]} />
              <Legend />
              <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Goal Progress</CardTitle>
          <CardDescription>You've earned KES {totalEarnings.toLocaleString()} of your KES {monthlyGoal.toLocaleString()} goal this month.</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressToGoal} className="w-full h-4" />
          <p className="text-sm text-muted-foreground mt-2 text-right">{progressToGoal.toFixed(0)}% complete</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Recent Tips Log</CardTitle>
            <CardDescription>Latest tips you've received.</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export Log
          </Button>
        </CardHeader>
        <CardContent>
          {receivedTips.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From User</TableHead>
                    <TableHead className="text-right">Amount (KES)</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivedTips.slice(0, 5).map((tip) => ( // Show latest 5 tips
                    <TableRow key={tip.id}>
                      <TableCell className="font-medium">{tip.fromUsername || 'Anonymous'}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{tip.amount.toLocaleString()}</TableCell>
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
          ) : (
             <p className="text-center text-muted-foreground py-4">No tips received yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdraw Funds</CardTitle>
          <CardDescription>Transfer your earnings to your M-Pesa account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg font-semibold">Available Balance: <span className="text-primary">KES {totalEarnings.toLocaleString()}</span></p>
          <Button className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled>
            Withdraw via M-Pesa (Coming Soon)
          </Button>
          <p className="text-xs text-muted-foreground">Withdrawals are processed securely. Standard M-Pesa transaction fees may apply.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm">
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
