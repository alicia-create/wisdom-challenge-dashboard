import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { DATE_RANGES, type DateRange } from "@shared/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, DollarSign, ShoppingCart, TrendingUp, Info, AlertTriangle, AlertCircle, TrendingDown, RefreshCw } from "lucide-react";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTimeAgo } from "@/hooks/useTimeAgo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ConversionFunnel } from "@/components/ConversionFunnel";
import { VSLPerformance } from "@/components/VSLPerformance";

export default function Overview() {
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES.LAST_30_DAYS);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());

  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Fetch overview metrics with date range
  const { data: metrics, isLoading: metricsLoading } = trpc.overview.metrics.useQuery({
    dateRange,
  });

  // Fetch daily KPIs for charts with date range
  const { data: dailyKpis, isLoading: kpisLoading } = trpc.overview.dailyKpis.useQuery({
    dateRange,
  });

  // Fetch funnel metrics
  const { data: funnelMetrics, isLoading: funnelLoading } = trpc.overview.funnelMetrics.useQuery({
    dateRange,
  });

  // Fetch Paid Ads funnel (31daywisdom.com)
  const { data: paidAdsFunnel, isLoading: paidAdsLoading } = trpc.overview.paidAdsFunnel.useQuery({
    dateRange,
  });

  // Fetch Organic/Affiliate funnel (NOT 31daywisdom.com)
  const { data: organicFunnel, isLoading: organicLoading } = trpc.overview.organicFunnel.useQuery({
    dateRange,
  });

  // Fetch VSL performance metrics
  const { data: vslMetrics, isLoading: vslLoading } = trpc.overview.vslMetrics.useQuery({
    dateRange,
  });

  // Fetch email engagement
  const { data: emailEngagement } = trpc.overview.emailEngagement.useQuery();

   // Fetch channel performance with date range
  const { data: channelPerformance, isLoading: channelLoading } = trpc.overview.channelPerformance.useQuery({
    dateRange,
  });

  // Track last fetch time
  useEffect(() => {
    if (channelPerformance && !channelLoading) {
      setLastFetchTime(new Date());
    }
  }, [channelPerformance, channelLoading]);

  const timeAgo = useTimeAgo(lastFetchTime);

  // Fetch recent alerts
  const { data: recentAlerts, isLoading: alertsLoading } = trpc.alerts.getRecent.useQuery({ limit: 3 });



  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Format number with commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Prepare chart data and sort by date (oldest to newest, left to right)
  const chartData = (dailyKpis?.map((kpi: any) => {
    // Parse date as YYYY-MM-DD and treat as local date to avoid timezone shifts
    const [year, month, day] = kpi.date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return {
      date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dateObj,
      spend: parseFloat(kpi.total_spend_meta || '0') + parseFloat(kpi.total_spend_google || '0'),
      leads: kpi.total_leads || 0,
      vipSales: kpi.vip_sales || 0,
      roas: parseFloat(kpi.roas || '0'),
    };
  }) || []).sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime());

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container py-4 sm:py-6">
        <Breadcrumb items={[{ label: "Overview" }]} />
        {/* Date Filter and Refresh Button */}
        <div className="flex justify-end items-center gap-3 mb-4 sm:mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              trpc.useUtils().overview.metrics.invalidate();
              trpc.useUtils().overview.channelPerformance.invalidate();
              trpc.useUtils().overview.funnelMetrics.invalidate();
              trpc.useUtils().overview.paidAdsFunnel.invalidate();
              trpc.useUtils().overview.organicFunnel.invalidate();
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        {/* Primary KPIs - Large Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-4 sm:mb-6">
          {/* Total Leads */}
          <Card className="border-l-4 border-l-[#560BAD]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total number of leads generated from all campaigns</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Users className="h-5 w-5 text-[#560BAD]" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{metrics?.totalLeads || 0}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between mb-1">
                      <span>Goal: 200,000</span>
                      <span className="font-semibold">{((metrics?.totalLeads || 0) / 200000 * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-[#560BAD] h-1.5 rounded-full transition-all" 
                        style={{ width: `${Math.min(((metrics?.totalLeads || 0) / 200000 * 100), 100)}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Wisdom+ Sales */}
          <Card className="border-l-4 border-l-[#B5179E]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Total Wisdom+ Sales</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Number of Wisdom+ (Backstage Pass + Wisdom+ Experience) purchases</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <ShoppingCart className="h-5 w-5 text-[#B5179E]" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{metrics?.vipSales || 0}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between mb-1">
                      <span>Goal: 30,000</span>
                      <span className="font-semibold">{((metrics?.vipSales || 0) / 30000 * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-[#B5179E] h-1.5 rounded-full transition-all" 
                        style={{ width: `${Math.min(((metrics?.vipSales || 0) / 30000 * 100), 100)}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Kingdom Seeker Trials */}
          <Card className="border-l-4 border-l-[#7209B7]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Kingdom Seeker Trials</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Number of 60-day free trials to Kingdom Seekers (third funnel step)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <TrendingUp className="h-5 w-5 text-[#7209B7]" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold">{metrics?.kingdomSeekerTrials || 0}</div>
              )}
            </CardContent>
          </Card>

          {/* Total Ad Spend */}
          <Card className="border-l-4 border-l-[#3A0CA3]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Total Ad Spend</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Combined ad spend from Meta Ads + Google Ads</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <DollarSign className="h-5 w-5 text-[#3A0CA3]" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-3xl font-bold">{formatCurrency(metrics?.totalSpend || 0)}</div>
              )}
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="border-l-4 border-l-[#4361EE]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total revenue from Wisdom+ sales (Backstage Pass + Wisdom+ Experience)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <TrendingUp className="h-5 w-5 text-[#4361EE]" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-3xl font-bold">{formatCurrency(metrics?.totalRevenue || 0)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Secondary KPIs - Smaller Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Cost Per Lead */}
          <Card className="border-l-2 border-l-[#560BAD]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">Cost Per Lead</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total Spend ÷ Total Leads</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <div className="text-xl font-bold">{formatCurrency(metrics?.cpl || 0)}</div>
              )}
            </CardContent>
          </Card>

          {/* Cost Per Purchase */}
          <Card className="border-l-2 border-l-[#7209B7]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">Cost Per Purchase</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total Spend ÷ Total Wisdom+ Sales</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <div className="text-xl font-bold">{formatCurrency(metrics?.cpp || 0)}</div>
              )}
            </CardContent>
          </Card>

          {/* AOV */}
          <Card className="border-l-2 border-l-[#B5179E]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">AOV</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average Order Value: Total Revenue ÷ Total Wisdom+ Sales</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <div className="text-xl font-bold">{formatCurrency(metrics?.aov || 0)}</div>
              )}
            </CardContent>
          </Card>

          {/* Wisdom+ Conversion Rate */}
          <Card className="border-l-2 border-l-[#4361EE]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">Wisdom+ Conversion Rate</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Conversion rate: Total Wisdom+ Sales ÷ Total Leads</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <div className="text-xl font-bold">{formatPercent(metrics?.vipTakeRate || 0)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnels - Split by Source */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Paid Ads Funnel (31daywisdom.com) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-blue-600">💰</span>
                Paid Ads Funnel
              </CardTitle>
              <CardDescription>
                Traffic from 31daywisdom.com (Meta & Google Ads)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paidAdsLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : paidAdsFunnel ? (
                <ConversionFunnel data={paidAdsFunnel} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No paid ads funnel data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organic/Affiliate Funnel (NOT 31daywisdom.com) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-600">🌱</span>
                Organic & Affiliate Funnel
              </CardTitle>
              <CardDescription>
                Traffic from 31daywisdomchallenge.com and other sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {organicLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : organicFunnel ? (
                <ConversionFunnel data={organicFunnel} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No organic funnel data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Wisdom+ Sales Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Daily Wisdom+ Sales</CardTitle>
            <CardDescription>VIP purchases over time (orders $31+)</CardDescription>
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="vipSales" fill="#10B981" name="Wisdom+ Sales" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Daily Leads Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Leads</CardTitle>
            <CardDescription>Lead generation over time</CardDescription>
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="leads" fill="#4895EF" name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Meta Performance Card */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Meta Performance</CardTitle>
                <CardDescription>Facebook & Instagram advertising metrics</CardDescription>
              </div>
              {channelPerformance?.meta && timeAgo && (
                <div className="text-xs text-muted-foreground">
                  Last updated: {timeAgo}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {channelLoading ? (
              <Skeleton className="h-[150px] w-full" />
            ) : channelPerformance?.meta ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Type</th>
                      <th className="text-right py-3 px-4 font-medium">Spend ($)</th>
                      <th className="text-right py-3 px-4 font-medium">Clicks</th>
                      <th className="text-right py-3 px-4 font-medium">Leads</th>
                      <th className="text-right py-3 px-4 font-medium">CPL ($)</th>
                      <th className="text-right py-3 px-4 font-medium">VIPs</th>
                      <th className="text-right py-3 px-4 font-medium">CPP ($)</th>
                      <th className="text-right py-3 px-4 font-medium">Connect Rate</th>
                      <th className="text-right py-3 px-4 font-medium">Click to Lead</th>
                      <th className="text-right py-3 px-4 font-medium">Click to Purchase</th>
                      <th className="text-right py-3 px-4 font-medium">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Meta Total Row */}
                    <tr className="border-b bg-blue-50/50 dark:bg-blue-950/20 font-semibold">
                      <td className="py-3 px-4">Total</td>
                      <td className="text-right py-3 px-4">{formatCurrency(channelPerformance.meta.spend)}</td>
                      <td className="text-right py-3 px-4">{formatNumber(channelPerformance.meta.clicks)}</td>
                      <td className="text-right py-3 px-4">{formatNumber(channelPerformance.meta.leads)}</td>
                      <td className="text-right py-3 px-4">{formatCurrency(channelPerformance.meta.cpl)}</td>
                      <td className="text-right py-3 px-4">{formatNumber(channelPerformance.meta.vips)}</td>
                      <td className="text-right py-3 px-4">{formatCurrency(channelPerformance.meta.cpp)}</td>
                      <td className="text-right py-3 px-4">{formatPercent(channelPerformance.meta.connectRate)}</td>
                      <td className="text-right py-3 px-4">{formatPercent(channelPerformance.meta.clickToLeadRate)}</td>
                      <td className="text-right py-3 px-4">{formatPercent(channelPerformance.meta.clickToPurchaseRate)}</td>
                      <td className="text-right py-3 px-4">{channelPerformance.meta.roas.toFixed(2)}x</td>
                    </tr>
                    {/* Meta Breakdown Rows */}
                    {Object.entries(channelPerformance.meta.breakdown || {}).map(([type, data]: [string, any]) => (
                      <tr key={`meta-${type}`} className="border-b hover:bg-muted/50 text-sm">
                        <td className="py-2 px-4 pl-4 text-muted-foreground">{type}</td>
                        <td className="text-right py-2 px-4">{formatCurrency(data.spend)}</td>
                        <td className="text-right py-2 px-4">{formatNumber(data.clicks)}</td>
                        <td className="text-right py-2 px-4">{formatNumber(data.leads)}</td>
                        <td className="text-right py-2 px-4">{data.leads > 0 ? formatCurrency(data.spend / data.leads) : '$0.00'}</td>
                        <td className="text-right py-2 px-4">{formatNumber(data.vips)}</td>
                        <td className="text-right py-2 px-4">{data.vips > 0 ? formatCurrency(data.spend / data.vips) : '$0.00'}</td>
                        <td className="text-right py-2 px-4">{data.clicks > 0 ? formatPercent((data.landingPageViews / data.clicks) * 100) : '0.00%'}</td>
                        <td className="text-right py-2 px-4">{data.clicks > 0 ? formatPercent((data.leads / data.clicks) * 100) : '0.00%'}</td>
                        <td className="text-right py-2 px-4">{data.clicks > 0 ? formatPercent((data.vips / data.clicks) * 100) : '0.00%'}</td>
                        <td className="text-right py-2 px-4">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No Meta ad performance data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Performance Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Google Performance</CardTitle>
            <CardDescription>Google Ads search campaign metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {channelLoading ? (
              <Skeleton className="h-[150px] w-full" />
            ) : channelPerformance?.google ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Type</th>
                      <th className="text-right py-3 px-4 font-medium">Spend ($)</th>
                      <th className="text-right py-3 px-4 font-medium">Leads</th>
                      <th className="text-right py-3 px-4 font-medium">CPL ($)</th>
                      <th className="text-right py-3 px-4 font-medium">VIPs</th>
                      <th className="text-right py-3 px-4 font-medium">CPP ($)</th>
                      <th className="text-right py-3 px-4 font-medium">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Google Total Row */}
                    <tr className="border-b bg-green-50/50 dark:bg-green-950/20 font-semibold">
                      <td className="py-3 px-4">Total</td>
                      <td className="text-right py-3 px-4">{formatCurrency(channelPerformance.google.spend)}</td>
                      <td className="text-right py-3 px-4">{formatNumber(channelPerformance.google.leads)}</td>
                      <td className="text-right py-3 px-4">{formatCurrency(channelPerformance.google.cpl)}</td>
                      <td className="text-right py-3 px-4">{formatNumber(channelPerformance.google.vips)}</td>
                      <td className="text-right py-3 px-4">{formatCurrency(channelPerformance.google.cpp)}</td>
                      <td className="text-right py-3 px-4">{channelPerformance.google.roas.toFixed(2)}x</td>
                    </tr>
                    {/* Google Breakdown Rows */}
                    {Object.entries(channelPerformance.google.breakdown || {}).map(([type, data]: [string, any]) => (
                      <tr key={`google-${type}`} className="border-b hover:bg-muted/50 text-sm">
                        <td className="py-2 px-4 pl-4 text-muted-foreground">{type}</td>
                        <td className="text-right py-2 px-4">{formatCurrency(data.spend)}</td>
                        <td className="text-right py-2 px-4">{formatNumber(data.leads)}</td>
                        <td className="text-right py-2 px-4">{data.leads > 0 ? formatCurrency(data.spend / data.leads) : '$0.00'}</td>
                        <td className="text-right py-2 px-4">{formatNumber(data.vips)}</td>
                        <td className="text-right py-2 px-4">{data.vips > 0 ? formatCurrency(data.spend / data.vips) : '$0.00'}</td>
                        <td className="text-right py-2 px-4">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No Google ad performance data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* VSL Performance */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>VSL Performance</CardTitle>
            <CardDescription>
              Vidalytics watch milestones and Wisdom+ conversion
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vslLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : vslMetrics ? (
              <VSLPerformance data={vslMetrics} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No VSL data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
