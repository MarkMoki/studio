
"use client";

import type { Tip, Creator } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { DollarSign, Gift, Users, TrendingUp, Download, Loader2, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CreatorStatsProps {
  creatorId: string;
}

interface ChartDataPoint {
  name: string;
  earnings: number;
}

const generateChartData = (tips: Tip[]): ChartDataPoint[] => {
  const last7DaysData: { [key: string]: number } = {};
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    last7DaysData[format(date, 'MMM d')] = 0;
  }

  tips.forEach(tip => {
    let tipDate: Date;
    if (tip.timestamp instanceof Timestamp) {
      tipDate = tip.timestamp.toDate();
    } else if (typeof tip.timestamp === 'string') {
      tipDate = parseISO(tip.timestamp);
    } else if (tip.timestamp instanceof Date) {
      tipDate = tip.timestamp;
    } else {
      console.warn("Invalid timestamp format for tip:", tip.id);
      return; 
    }
    
    const formattedDate = format(tipDate, 'MMM d');
    if (last7DaysData.hasOwnProperty(formattedDate)) {
      last7DaysData[formattedDate] += tip.amount;
    }
  });

  return Object.entries(last7DaysData).map(([name, earnings]) => ({ name, earnings }));
};


export function CreatorStats({ creatorId }: CreatorStatsProps) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [receivedTips, setReceivedTips] = useState<Tip[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creatorId) {
      setLoading(false);
      setError("Creator ID missing.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const creatorDocRef = doc(db, 'creators', creatorId);
        const creatorDocSnap = await getDoc(creatorDocRef);
        if (creatorDocSnap.exists()) {
          setCreator({ id: creatorDocSnap.id, ...creatorDocSnap.data() } as Creator);
        } else {
          throw new Error("Creator profile not found.");
        }

        const tipsRef = collection(db, 'tips');
        const q = query(tipsRef, where('toCreatorId', '==', creatorId), orderBy('timestamp', 'desc'));
        const tipsSnapshot = await getDocs(q);
        const fetchedTips: Tip[] = [];
        tipsSnapshot.forEach(doc => {
          const data = doc.data();
          fetchedTips.push({ 
            id: doc.id, 
            ...data, 
            timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp 
          } as Tip);
        });
        setReceivedTips(fetchedTips);
        setChartData(generateChartData(fetchedTips));

      } catch (err) {
        console.error("Error fetching creator stats:", err);
        setError((err as Error).message || "Failed to load creator statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [creatorId]);

  if (loading) {
    return <div className="flex justify-center items-center p-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /> <span className="ml-3">Loading stats...</span></div>;
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2"/>Error Loading Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!creator) {
     return (
      <Card>
        <CardHeader><CardTitle>Creator Not Found</CardTitle></CardHeader>
        <CardContent><p>Could not load creator statistics.</p></CardContent>
      </Card>
    );
  }

  const totalEarnings = creator.totalAmountReceived; 
  const totalTipsCount = creator.totalTips; 
  const averageTipAmount = totalTipsCount > 0 ? totalEarnings / totalTipsCount : 0;
  const monthlyGoal = 50000; 
  const progressToGoal = Math.min((totalEarnings / monthlyGoal) * 100, 100);
  const uniqueSupporters = (new Set(receivedTips.map(t => t.fromUserId))).size;


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Earnings" value={`KES ${totalEarnings.toLocaleString()}`} icon={<DollarSign className="h-6 w-6 text-primary" />} delay="0.1s" />
        <StatCard title="Total Tips Received" value={totalTipsCount.toLocaleString()} icon={<Gift className="h-6 w-6 text-primary" />} delay="0.2s" />
        <StatCard title="Average Tip Amount" value={`KES ${averageTipAmount.toFixed(2)}`} icon={<TrendingUp className="h-6 w-6 text-primary" />} delay="0.3s" />
        <StatCard title="Unique Supporters" value={uniqueSupporters.toLocaleString()} icon={<Users className="h-6 w-6 text-primary" />} delay="0.4s" />
      </div>

      <Card className="animate-slide-up" style={{animationDelay: '0.2s'}}>
        <CardHeader>
          <CardTitle>Earnings Overview (Last 7 Days)</CardTitle>
          <CardDescription>Track your daily earnings trend.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] md:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} /> 
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `KES ${value}`}/> 
              <Tooltip 
                formatter={(value: number) => [`KES ${value.toLocaleString()}`, "Earnings"]}
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--primary))' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }}/>
              <Line type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="animate-slide-up" style={{animationDelay: '0.3s'}}>
        <CardHeader>
          <CardTitle>Monthly Goal Progress</CardTitle>
          <CardDescription>You&apos;ve earned KES {totalEarnings.toLocaleString()} of your KES {monthlyGoal.toLocaleString()} goal this month.</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressToGoal} className="w-full h-4" />
          <p className="text-sm text-muted-foreground mt-2 text-right">{progressToGoal.toFixed(0)}% complete</p>
        </CardContent>
      </Card>

      <Card className="animate-slide-up" style={{animationDelay: '0.4s'}}>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"> 
          <div>
            <CardTitle>Recent Tips Log</CardTitle>
            <CardDescription>Latest tips you&apos;ve received (max 5 shown).</CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled> 
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
                  {receivedTips.slice(0, 5).map((tip) => (
                    <TableRow key={tip.id}>
                      <TableCell className="font-medium">{tip.fromUsername || 'Anonymous'}</TableCell>
                      <TableCell className="text-right font-semibold text-green-500">{tip.amount.toLocaleString()}</TableCell>
                      <TableCell className="max-w-[150px] sm:max-w-xs truncate text-muted-foreground"> 
                        {tip.message || <span className="italic">No message</span>}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {format(parseISO(tip.timestamp as string), "MMM d, HH:mm")}
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
        <CardFooter>
            <Button variant="link" asChild className="text-primary">
                <Link href="/creator/tips">View All Tips</Link>
            </Button>
        </CardFooter>
      </Card>

      <Card className="animate-slide-up" style={{animationDelay: '0.5s'}}>
        <CardHeader>
          <CardTitle>Withdraw Funds</CardTitle>
          <CardDescription>Transfer your earnings to your M-Pesa account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg font-semibold">Available Balance: <span className="text-primary">KES {totalEarnings.toLocaleString()}</span></p>
          <Button asChild className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/creator/withdrawals">
                Withdraw via M-Pesa
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">Withdrawals are processed securely. Standard M-Pesa transaction fees may apply.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, delay }: { title: string; value: string; icon: React.ReactNode, delay?: string }) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 animate-slide-up" style={{animationDelay: delay}}>
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

