
"use client";
import { MyTipsList } from "@/components/dashboard/my-tips-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function SupporterMyTipsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (!user) {
    // Should be handled by layout, but as a safeguard
    return <p className="text-center py-10 text-destructive">Access denied. Please sign in.</p>;
  }
   if (user.isCreator) {
    // Should be handled by layout, but as a safeguard
    return <p className="text-center py-10 text-destructive">This section is for supporters.</p>;
  }

  // Placeholder for re-tip functionality
  const handleReTip = (creatorId: string, amount: number) => {
    alert(`Re-tipping creator ${creatorId} with KES ${amount} (functionality coming soon!)`);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Gift className="mr-3 h-8 w-8 text-primary"/>
            My Sent Tips
          </h1>
          <p className="text-lg text-muted-foreground">
            A history of all the talented creators you&apos;ve supported.
          </p>
        </div>
        {/* Add any actions like "Tip again" or filters if needed later */}
      </div>

      <Card className="shadow-xl animate-fade-in">
        <CardContent className="pt-6">
          {/* MyTipsList will render its own loading/empty states */}
          <MyTipsList userId={user.id} />
        </CardContent>
      </Card>

      {/* Example of how a re-tip button might be integrated if MyTipsList items were interactive */}
      {/* <div className="text-center mt-4">
        <Button variant="outline" disabled>
            <RotateCcw className="mr-2 h-4 w-4"/> Re-Tip Last Creator (Example)
        </Button>
      </div> */}
    </div>
  );
}
