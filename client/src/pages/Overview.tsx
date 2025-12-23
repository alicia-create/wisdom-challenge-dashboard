import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { DATE_RANGES, type DateRange, getDateRangeValues } from "@shared/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, DollarSign, ShoppingCart, TrendingUp, Info, RefreshCw } from "lucide-react";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTimeAgo } from "@/hooks/useTimeAgo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ConversionFunnel } from "@/components/ConversionFunnel";
import { VSLPerformance } from "@/components/VSLPerformance";
import { FollowersGrowthChart } from "@/components/FollowersGrowthChart";

export default function Overview() {
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES.ALL);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());

  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();

  // Mutation to clear server-side cache
  const clearCacheMutation = trpc.overview.clearCache.useMutation();

  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Get date range values
  const { startDate, endDate } = getDateRangeValues(dateRange);

  // Fetch unified metrics from SQL function (single optimized query)
  const { data: unifiedData, isLoading: unifiedLoading } = trpc.overview.unifiedMetrics.useQuery({
    startDate,
    endDate,
  });

  // Fetch social media followers data for growth chart
  const { data: followersData, isLoading: followersLoading } = trpc.socialMedia.list.useQuery();

  // Daily KPIs are now included in unifiedMetrics response

  // Track last fetch time
  useEffect(() => {
    if (unifiedData && !unifiedLoading) {
      setLastFetchTime(new Date());
    }
  }, [unifiedData, unifiedLoading]);

  const timeAgo = useTimeAgo(lastFetchTime);

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

  // Extract data from unified response
  const kpis = unifiedData?.kpis;
  const paidAdsFunnel = unifiedData?.paidAdsFunnel;
  const organicFunnel = unifiedData?.organicFunnel;
  const metaPerformance = unifiedData?.metaPerformance;
  const metaCampaignBreakdown = unifiedData?.metaCampaignBreakdown;
  const googlePerformance = unifiedData?.googlePerformance;
  const vslPerformance = unifiedData?.vslPerformance;
  const journals = unifiedData?.journals;
  const dailyKpis = unifiedData?.dailyKpis;

  // Prepare chart data from daily metrics (filter out days with no activity)
  // Start from Dec 13, 2025 as requested
  const chartStartDate = new Date(2025, 11, 13); // Dec 13, 2025 (month is 0-indexed)
  const chartData = (dailyKpis
    ?.filter((kpi: any) => (kpi.totalLeads || 0) > 0 || (kpi.totalWisdomSales || 0) > 0)
    .map((kpi: any) => {
      const [year, month, day] = kpi.date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return {
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateObj,
        spend: parseFloat(kpi.totalAdSpend || '0'),
        leads: kpi.totalLeads || 0,
        vipSales: kpi.totalWisdomSales || 0,
        roas: parseFloat(kpi.roas || '0'),
      };
    })
    .filter((item: any) => item.dateObj >= chartStartDate) || []).sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime());
  
  console.log('[Overview] Chart data:', chartData.length, 'days', chartData.slice(0, 3));

  // Transform funnel data for ConversionFunnel component
  const transformFunnelData = (funnel: any) => ({
    totalLeads: funnel?.leads || 0,
    wisdomPurchases: funnel?.wisdomSales || 0,
    extraJournals: funnel?.extraJournals || 0,
    kingdomSeekerTrials: funnel?.kingdomSeekers || 0,
    manychatConnected: funnel?.manychatConnected || 0,
    botAlertsSubscribed: funnel?.botAlertsSubscribed || 0,
    leadToWisdomRate: funnel?.leadToWisdomRate || 0,
    wisdomToKingdomRate: funnel?.wisdomToKingdomRate || 0,
    kingdomToManychatRate: funnel?.leadsToManychatRate || 0,
    manychatToBotAlertsRate: funnel?.manychatToBotAlertsRate || 0,
  });

  // Transform VSL data for VSLPerformance component
  const transformVslData = (vsl: any) => ({
    totalLeads: vsl?.totalLeads || 0,
    vsl5Percent: vsl?.vsl5PercentViews || 0,
    vsl25Percent: vsl?.vsl25PercentViews || 0,
    vsl50Percent: vsl?.vsl50PercentViews || 0,
    vsl95Percent: vsl?.vsl95PercentViews || 0,
    dropOff5Percent: vsl?.dropOffLeadsTo5 || 0,
    dropOff25Percent: vsl?.dropOff5To25 || 0,
    dropOff50Percent: vsl?.dropOff25To50 || 0,
    dropOff95Percent: vsl?.dropOff50To95 || 0,
    wisdomPurchases: vsl?.wisdomPurchases || 0,
    vslToPurchaseRate: vsl?.vsl95ToPurchaseRate || 0,
  });

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
            onClick={async () => {
              // Clear server-side cache first
              await clearCacheMutation.mutateAsync();
              // Then invalidate client-side queries to refetch
              await utils.overview.unifiedMetrics.invalidate();
              await utils.overview.dailyKpis.invalidate();
              setLastFetchTime(new Date());
            }}
            disabled={clearCacheMutation.isPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${clearCacheMutation.isPending ? 'animate-spin' : ''}`} />
            {clearCacheMutation.isPending ? 'Refreshing...' : 'Refresh Data'}
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
              {unifiedLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{kpis?.totalLeads || 0}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between mb-1">
                      <span>Goal: 200,000</span>
                      <span className="font-semibold">{((kpis?.totalLeads || 0) / 200000 * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-[#560BAD] h-1.5 rounded-full transition-all" 
                        style={{ width: `${Math.min(((kpis?.totalLeads || 0) / 200000 * 100), 100)}%` }}
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
                    <p>Number of Wisdom+ (Backstage Pass) purchases</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <ShoppingCart className="h-5 w-5 text-[#B5179E]" />
            </CardHeader>
            <CardContent>
              {unifiedLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl sm:text-3xl font-bold">{kpis?.wisdomSales || 0}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between mb-1">
                      <span>Goal: 30,000</span>
                      <span className="font-semibold">{((kpis?.wisdomSales || 0) / 30000 * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div 
                        className="bg-[#B5179E] h-1.5 rounded-full transition-all" 
                        style={{ width: `${Math.min(((kpis?.wisdomSales || 0) / 30000 * 100), 100)}%` }}
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
                    <p>Number of 60-day free trials to Kingdom Seekers</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <TrendingUp className="h-5 w-5 text-[#7209B7]" />
            </CardHeader>
            <CardContent>
              {unifiedLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl sm:text-3xl font-bold">{kpis?.kingdomSeekerTrials || 0}</div>
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
                    <p>Meta Lead + Sales campaigns spend (used for CPL/CPP calculations)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <DollarSign className="h-5 w-5 text-[#3A0CA3]" />
            </CardHeader>
            <CardContent>
              {unifiedLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold break-words">
                    {formatCurrency((metaCampaignBreakdown?.leads?.spend || 0) + (metaCampaignBreakdown?.sales?.spend || 0))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Meta Lead + Sales Campaigns
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    All: {formatCurrency((kpis?.totalSpend || 0) + (googlePerformance?.spend || 0))}
                  </p>
                </>              )}
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
                    <p>Total revenue from Wisdom+ sales (Backstage Pass + Extras)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <TrendingUp className="h-5 w-5 text-[#4361EE]" />
            </CardHeader>
            <CardContent>
              {unifiedLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-xl sm:text-2xl md:text-3xl font-bold break-words">{formatCurrency(kpis?.totalRevenue || 0)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Secondary KPIs - Smaller Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* 1. Wisdom Conversion */}
          <Card className="border-l-2 border-l-[#4361EE]">
            <CardHeader className="pb-1">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">Conversion</CardTitle>
                <Tooltip>
                  <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p>Wisdom+ Sales ÷ Total Leads</p></TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              {unifiedLoading ? <Skeleton className="h-6 w-16" /> : (
                <div className="text-lg sm:text-xl font-bold">{formatPercent(kpis?.wisdomConversion || 0)}</div>
              )}
            </CardContent>
          </Card>

          {/* 2. Journals */}
          <Card className="border-l-2 border-l-[#10B981]">
            <CardHeader className="pb-1">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">Journals</CardTitle>
                <Tooltip>
                  <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent>
                    <p>Wisdom+: {journals?.wisdomJournals || 0} | Extra: {journals?.extraJournals || 0}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              {unifiedLoading ? <Skeleton className="h-6 w-16" /> : (
                <>
                  <div className="text-lg sm:text-xl font-bold">{formatNumber(journals?.totalJournals || 0)}</div>
                  <p className="text-xs text-muted-foreground">{journals?.journalProgress || 0}% of 20k</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* 3. Cost Per Purchase */}
          <Card className="border-l-2 border-l-[#7209B7]">
            <CardHeader className="pb-1">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">CPP (Ads)</CardTitle>
                <Tooltip>
                  <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Spend: {formatCurrency((metaCampaignBreakdown?.leads?.spend || 0) + (metaCampaignBreakdown?.sales?.spend || 0))}</p>
                    <p>Sales: {formatNumber(paidAdsFunnel?.wisdomSales || 0)}</p>
                    <p className="text-xs mt-1">Excellent ≤$30 | Great ≤$60 | Good ≤$90</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              {unifiedLoading ? <Skeleton className="h-6 w-16" /> : (() => {
                const cppValue = kpis?.cppAds || 0;
                const cppColor = cppValue <= 30 ? 'text-green-600' : cppValue <= 60 ? 'text-emerald-500' : cppValue <= 90 ? 'text-yellow-600' : 'text-red-500';
                const trueCpp = kpis?.trueCpp || 0;
                return (
                  <>
                    <div className={`text-lg sm:text-xl font-bold ${cppColor}`}>{formatCurrency(cppValue)}</div>
                    <p className="text-xs text-muted-foreground">True: {formatCurrency(trueCpp)}</p>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* 4. Cost Per Lead */}
          <Card className="border-l-2 border-l-[#560BAD]">
            <CardHeader className="pb-1">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">CPL (Ads)</CardTitle>
                <Tooltip>
                  <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Spend: {formatCurrency((metaCampaignBreakdown?.leads?.spend || 0) + (metaCampaignBreakdown?.sales?.spend || 0))}</p>
                    <p>Leads: {formatNumber(paidAdsFunnel?.leads || 0)}</p>
                    <p className="text-xs mt-1">Excellent ≤$3 | Great ≤$6 | Good ≤$9</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              {unifiedLoading ? <Skeleton className="h-6 w-16" /> : (() => {
                const cplValue = kpis?.cplAds || 0;
                const cplColor = cplValue <= 3 ? 'text-green-600' : cplValue <= 6 ? 'text-emerald-500' : cplValue <= 9 ? 'text-yellow-600' : 'text-red-500';
                const trueCpl = kpis?.trueCpl || 0;
                return (
                  <>
                    <div className={`text-lg sm:text-xl font-bold ${cplColor}`}>{formatCurrency(cplValue)}</div>
                    <p className="text-xs text-muted-foreground">True: {formatCurrency(trueCpl)}</p>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* 5. AOV */}
          <Card className="border-l-2 border-l-[#B5179E]">
            <CardHeader className="pb-1">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">AOV</CardTitle>
                <Tooltip>
                  <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p>Total Revenue ÷ Wisdom+ Sales</p></TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              {unifiedLoading ? <Skeleton className="h-6 w-16" /> : (
                <div className="text-lg sm:text-xl font-bold">{formatCurrency(kpis?.aov || 0)}</div>
              )}
            </CardContent>
          </Card>

          {/* 6. Welcome Email */}
          <Card className="border-l-2 border-l-[#F72585]">
            <CardHeader className="pb-1">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">Email Clicks</CardTitle>
                <Tooltip>
                  <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p>Leads who clicked NTN link in welcome email</p></TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              {unifiedLoading ? <Skeleton className="h-6 w-16" /> : (
                <>
                  <div className="text-xl font-bold">{kpis?.welcomeEmailClicks || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {kpis?.totalLeads ? ((kpis.welcomeEmailClicks / kpis.totalLeads) * 100).toFixed(1) : 0}% of leads
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnels - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Paid Ads Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-blue-600">💰</span>
                Paid Ads Funnel
              </CardTitle>
              <CardDescription>
                First-party data from 31daywisdom.com (Meta & Google Ads traffic only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unifiedLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : paidAdsFunnel ? (
                <ConversionFunnel data={transformFunnelData(paidAdsFunnel)} funnelType="paid" />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No paid ads funnel data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organic/Affiliate Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-600">🌱</span>
                Organic & Affiliate Funnel
              </CardTitle>
              <CardDescription>
                First-party data from 31daywisdomchallenge.com (Organic & Affiliate traffic)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unifiedLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : organicFunnel ? (
                <ConversionFunnel data={transformFunnelData(organicFunnel)} funnelType="organic" />
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
            <CardDescription>All Wisdom+ purchases</CardDescription>
          </CardHeader>
          <CardContent>
            {unifiedLoading ? (
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
            <CardDescription>All Challenge Leads</CardDescription>
          </CardHeader>
          <CardContent>
            {unifiedLoading ? (
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
                <CardDescription>Third-party Data from Meta Ads</CardDescription>
              </div>
              {timeAgo && (
                <div className="text-xs text-muted-foreground">
                  Last updated: {timeAgo}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {unifiedLoading ? (
              <Skeleton className="h-[150px] w-full" />
            ) : metaPerformance ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Type</th>
                      <th className="text-right py-3 px-2 font-medium">Spend</th>
                      <th className="text-right py-3 px-2 font-medium">Reported Purchases</th>
                      <th className="text-right py-3 px-2 font-medium">CPP</th>
                      <th className="text-right py-3 px-2 font-medium">Sales Rate</th>
                      <th className="text-right py-3 px-2 font-medium">Reported Leads</th>
                      <th className="text-right py-3 px-2 font-medium">CPL</th>
                      <th className="text-right py-3 px-2 font-medium">Lead Rate</th>
                      <th className="text-right py-3 px-2 font-medium">Clicks</th>
                      <th className="text-right py-3 px-2 font-medium">CPC</th>
                      <th className="text-right py-3 px-2 font-medium">CTR</th>
                      <th className="text-right py-3 px-2 font-medium">CPM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Meta Total Row */}
                    <tr className="border-b bg-blue-50/50 dark:bg-blue-950/20 font-semibold">
                      <td className="py-3 px-2">Total</td>
                      <td className="text-right py-3 px-2">{formatCurrency(metaPerformance.spend)}</td>
                      <td className="text-right py-3 px-2">{formatNumber(metaPerformance.purchases || 0)}</td>
                      <td className="text-right py-3 px-2">{formatCurrency(metaPerformance.cpp || 0)}</td>
                      <td className="text-right py-3 px-2">{formatPercent(metaPerformance.salesRate || 0)}</td>
                      <td className="text-right py-3 px-2">{formatNumber(metaPerformance.leads || 0)}</td>
                      <td className="text-right py-3 px-2">{formatCurrency(metaPerformance.cpl || 0)}</td>
                      <td className="text-right py-3 px-2">{formatPercent(metaPerformance.leadRate || 0)}</td>
                      <td className="text-right py-3 px-2">{formatNumber(metaPerformance.clicks)}</td>
                      <td className="text-right py-3 px-2">{formatCurrency(metaPerformance.cpc)}</td>
                      <td className="text-right py-3 px-2">{formatPercent(metaPerformance.ctr)}</td>
                      <td className="text-right py-3 px-2">{formatCurrency(metaPerformance.cpm)}</td>
                    </tr>
                    {/* Meta Breakdown Rows */}
                    {metaCampaignBreakdown && (() => {
                      const sortOrder = ['sales', 'leads', 'retargeting', 'content', 'other'];
                      const sortedEntries = Object.entries(metaCampaignBreakdown).sort(([a], [b]) => {
                        const indexA = sortOrder.indexOf(a);
                        const indexB = sortOrder.indexOf(b);
                        const orderA = indexA === -1 ? sortOrder.length : indexA;
                        const orderB = indexB === -1 ? sortOrder.length : indexB;
                        return orderA - orderB;
                      });
                      return sortedEntries;
                    })().map(([type, data]: [string, any]) => (
                      <tr key={`meta-${type}`} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2 text-muted-foreground capitalize">{type}</td>
                        <td className="text-right py-2 px-2">{formatCurrency(data.spend)}</td>
                        <td className="text-right py-2 px-2">{formatNumber(data.purchases || 0)}</td>
                        <td className="text-right py-2 px-2">{formatCurrency(data.cpp || 0)}</td>
                        <td className="text-right py-2 px-2">{formatPercent(data.salesRate || 0)}</td>
                        <td className="text-right py-2 px-2">{formatNumber(data.leads || 0)}</td>
                        <td className="text-right py-2 px-2">{formatCurrency(data.cpl || 0)}</td>
                        <td className="text-right py-2 px-2">{formatPercent(data.leadRate || 0)}</td>
                        <td className="text-right py-2 px-2">{formatNumber(data.clicks)}</td>
                        <td className="text-right py-2 px-2">{formatCurrency(data.cpc)}</td>
                        <td className="text-right py-2 px-2">{formatPercent(data.ctr)}</td>
                        <td className="text-right py-2 px-2">{formatCurrency(data.cpm)}</td>
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
            <CardDescription>Third-party Data from Google Ads</CardDescription>
          </CardHeader>
          <CardContent>
            {unifiedLoading ? (
              <Skeleton className="h-[150px] w-full" />
            ) : googlePerformance && googlePerformance.spend > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Type</th>
                      <th className="text-right py-3 px-4 font-medium">Spend ($)</th>
                      <th className="text-right py-3 px-4 font-medium">Clicks</th>
                      <th className="text-right py-3 px-4 font-medium">Impressions</th>
                      <th className="text-right py-3 px-4 font-medium">Conversions</th>
                      <th className="text-right py-3 px-4 font-medium">CPC ($)</th>
                      <th className="text-right py-3 px-4 font-medium">CPM ($)</th>
                      <th className="text-right py-3 px-4 font-medium">CTR (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-green-50/50 dark:bg-green-950/20 font-semibold">
                      <td className="py-3 px-4">Total</td>
                      <td className="text-right py-3 px-4">{formatCurrency(googlePerformance.spend)}</td>
                      <td className="text-right py-3 px-4">{formatNumber(googlePerformance.clicks)}</td>
                      <td className="text-right py-3 px-4">{formatNumber(googlePerformance.impressions)}</td>
                      <td className="text-right py-3 px-4">{formatNumber(googlePerformance.conversions || 0)}</td>
                      <td className="text-right py-3 px-4">{formatCurrency(googlePerformance.cpc)}</td>
                      <td className="text-right py-3 px-4">{formatCurrency(googlePerformance.cpm)}</td>
                      <td className="text-right py-3 px-4">{formatPercent(googlePerformance.ctr)}</td>
                    </tr>
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
            {unifiedLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : vslPerformance ? (
              <VSLPerformance data={transformVslData(vslPerformance)} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No VSL data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Media Followers Growth Chart */}
        <div className="mt-6">
          {followersLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Social Media Followers Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <FollowersGrowthChart data={followersData || []} />
          )}
        </div>
      </div>
    </div>
  );
}
