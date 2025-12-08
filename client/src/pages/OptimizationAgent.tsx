import { DashboardHeader } from "@/components/DashboardHeader";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Target,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";

export default function OptimizationAgent() {
  const [expandedSections, setExpandedSections] = useState({
    critical: true,
    warnings: true,
    leaks: true,
    fatigue: false,
  });

  // Fetch optimization data
  const { data: adRecommendations, isLoading: loadingAds } = trpc.optimization.adRecommendations.useQuery();
  const { data: funnelLeaks, isLoading: loadingLeaks } = trpc.optimization.funnelLeaks.useQuery();
  const { data: creativeFatigue, isLoading: loadingFatigue } = trpc.optimization.creativeFatigue.useQuery();

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Separate recommendations by severity
  const criticalRecs = adRecommendations?.filter((r) => r.severity === "critical") || [];
  const warningRecs = adRecommendations?.filter((r) => r.severity === "warning") || [];
  const infoRecs = adRecommendations?.filter((r) => r.severity === "info") || [];

  const isLoading = loadingAds || loadingLeaks || loadingFatigue;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🎯 Campaign Optimization Agent</h1>
            <p className="text-muted-foreground">
              AI-powered analysis of 31DWC2026 campaign performance with actionable recommendations
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Last Updated: Just now</p>
            <p>Next Refresh: 30 minutes</p>
          </div>
        </div>

        {/* Primary Metrics */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Primary Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-semibold mb-1">Click-to-Purchase Rate</p>
                <p className="text-2xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">Target: 10%</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Cost Per Purchase</p>
                <p className="text-2xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">Target: $30-$60</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Campaign Spend</p>
                <p className="text-2xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">Target: $150K/day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical Actions */}
        <Card className="border-destructive/50">
          <CardHeader className="cursor-pointer" onClick={() => toggleSection("critical")}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                🚨 Critical Actions ({criticalRecs.length})
              </CardTitle>
              <Badge variant="destructive">{criticalRecs.length}</Badge>
            </div>
            <CardDescription>Ads that should be disabled immediately to stop wasting budget</CardDescription>
          </CardHeader>
          {expandedSections.critical && (
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : criticalRecs.length === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>No Critical Issues</AlertTitle>
                  <AlertDescription>All ads are performing within acceptable thresholds.</AlertDescription>
                </Alert>
              ) : (
                criticalRecs.map((rec) => (
                  <Alert key={rec.id} variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{rec.title}</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">{rec.description}</p>
                      <p className="font-semibold mb-2">Action: {rec.action_required}</p>
                      <p className="text-sm mb-3">Expected Impact: {rec.expected_impact}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground mb-3">
                        <span>Ad ID: {rec.ad_id}</span>
                        <span>•</span>
                        <span>Ad Set: {rec.adset_id}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive">
                          Approve Disable
                        </Button>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm" variant="ghost">
                          Reject
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))
              )}
            </CardContent>
          )}
        </Card>

        {/* Performance Warnings */}
        <Card className="border-warning/50">
          <CardHeader className="cursor-pointer" onClick={() => toggleSection("warnings")}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-5 w-5" />
                ⚠️ Performance Warnings ({warningRecs.length})
              </CardTitle>
              <Badge variant="outline">{warningRecs.length}</Badge>
            </div>
            <CardDescription>Ads with declining performance that need attention</CardDescription>
          </CardHeader>
          {expandedSections.warnings && (
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : warningRecs.length === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>No Warnings</AlertTitle>
                  <AlertDescription>All ads are performing well.</AlertDescription>
                </Alert>
              ) : (
                warningRecs.map((rec) => (
                  <Alert key={rec.id}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{rec.title}</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">{rec.description}</p>
                      <p className="font-semibold mb-2">Action: {rec.action_required}</p>
                      <p className="text-sm mb-3">Expected Impact: {rec.expected_impact}</p>
                      <div className="flex gap-2">
                        <Button size="sm">Approve</Button>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm" variant="ghost">
                          Reject
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))
              )}
            </CardContent>
          )}
        </Card>

        {/* Funnel Leaks */}
        <Card className="border-primary/50">
          <CardHeader className="cursor-pointer" onClick={() => toggleSection("leaks")}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                🔍 Funnel Leaks Detected ({funnelLeaks?.length || 0})
              </CardTitle>
              <Badge>{funnelLeaks?.length || 0}</Badge>
            </div>
            <CardDescription>Identify where users are dropping off in the conversion funnel</CardDescription>
          </CardHeader>
          {expandedSections.leaks && (
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </>
              ) : !funnelLeaks || funnelLeaks.length === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>No Funnel Leaks</AlertTitle>
                  <AlertDescription>All funnel stages are performing above thresholds.</AlertDescription>
                </Alert>
              ) : (
                funnelLeaks.map((leak, idx) => (
                  <Alert key={idx} variant={leak.severity === "critical" ? "destructive" : "default"}>
                    <TrendingDown className="h-4 w-4" />
                    <AlertTitle>{leak.title}</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">{leak.description}</p>
                      <p className="text-sm mb-2">
                        <strong>Root Cause:</strong> {leak.root_cause}
                      </p>
                      <p className="text-sm mb-3">
                        <strong>Action Required:</strong> {leak.action_required}
                      </p>
                      <div className="text-xs text-muted-foreground mb-3">
                        Affected Ads: {leak.affected_ads}
                      </div>
                      <Button size="sm" variant="outline">
                        View Funnel Visualization
                      </Button>
                    </AlertDescription>
                  </Alert>
                ))
              )}
            </CardContent>
          )}
        </Card>

        {/* Creative Fatigue */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection("fatigue")}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                💡 Creative Fatigue Alerts ({creativeFatigue?.length || 0})
              </CardTitle>
              <Badge variant="outline">{creativeFatigue?.length || 0}</Badge>
            </div>
            <CardDescription>Creatives showing signs of audience saturation</CardDescription>
          </CardHeader>
          {expandedSections.fatigue && (
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : !creativeFatigue || creativeFatigue.length === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>No Fatigue Detected</AlertTitle>
                  <AlertDescription>All creatives are performing well with healthy frequency.</AlertDescription>
                </Alert>
              ) : (
                creativeFatigue.map((alert, idx) => (
                  <Alert key={idx}>
                    <Info className="h-4 w-4" />
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">{alert.description}</p>
                      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                        <div>
                          <p className="font-semibold">Frequency</p>
                          <p>{alert.metrics.frequency.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="font-semibold">CPP Trend</p>
                          <p>{alert.metrics.cpp_trend}</p>
                        </div>
                        <div>
                          <p className="font-semibold">CTR Trend</p>
                          <p>{alert.metrics.ctr_trend}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Suggest Creative Refresh
                      </Button>
                    </AlertDescription>
                  </Alert>
                ))
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
