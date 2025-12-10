import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DashboardHeader } from "@/components/DashboardHeader";
import { trpc } from "@/lib/trpc";
import { RefreshCw, TrendingUp, Clock, Search } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [bounceRateFilter, setBounceRateFilter] = useState<string>("all");
  const [engagementRateFilter, setEngagementRateFilter] = useState<string>("all");
  const [conversionsFilter, setConversionsFilter] = useState<string>("all");

  // Check if GA4 is configured
  const { data: configData } = trpc.ga4.isConfigured.useQuery();
  const isConfigured = configData?.configured || false;

  // Get latest sync date
  const { data: syncData, refetch: refetchSyncDate } = trpc.ga4.getLatestSync.useQuery();
  const latestSync = syncData?.latestDate;

  // Get GA4 metrics (from today forward, showing last 7 days for display)
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  const endDate = today;
  const startDate = sevenDaysAgo; // Show last 7 days of data
  
  // For sync, we use today as both start and end to only fetch today's data going forward
  const syncStartDate = today;
  const syncEndDate = today;
  
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
    syncMutation.mutate({ startDate: syncStartDate, endDate: syncEndDate });
  };

  // Filter metrics based on user selections
  const filteredMetrics = metrics?.filter((metric: any) => {
    // Domain filtering - only show relevant domains
    const page = metric.landing_page.toLowerCase();
    const isRelevantDomain = 
      page.includes('step') || 
      page.includes('checkout') || 
      page.includes('wisdom') ||
      page.includes('kot') ||
      page.includes('wait') ||
      page.includes('nextsteps') ||
      page.includes('get-started') ||
      page === '/' ||
      page === '/login';
    
    if (!isRelevantDomain) return false;

    // Search filter
    if (searchQuery && !metric.landing_page.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Bounce rate filter
    const bounceRate = parseFloat(metric.avg_bounce_rate || 0) * 100;
    if (bounceRateFilter === 'high' && bounceRate <= 80) return false;
    if (bounceRateFilter === 'medium' && (bounceRate < 50 || bounceRate > 80)) return false;
    if (bounceRateFilter === 'low' && bounceRate >= 50) return false;

    // Engagement rate filter
    const engagementRate = parseFloat(metric.avg_engagement_rate || 0) * 100;
    if (engagementRateFilter === 'high' && engagementRate <= 50) return false;
    if (engagementRateFilter === 'medium' && (engagementRate < 20 || engagementRate > 50)) return false;
    if (engagementRateFilter === 'low' && engagementRate >= 20) return false;

    // Conversions filter
    const conversions = parseInt(metric.total_conversions || 0);
    if (conversionsFilter === 'with' && conversions === 0) return false;
    if (conversionsFilter === 'without' && conversions > 0) return false;

    return true;
  }) || [];

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

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter landing pages by performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Page</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by page name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>

              {/* Bounce Rate Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Bounce Rate</label>
                <select
                  value={bounceRateFilter}
                  onChange={(e) => setBounceRateFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All</option>
                  <option value="high">High (&gt;80%)</option>
                  <option value="medium">Medium (50-80%)</option>
                  <option value="low">Low (&lt;50%)</option>
                </select>
              </div>

              {/* Engagement Rate Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Engagement Rate</label>
                <select
                  value={engagementRateFilter}
                  onChange={(e) => setEngagementRateFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All</option>
                  <option value="high">High (&gt;50%)</option>
                  <option value="medium">Medium (20-50%)</option>
                  <option value="low">Low (&lt;20%)</option>
                </select>
              </div>

              {/* Conversions Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Conversions</label>
                <select
                  value={conversionsFilter}
                  onChange={(e) => setConversionsFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All</option>
                  <option value="with">With Conversions</option>
                  <option value="without">Without Conversions</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredMetrics.length} of {metrics?.length || 0} pages
            </div>
          </CardContent>
        </Card>

        {/* Metrics Table */}
        <Card>
          <CardHeader>
            <CardTitle>Landing Page Performance (Last 7 Days)</CardTitle>
            <CardDescription>
              Aggregated metrics by landing page from Google Analytics 4 (filtered: wisdom + 31dwc26.obv.io domains)
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
            ) : filteredMetrics.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No pages match the selected filters. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Landing Page</TableHead>
                      <TableHead>Hostname</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Bounce Rate</TableHead>
                      <TableHead className="text-right">Avg Duration (s)</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Engagement Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMetrics.map((metric: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium max-w-md truncate">
                          {metric.landing_page}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {metric.hostname || 'N/A'}
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
