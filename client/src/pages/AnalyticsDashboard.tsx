import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalyticsDashboard() {
  // Fetch GA4 metrics for landing page performance
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  const { data: ga4Metrics, isLoading: ga4Loading } = trpc.ga4.getMetrics.useQuery({
    startDate: sevenDaysAgo,
    endDate: today,
  });

  // Filter only the 3 main funnel pages and separate by hostname
  // Organic = 31daywisdomchallenge.com (with or without www)
  // Ads = 31daywisdom.com (with or without www)
  const organicFunnel = (ga4Metrics || []).filter((page: any) => {
    const hostname = page.hostname?.toLowerCase() || "";
    const isOrganicDomain = hostname.includes("31daywisdomchallenge.com");
    const isFunnelPage = page.landing_page === "/step1-a" || 
                         page.landing_page === "/step2-a" || 
                         page.landing_page === "/step3-a";
    return isOrganicDomain && isFunnelPage;
  });

  const adsFunnel = (ga4Metrics || []).filter((page: any) => {
    const hostname = page.hostname?.toLowerCase() || "";
    // Match 31daywisdom.com but NOT 31daywisdomchallenge.com
    const isAdsDomain = hostname.includes("31daywisdom.com") && !hostname.includes("31daywisdomchallenge.com");
    const isFunnelPage = page.landing_page === "/step1-a" || 
                         page.landing_page === "/step2-a" || 
                         page.landing_page === "/step3-a";
    return isAdsDomain && isFunnelPage;
  });

  // Calculate funnel metrics
  const calculateFunnelMetrics = (funnelPages: any[]) => {
    const step1 = funnelPages.find(p => p.landing_page === "/step1-a");
    const step2 = funnelPages.find(p => p.landing_page === "/step2-a");
    const step3 = funnelPages.find(p => p.landing_page === "/step3-a");

    const step1Sessions = parseInt(step1?.sessions || 0);
    const step2Sessions = parseInt(step2?.sessions || 0);
    const step3Sessions = parseInt(step3?.sessions || 0);

    const step1ToStep2Rate = step1Sessions > 0 
      ? ((step2Sessions / step1Sessions) * 100).toFixed(1)
      : "0.0";
    
    const step2ToStep3Rate = step2Sessions > 0
      ? ((step3Sessions / step2Sessions) * 100).toFixed(1)
      : "0.0";

    const totalSessions = funnelPages.reduce((sum: number, page: any) => sum + parseInt(page.sessions || 0), 0);
    const totalConversions = funnelPages.reduce((sum: number, page: any) => sum + parseInt(page.conversions || 0), 0);
    const overallConversionRate = totalSessions > 0 
      ? ((totalConversions / totalSessions) * 100).toFixed(1)
      : "0.0";

    return {
      step1Sessions,
      step2Sessions,
      step3Sessions,
      step1ToStep2Rate,
      step2ToStep3Rate,
      totalSessions,
      totalConversions,
      overallConversionRate,
    };
  };

  const organicMetrics = calculateFunnelMetrics(organicFunnel);
  const adsMetrics = calculateFunnelMetrics(adsFunnel);

  const formatPageName = (url: string) => {
    if (url === "/step1-a") return "Step 1 - Landing Page A";
    if (url === "/step2-a") return "Step 2 - Wisdom+ (VIP A)";
    if (url === "/step3-a") return "Step 3 - OTO";
    return url;
  };

  const renderFunnelTable = (funnelPages: any[], funnelType: "Organic" | "Ads") => {
    if (ga4Loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (funnelPages.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No data available for {funnelType} funnel
        </div>
      );
    }

    // Sort by step order
    const sortedPages = [...funnelPages].sort((a, b) => {
      const getStepOrder = (url: string) => {
        if (url === "/step1-a") return 1;
        if (url === "/step2-a") return 2;
        if (url === "/step3-a") return 3;
        return 4;
      };
      return getStepOrder(a.landing_page) - getStepOrder(b.landing_page);
    });

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Page</TableHead>
            <TableHead className="text-right">Sessions</TableHead>
            <TableHead className="text-right">Bounce Rate</TableHead>
            <TableHead className="text-right">Avg Duration</TableHead>
            <TableHead className="text-right">Conversions</TableHead>
            <TableHead className="text-right">Engagement Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPages.map((page: any) => {
            const bounceRate = parseFloat(page.bounce_rate || 0);
            const engagementRate = parseFloat(page.engagement_rate || 0);
            const avgDuration = parseFloat(page.avg_session_duration || 0);

            return (
              <TableRow key={`${page.hostname}-${page.landing_page}`}>
                <TableCell className="font-medium">{formatPageName(page.landing_page)}</TableCell>
                <TableCell className="text-right">{parseInt(page.sessions || 0).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={bounceRate > 80 ? "destructive" : bounceRate > 50 ? "secondary" : "default"}>
                    {bounceRate.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{avgDuration.toFixed(1)}s</TableCell>
                <TableCell className="text-right">
                  <span className="font-semibold">{parseInt(page.conversions || 0).toLocaleString()}</span>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={engagementRate > 50 ? "default" : engagementRate > 20 ? "secondary" : "outline"}>
                    {engagementRate.toFixed(1)}%
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  const renderFunnelVisualization = (metrics: any) => (
    <div className="flex items-center justify-between gap-4 p-6 bg-muted/50 rounded-lg mb-6">
      <div className="flex-1 text-center">
        <div className="text-sm text-muted-foreground mb-1">Step 1</div>
        <div className="text-3xl font-bold">{metrics.step1Sessions.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground mt-1">Landing Page A</div>
      </div>
      <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 text-center">
        <div className="text-sm text-muted-foreground mb-1">Step 2</div>
        <div className="text-3xl font-bold">{metrics.step2Sessions.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground mt-1">Wisdom+ (VIP A)</div>
        <div className="text-xs font-semibold text-primary mt-1">{metrics.step1ToStep2Rate}% conversion</div>
      </div>
      <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 text-center">
        <div className="text-sm text-muted-foreground mb-1">Step 3</div>
        <div className="text-3xl font-bold">{metrics.step3Sessions.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground mt-1">OTO</div>
        <div className="text-xs font-semibold text-primary mt-1">{metrics.step2ToStep3Rate}% conversion</div>
      </div>
    </div>
  );

  return (
    <>
      <DashboardHeader />
      <div className="container py-6">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Raw Data", href: "/raw-data" },
            { label: "Analytics Dashboard" },
          ]}
        />

        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Performance metrics for Organic and Ads funnels (Last 7 Days)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href="https://analytics.google.com/analytics/web/?utm_source=marketingplatform.google.com&utm_medium=et&utm_campaign=marketingplatform.google.com%2Fabout%2Fanalytics%2F#/a282571182p418349926/realtime/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Real-Time Overview
              </a>
            </Button>
          </div>

          {/* Organic Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Organic Funnel (31daywisdomchallenge.com)
              </CardTitle>
              <CardDescription>
                Performance metrics for organic traffic funnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold">{organicMetrics.totalSessions.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Conversions</p>
                  <p className="text-2xl font-bold">{organicMetrics.totalConversions.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">{organicMetrics.overallConversionRate}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Step 1 → 2</p>
                  <p className="text-2xl font-bold">{organicMetrics.step1ToStep2Rate}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Step 2 → 3</p>
                  <p className="text-2xl font-bold">{organicMetrics.step2ToStep3Rate}%</p>
                </div>
              </div>
              {renderFunnelVisualization(organicMetrics)}
              {renderFunnelTable(organicFunnel, "Organic")}
            </CardContent>
          </Card>

          {/* Ads Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-blue-600" />
                Ads Funnel (31daywisdom.com)
              </CardTitle>
              <CardDescription>
                Performance metrics for paid ads traffic funnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold">{adsMetrics.totalSessions.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Conversions</p>
                  <p className="text-2xl font-bold">{adsMetrics.totalConversions.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">{adsMetrics.overallConversionRate}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Step 1 → 2</p>
                  <p className="text-2xl font-bold">{adsMetrics.step1ToStep2Rate}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Step 2 → 3</p>
                  <p className="text-2xl font-bold">{adsMetrics.step2ToStep3Rate}%</p>
                </div>
              </div>
              {renderFunnelVisualization(adsMetrics)}
              {renderFunnelTable(adsFunnel, "Ads")}
            </CardContent>
          </Card>

          {/* Comparison Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Organic vs Ads Comparison</CardTitle>
              <CardDescription>
                Side-by-side performance comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Organic</TableHead>
                    <TableHead className="text-right">Ads</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Total Sessions</TableCell>
                    <TableCell className="text-right">{organicMetrics.totalSessions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{adsMetrics.totalSessions.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total Conversions</TableCell>
                    <TableCell className="text-right">{organicMetrics.totalConversions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{adsMetrics.totalConversions.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Conversion Rate</TableCell>
                    <TableCell className="text-right">{organicMetrics.overallConversionRate}%</TableCell>
                    <TableCell className="text-right">{adsMetrics.overallConversionRate}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
