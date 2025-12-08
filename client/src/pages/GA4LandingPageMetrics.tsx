import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DashboardHeader } from "@/components/DashboardHeader";
import { trpc } from "@/lib/trpc";
import { RefreshCw, TrendingUp, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function GA4LandingPageMetrics() {
  const [syncing, setSyncing] = useState(false);

  // Check if GA4 is configured
  const { data: configData } = trpc.ga4.isConfigured.useQuery();
  const isConfigured = configData?.configured || false;

  // Get latest sync date
  const { data: syncData, refetch: refetchSyncDate } = trpc.ga4.getLatestSync.useQuery();
  const latestSync = syncData?.latestDate;

  // Get GA4 metrics (last 30 days)
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  const { data: metrics, isLoading, refetch } = trpc.ga4.getMetrics.useQuery({
    startDate,
    endDate,
  });

  // Sync mutation
  const syncMutation = trpc.ga4.sync.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      refetchSyncDate();
      setSyncing(false);
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
      setSyncing(false);
    },
  });

  const handleSync = () => {
    setSyncing(true);
    syncMutation.mutate({ startDate, endDate });
  };

  if (!isConfigured) {
    return (
      <>
        <DashboardHeader />
        <div className="container py-8">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/" },
              { label: "Raw Data", href: "/raw-data" },
              { label: "GA4 Landing Page Metrics" },
            ]}
          />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Google Analytics 4 Not Configured</CardTitle>
              <CardDescription>
                GA4 integration is not configured. Please set GA4_PROPERTY_ID and GA4_SERVICE_ACCOUNT_JSON environment variables.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <div className="container py-8">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Raw Data", href: "/raw-data" },
            { label: "GA4 Landing Page Metrics" },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 mt-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">GA4 Landing Page Metrics</h1>
            </div>
            <p className="text-muted-foreground">
              Landing page performance metrics from Google Analytics 4
            </p>
          </div>
          <div className="flex items-center gap-4">
            {latestSync && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Last synced: {new Date(latestSync).toLocaleDateString()}</span>
              </div>
            )}
            <Button onClick={handleSync} disabled={syncing || isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync from GA4"}
            </Button>
          </div>
        </div>

        {/* Metrics Table */}
        <Card>
          <CardHeader>
            <CardTitle>Landing Page Performance (Last 30 Days)</CardTitle>
            <CardDescription>
              Aggregated metrics by landing page from Google Analytics 4
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !metrics || metrics.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No GA4 metrics found. Click "Sync from GA4" to fetch data.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Landing Page</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Bounce Rate</TableHead>
                      <TableHead className="text-right">Avg Duration (s)</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Engagement Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.map((metric: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium max-w-md truncate">
                          {metric.landing_page}
                        </TableCell>
                        <TableCell className="text-right">
                          {metric.total_sessions?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {(parseFloat(metric.avg_bounce_rate || 0) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {parseFloat(metric.avg_session_duration || 0).toFixed(1)}s
                        </TableCell>
                        <TableCell className="text-right">
                          {parseInt(metric.total_conversions || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {(parseFloat(metric.avg_engagement_rate || 0) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
