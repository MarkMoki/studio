
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send, Loader2, Info, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from 'firebase/firestore';
import type { Creator } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Mock data - replace with actual data fetching
const mockWithdrawalHistory = [
  { id: "wd1", date: "2024-04-20", amount: 5000, status: "Sent", mpesaRef: "SDF876GHJ" },
  { id: "wd2", date: "2024-03-15", amount: 3500, status: "Sent", mpesaRef: "RTY654FGH" },
  { id: "wd3", date: "2024-02-10", amount: 7200, status: "Failed", mpesaRef: "-" },
];

const MINIMUM_WITHDRAWAL_KES = 100; // Example

export default function CreatorWithdrawalsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [creatorData, setCreatorData] = useState<Creator | null>(null);
  const [isLoadingCreator, setIsLoadingCreator] = useState(true);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  
  const availableBalance = creatorData?.totalAmountReceived || 0; // This should be withdrawable balance

  useEffect(() => {
    if (user && user.isCreator) {
      const fetchCreatorData = async () => {
        setIsLoadingCreator(true);
        try {
          const creatorDocRef = doc(db, 'creators', user.id);
          const creatorDocSnap = await getDoc(creatorDocRef);
          if (creatorDocSnap.exists()) {
            setCreatorData(creatorDocSnap.data() as Creator);
          } else {
            toast({ title: "Creator data not found", variant: "destructive" });
          }
        } catch (error) {
          toast({ title: "Failed to load creator data", description: (error as Error).message, variant: "destructive" });
        } finally {
          setIsLoadingCreator(false);
        }
      };
      fetchCreatorData();
    }
  }, [user, toast]);

  const handleRequestWithdrawal = async () => {
    const amountToWithdraw = parseFloat(withdrawalAmount);
    if (isNaN(amountToWithdraw) || amountToWithdraw <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount to withdraw.", variant: "destructive" });
      return;
    }
    if (amountToWithdraw < MINIMUM_WITHDRAWAL_KES) {
      toast({ title: "Amount Too Low", description: `Minimum withdrawal amount is KES ${MINIMUM_WITHDRAWAL_KES}.`, variant: "destructive" });
      return;
    }
    if (amountToWithdraw > availableBalance) {
      toast({ title: "Insufficient Balance", description: "You cannot withdraw more than your available balance.", variant: "destructive" });
      return;
    }
    if (!user?.phoneNumber) {
      toast({ title: "Phone Number Missing", description: "Please ensure your M-Pesa phone number is set in your profile.", variant: "destructive" });
      return;
    }

    setIsProcessingWithdrawal(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, you would:
    // 1. Call a Firebase Function or backend API to process the withdrawal.
    // 2. This backend would interact with M-Pesa API.
    // 3. Update withdrawal status in Firestore.
    // 4. Update creator's availableBalance in Firestore.

    toast({ title: "Withdrawal Requested", description: `Request to withdraw KES ${amountToWithdraw} to ${user.phoneNumber} submitted. (Simulated)` });
    setWithdrawalAmount(''); // Clear input
    // Potentially refetch creatorData to update balance or add to local withdrawal history
    setIsProcessingWithdrawal(false);
  };

  if (authLoading || isLoadingCreator) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!user || !user.isCreator) {
    return <p className="text-center py-10 text-destructive">Access denied.</p>;
  }


  return (
    <div className="space-y-8">
      <Card className="shadow-xl animate-fade-in">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center"><Send className="mr-3 h-8 w-8 text-primary"/>Withdraw Your Earnings</CardTitle>
          <CardDescription>Transfer your TipKesho earnings to your M-Pesa account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
            <p className="text-lg font-semibold text-green-700">Available Balance for Withdrawal:</p>
            <p className="text-4xl font-extrabold text-green-600">KES {availableBalance.toLocaleString()}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mpesaNumber" className="text-base">M-Pesa Number (from your profile)</Label>
            <Input id="mpesaNumber" value={user.phoneNumber || "Not Set"} readOnly disabled className="bg-muted/50 text-lg"/>
            {!user.phoneNumber && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3"/>Please set your phone number in <Link href="/creator/settings" className="underline">Account Settings</Link> to enable withdrawals.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdrawalAmount" className="text-base">Amount to Withdraw (KES)</Label>
            <Input 
              id="withdrawalAmount" 
              type="number" 
              placeholder={`Min. ${MINIMUM_WITHDRAWAL_KES}`} 
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              min={MINIMUM_WITHDRAWAL_KES.toString()}
              max={availableBalance.toString()}
              className="text-lg"
            />
          </div>
          
          <Button 
            onClick={handleRequestWithdrawal} 
            className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-lg" 
            disabled={isProcessingWithdrawal || !user.phoneNumber || availableBalance < MINIMUM_WITHDRAWAL_KES}
          >
            {isProcessingWithdrawal && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Request Withdrawal
          </Button>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700 flex items-start gap-2">
            <Info className="h-5 w-5 mt-0.5 shrink-0"/>
            <div>
            Minimum withdrawal is KES {MINIMUM_WITHDRAWAL_KES}. Withdrawals are processed within 24-48 hours (simulated). Standard M-Pesa transaction fees may apply.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>Track your past withdrawal requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {mockWithdrawalHistory.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount (KES)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>M-Pesa Ref.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockWithdrawalHistory.map((wd) => (
                  <TableRow key={wd.id}>
                    <TableCell>{wd.date}</TableCell>
                    <TableCell className="text-right font-semibold">{wd.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${wd.status === 'Sent' ? 'bg-green-100 text-green-700' : wd.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {wd.status}
                      </span>
                    </TableCell>
                    <TableCell>{wd.mpesaRef}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">No withdrawal history yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
