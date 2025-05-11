
"use client";
import { ReceivedTipsList } from "@/components/dashboard/received-tips-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Download, Filter } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function CreatorTipsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (!user || !user.isCreator) {
     // Should be handled by layout, but as a safeguard
    return <p className="text-center py-10 text-destructive">Access denied.</p>;
  }

  const handleExportCSV = () => {
    // Placeholder for CSV export functionality
    alert("CSV export functionality coming soon!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Coins className="mr-3 h-8 w-8 text-primary"/>
            Tips Received
          </h1>
          <p className="text-lg text-muted-foreground">
            Track all the support you&apos;ve received from your fans.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" disabled>
                <Filter className="mr-2 h-4 w-4" /> Filter (Soon)
            </Button>
            <Button onClick={handleExportCSV} variant="outline" disabled>
                <Download className="mr-2 h-4 w-4" /> Export CSV (Soon)
            </Button>
        </div>
      </div>

      <Card className="shadow-xl animate-fade-in">
        <CardContent className="pt-6">
          <ReceivedTipsList creatorId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
