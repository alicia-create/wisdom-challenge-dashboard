import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Flag, TrendingDown, TrendingUp, XCircle } from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function FlagHistory() {
  const [adIdFilter, setAdIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"flagged" | "recovered" | "disabled" | undefined>();
  const [dateRange, setDateRange] = useState(7); // Last 7 days by default

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);

  // Simplified query without date filters for now
  const { data: flagHistory, isLoading } = trpc.optimization.getFlagHistory.useQuery({
    adId: adIdFilter || undefined,
    status: statusFilter,
  });

  // Debug logging
  console.log("[FlagHistory] Data:", flagHistory);
  console.log("[FlagHistory] Loading:", isLoading);

  // Calculate metrics
  const totalFlags = flagHistory?.length || 0;
  const flaggedCount = flagHistory?.filter(f => f.status === "flagged").length || 0;
  const recoveredCount = flagHistory?.filter(f => f.status === "recovered").length || 0;
  const disabledCount = flagHistory?.filter(f => f.status === "disabled").length || 0;
  const recoveryRate = totalFlags > 0 ? ((recoveredCount / totalFlags) * 100).toFixed(1) : "0";

  // Group by ad for timeline view
  const adGroups = flagHistory?.reduce((acc, flag) => {
    if (!acc[flag.adId]) {
      acc[flag.adId] = [];
    }
    acc[flag.adId].push(flag);
    return acc;
  }, {} as Record<string, typeof flagHistory>);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "info":
        return <Flag className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "flagged":
        return <Badge variant="destructive">Flagged</Badge>;
      case "recovered":
        return <Badge variant="default" className="bg-green-500">Recovered</Badge>;
      case "disabled":
        return <Badge variant="secondary">Disabled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Flag History Dashboard</h1>
          <p className="text-muted-foreground">
            Track ad strikes over time and monitor recovery vs disabled ads
          </p>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFlags}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Currently Flagged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{flaggedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recovered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500 flex items-center gap-2">
                {recoveredCount}
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Disabled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500 flex items-center gap-2">
                {disabledCount}
                <TrendingDown className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recovery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{recoveryRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter flag history by ad, status, or date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ad ID</label>
                <Input
                  placeholder="Search by Ad ID..."
                  value={adIdFilter}
                  onChange={(e) => setAdIdFilter(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="recovered">Recovered</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <Select value={dateRange.toString()} onValueChange={(v) => setDateRange(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Last 3 days</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="14">Last 14 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setAdIdFilter("");
                  setStatusFilter(undefined);
                  setDateRange(7);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Flag History Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Flag Timeline</CardTitle>
            <CardDescription>
              Strike progression for each ad over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading flag history...</div>
            ) : !flagHistory || flagHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p>No flags found for the selected filters</p>
                <p className="text-sm">All ads are performing well! 🎉</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(adGroups || {}).map(([adId, flags]) => {
                  const sortedFlags = [...flags].sort((a, b) => 
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                  );
                  const latestFlag = sortedFlags[0];

                  return (
                    <div key={adId} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{latestFlag.adName}</h3>
                          <p className="text-sm text-muted-foreground">Ad ID: {adId}</p>
                          {latestFlag.campaignName && (
                            <p className="text-sm text-muted-foreground">Campaign: {latestFlag.campaignName}</p>
                          )}
                        </div>
                        {getStatusBadge(latestFlag.status)}
                      </div>

                      <div className="space-y-3">
                        {sortedFlags.map((flag, idx) => (
                          <div key={flag.id} className="flex items-start gap-3 pl-4 border-l-2 border-gray-200">
                            <div className="mt-1">{getSeverityIcon(flag.severity)}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{flag.flagType.replace(/_/g, " ").toUpperCase()}</span>
                                <Badge variant="outline">Strike {flag.strikeCount}/3</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(flag.date).toLocaleDateString()}
                                </span>
                              </div>
                              {flag.metricValue && flag.threshold && (
                                <p className="text-sm text-muted-foreground">
                                  Value: {flag.metricValue} | Threshold: {flag.threshold}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
