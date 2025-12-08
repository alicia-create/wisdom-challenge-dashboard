import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FunnelVisualization } from "@/components/FunnelVisualization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { DATE_RANGES, type DateRange } from "@shared/constants";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES.LAST_30_DAYS);

  // Fetch funnel conversion metrics
  const { data: funnelData, isLoading: funnelLoading } = trpc.overview.funnelMetrics.useQuery({
    dateRange,
  });

  // Fetch GA4 metrics for landing page performance
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  const { data: ga4Metrics, isLoading: ga4Loading } = trpc.ga4.getMetrics.useQuery({
    startDate: sevenDaysAgo,
    endDate: today,
  });

  // Calculate top performing landing pages
  const topLandingPages = ga4Metrics
    ?.sort((a: any, b: any) => b.conversions - a.conversions)
    .slice(0, 5) || [];

  // Calculate engagement metrics
  const avgEngagementRate = ga4Metrics && ga4Metrics.length > 0
    ? (ga4Metrics.reduce((sum: number, page: any) => sum + page.engagement_rate, 0) / ga4Metrics.length).toFixed(1)
    : "0.0";

  const avgBounceRate = ga4Metrics && ga4Metrics.length > 0
    ? (ga4Metrics.reduce((sum: number, page: any) => sum + page.bounce_rate, 0) / ga4Metrics.length).toFixed(1)
    : "0.0";

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

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive analytics and conversion funnel insights
            </p>
          </div>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Engagement Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{avgEngagementRate}%</div>
                <Activity className="h-8 w-8 text-primary opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Across all landing pages (last 7 days)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Bounce Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{avgBounceRate}%</div>
                <TrendingDown className="h-8 w-8 text-red-500 opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Across all landing pages (last 7 days)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Landing Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{ga4Metrics?.length || 0}</div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tracked in Google Analytics 4
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <div className="mb-8">
          <FunnelVisualization 
            steps={funnelData?.steps || []} 
            isLoading={funnelLoading}
          />
        </div>

        {/* Top Performing Landing Pages */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top 5 Landing Pages by Conversions</CardTitle>
            <CardDescription>
              Best performing pages in the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ga4Loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : topLandingPages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No landing page data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topLandingPages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="landing_page" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="conversions" fill="#560BAD" name="Conversions" />
                  <Bar dataKey="sessions" fill="#7209B7" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Engagement vs Bounce Rate Scatter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Rate Distribution</CardTitle>
              <CardDescription>
                Engagement rate across all landing pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ga4Loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ga4Metrics?.slice(0, 10) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="landing_page" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="engagement_rate" fill="#560BAD" name="Engagement Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bounce Rate Distribution</CardTitle>
              <CardDescription>
                Bounce rate across all landing pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ga4Loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ga4Metrics?.slice(0, 10) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="landing_page" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="bounce_rate" fill="#DC2626" name="Bounce Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
