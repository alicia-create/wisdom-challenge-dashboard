import { DashboardHeader } from "@/components/DashboardHeader";
import { trpc } from "@/lib/trpc";
import { AddToDiaryButton } from "@/components/AddToDiaryButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Target,
  AlertCircle,
  Info,
  CheckCircle2,
  Sparkles,
  Brain,
  Loader2,
  FileText,
  RefreshCw,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Streamdown } from "streamdown";
import OptimizationChat from "@/components/OptimizationChat";
import { Link } from "wouter";

export default function OptimizationAgent() {
  const [expandedSections, setExpandedSections] = useState({
    insights: true,
    critical: true,
    warnings: false,
    leaks: true,
    fatigue: false,
    rules: false,
  });

  const [rulesContent, setRulesContent] = useState<string>("");

  // Load optimization rules document
  useEffect(() => {
    fetch("/docs/optimization-rules-v3.md")
      .then((res) => res.text())
      .then((text) => setRulesContent(text))
      .catch((err) => console.error("Failed to load optimization rules:", err));
  }, []);

  // Fetch LLM-powered daily report
  const { data: dailyReport, isLoading: loadingReport, refetch: refetchReport } = trpc.optimization.dailyReport.useQuery();
  
  // Fetch cache metadata
  const { data: cacheMetadata } = trpc.optimization.getCacheMetadata.useQuery();
  
  // Invalidate cache mutation
  const invalidateCache = trpc.optimization.invalidateCache.useMutation({
    onSuccess: () => {
      refetchReport();
    },
  });
  
  const handleRefresh = () => {
    invalidateCache.mutate();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Separate recommendations by severity
  const criticalRecs = dailyReport?.recommendations?.filter((r: any) => r.severity === "critical") || [];
  const warningRecs = dailyReport?.recommendations?.filter((r: any) => r.severity === "warning") || [];
  const infoRecs = dailyReport?.recommendations?.filter((r: any) => r.severity === "info") || [];

  const metrics = dailyReport?.metrics;
  const insights = dailyReport?.insights;
  const funnelLeaks = dailyReport?.funnel_leaks || [];
  const creativeFatigue = dailyReport?.creative_fatigue || [];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              🎯 Campaign Optimization Agent
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              AI-powered analysis of 31DWC2026 campaign performance with actionable recommendations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/ads-diary">
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Ads Diary
              </Button>
            </Link>
            <div className="text-right text-sm text-muted-foreground">
              {cacheMetadata?.cached && cacheMetadata.lastUpdated && cacheMetadata.expiresAt ? (
                <>
                  <p>Last Updated: {new Date(cacheMetadata.lastUpdated).toLocaleString()}</p>
                  <p>Expires: {new Date(cacheMetadata.expiresAt).toLocaleString()}</p>
                </>
              ) : (
                <p>Generating fresh report...</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={invalidateCache.isPending}
            >
              {invalidateCache.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
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
            {loadingReport ? (
              <div className="grid md:grid-cols-3 gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-semibold mb-1">Click-to-Purchase Rate</p>
                  <p className="text-2xl font-bold">
                    {metrics ? `${(metrics.click_to_purchase_rate * 100).toFixed(1)}%` : "--"}
                  </p>
                  <p className="text-xs text-muted-foreground">Target: 7%</p>
                  {metrics && metrics.click_to_purchase_rate < 0.07 && (
                    <Badge variant="destructive" className="mt-1">
                      Below Target
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Cost Per Purchase</p>
                  <p className="text-2xl font-bold">{metrics ? `$${metrics.avg_cpp.toFixed(2)}` : "--"}</p>
                  <p className="text-xs text-muted-foreground">Target: $30-$60</p>
                  {metrics && (metrics.avg_cpp < 30 || metrics.avg_cpp > 60) && (
                    <Badge variant={metrics.avg_cpp < 30 ? "default" : "destructive"} className="mt-1">
                      {metrics.avg_cpp < 30 ? "Below Target" : "Above Target"}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Total Purchases (7d)</p>
                  <p className="text-2xl font-bold">{metrics ? metrics.total_purchases : "--"}</p>
                  <p className="text-xs text-muted-foreground">
                    Spend: {metrics ? `$${metrics.total_spend.toLocaleString()}` : "--"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="cursor-pointer" onClick={() => toggleSection("insights")}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                🧠 AI Strategic Insights
              </CardTitle>
              <Badge variant="outline">
                <Sparkles className="h-3 w-3 mr-1" />
                LLM-Powered
              </Badge>
            </div>
            <CardDescription>Comprehensive analysis with prioritized action plan</CardDescription>
          </CardHeader>
          {expandedSections.insights && (
            <CardContent className="space-y-6">
              {loadingReport ? (
                <>
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-32 w-full" />
                </>
              ) : insights ? (
                <>
                  {/* Executive Summary */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Executive Summary
                    </h3>
                    <Alert>
                      <AlertDescription className="text-base">{insights.executive_summary}</AlertDescription>
                    </Alert>
                  </div>

                  <Separator />

                  {/* Top Priorities */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Top 3 Priorities
                    </h3>
                    <div className="space-y-3">
                      {insights.top_priorities.map((priority: any) => (
                        <Card key={priority.rank} className="border-l-4 border-l-primary">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <Badge className="text-lg px-3 py-1">{priority.rank}</Badge>
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1">{priority.issue}</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  <strong>Impact:</strong> {priority.impact}
                                </p>
                                <p className="text-sm mb-2">
                                  <strong>Action:</strong> {priority.action}
                                </p>
                                <p className="text-sm text-primary">
                                  <strong>Expected Result:</strong> {priority.expected_result}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Narrative Analysis */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Strategic Analysis
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{insights.narrative}</Streamdown>
                    </div>
                  </div>

                  <Separator />

                  {/* Key Metrics Analysis */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Key Metrics Deep Dive
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{insights.key_metrics_analysis}</Streamdown>
                    </div>
                  </div>

                  <Separator />

                  {/* Next Steps */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Next Steps (24-48 Hours)
                    </h3>
                    <ul className="space-y-2">
                      {insights.next_steps.map((step: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">
                            {idx + 1}
                          </Badge>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>AI Insights Unavailable</AlertTitle>
                  <AlertDescription>Unable to generate AI insights at this time. Please review the rule-based recommendations below.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          )}
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
              {loadingReport ? (
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
                criticalRecs.map((rec: any) => (
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
                        {rec.metadata?.strike_count && rec.metadata.strike_count > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-destructive">
                              🚩 Strike {rec.metadata.strike_count}/3
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive">
                          Approve Disable
                        </Button>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <AddToDiaryButton recommendation={rec} />
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
              {loadingReport ? (
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
                warningRecs.map((rec: any) => (
                  <Alert key={rec.id}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{rec.title}</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">{rec.description}</p>
                      <p className="font-semibold mb-2">Action: {rec.action_required}</p>
                      <p className="text-sm mb-3">Expected Impact: {rec.expected_impact}</p>
                      {rec.metadata?.strike_count && rec.metadata.strike_count > 0 && (
                        <p className="text-xs text-warning font-semibold mb-2">
                          🚩 Strike {rec.metadata.strike_count}/3 - Monitor closely
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm">Approve</Button>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <AddToDiaryButton recommendation={rec} />
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
                🔍 Funnel Leaks Detected ({funnelLeaks.length})
              </CardTitle>
              <Badge>{funnelLeaks.length}</Badge>
            </div>
            <CardDescription>Identify where users are dropping off in the conversion funnel</CardDescription>
          </CardHeader>
          {expandedSections.leaks && (
            <CardContent className="space-y-4">
              {loadingReport ? (
                <>
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </>
              ) : funnelLeaks.length === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>No Funnel Leaks</AlertTitle>
                  <AlertDescription>All funnel stages are performing above thresholds.</AlertDescription>
                </Alert>
              ) : (
                funnelLeaks.map((leak: any, idx: number) => (
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
                      <div className="text-xs text-muted-foreground mb-3">Affected Ads: {leak.affected_ads}</div>
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
                💡 Creative Fatigue Alerts ({creativeFatigue.length})
              </CardTitle>
              <Badge variant="outline">{creativeFatigue.length}</Badge>
            </div>
            <CardDescription>Creatives showing signs of audience saturation</CardDescription>
          </CardHeader>
          {expandedSections.fatigue && (
            <CardContent className="space-y-4">
              {loadingReport ? (
                <>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : creativeFatigue.length === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>No Fatigue Detected</AlertTitle>
                  <AlertDescription>All creatives are performing well with healthy frequency.</AlertDescription>
                </Alert>
              ) : (
                creativeFatigue.map((alert: any, idx: number) => (
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

        {/* Optimization Rules */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection("rules")}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                📋 Optimization Rules (v3)
              </CardTitle>
              <Badge variant="outline">{expandedSections.rules ? "Hide" : "Show"}</Badge>
            </div>
            <CardDescription>Campaign optimization rules and thresholds used by the AI agent</CardDescription>
          </CardHeader>
          {expandedSections.rules && (
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {rulesContent ? (
                  <Streamdown>{rulesContent}</Streamdown>
                ) : (
                  <Skeleton className="h-96 w-full" />
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Interactive Chat */}
        <OptimizationChat />
      </div>
    </div>
  );
}
