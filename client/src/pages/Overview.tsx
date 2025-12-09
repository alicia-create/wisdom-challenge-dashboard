import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DATE_RANGES, type DateRange } from "@shared/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, DollarSign, ShoppingCart, TrendingUp, Info, AlertTriangle, AlertCircle, TrendingDown } from "lucide-react";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Overview() {
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES.LAST_30_DAYS);

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

  // Fetch email engagement
  const { data: emailEngagement } = trpc.overview.emailEngagement.useQuery();

  // Fetch channel performance (Meta vs Google)
  const { data: channelPerformance, isLoading: channelLoading } = trpc.overview.channelPerformance.useQuery({
    dateRange,
  });

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

  // Prepare chart data (reverse to show oldest to newest, left to right)
  const chartData = dailyKpis?.map((kpi: any) => ({
    date: new Date(kpi.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    spend: parseFloat(kpi.total_spend_meta || '0') + parseFloat(kpi.total_spend_google || '0'),
    leads: kpi.total_leads || 0,
    roas: parseFloat(kpi.roas || '0'),
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container py-6">
        <Breadcrumb items={[{ label: "Overview" }]} />
        {/* Date Filter */}
        <div className="flex justify-end mb-6">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        {/* Primary KPIs - Large Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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

          {/* ManyChat Bot Users */}
          <Card className="border-l-2 border-l-[#3A0CA3]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">ManyChat Bot Users</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Contacts who have interacted with the ManyChat bot</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <div className="text-xl font-bold">{metrics?.manychatBotUsers || 0}</div>
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

          {/* Broadcast Subscribers (Keap) */}
          <Card className="border-l-2 border-l-[#4895EF]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">Broadcast Subscribers</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total email broadcast subscribers from Keap (Reminder + Replay + Promo opt-ins)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <div className="text-xl font-bold">
                  {metrics?.broadcastSubscribers || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts Card */}
        <Card className="mb-6 border-l-4 border-l-red-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardTitle>Critical Alerts</CardTitle>
              </div>
              <a 
                href="/optimization-agent" 
                className="text-sm text-primary hover:underline"
              >
                View in Optimization Agent →
              </a>
            </div>
            <CardDescription>Recent performance warnings and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : recentAlerts && recentAlerts.length > 0 ? (
              <div className="space-y-3">
                {recentAlerts.map((alert: any) => (
                  <div 
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-0.5">
                      {alert.metric_type === 'cpp' && <DollarSign className="h-5 w-5 text-red-600" />}
                      {alert.metric_type === 'click_to_purchase' && <TrendingDown className="h-5 w-5 text-amber-600" />}
                      {alert.metric_type === 'creative_frequency' && <AlertCircle className="h-5 w-5 text-orange-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{alert.alert_type}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.triggered_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No critical alerts at the moment</p>
                <p className="text-xs mt-1">System is monitoring CPP, Click-to-Purchase, and Creative Frequency</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Ad Spend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Ad Spend</CardTitle>
              <CardDescription>Ad spend over time</CardDescription>
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
                    <Bar dataKey="spend" fill="#560BAD" name="Spend ($)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Daily Leads */}
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
        </div>

        {/* Performance by Channel Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Performance by Channel</CardTitle>
            <CardDescription>Meta vs Google comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {channelLoading ? (
              <Skeleton className="h-[150px] w-full" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Channel</th>
                      <th className="text-right py-3 px-4 font-medium">Spend ($)</th>
                      <th className="text-right py-3 px-4 font-medium">Leads</th>
                      <th className="text-right py-3 px-4 font-medium">CPL ($)</th>
                      <th className="text-right py-3 px-4 font-medium">VIPs</th>
                      <th className="text-right py-3 px-4 font-medium">CPP ($)</th>
                      <th className="text-right py-3 px-4 font-medium">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelPerformance?.meta && (
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{channelPerformance.meta.channel}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(channelPerformance.meta.spend)}</td>
                        <td className="text-right py-3 px-4">{formatNumber(channelPerformance.meta.leads)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(channelPerformance.meta.cpl)}</td>
                        <td className="text-right py-3 px-4">{formatNumber(channelPerformance.meta.vips)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(channelPerformance.meta.cpp)}</td>
                        <td className="text-right py-3 px-4">{channelPerformance.meta.roas.toFixed(2)}x</td>
                      </tr>
                    )}
                    {channelPerformance?.google && (
                      <tr className="hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{channelPerformance.google.channel}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(channelPerformance.google.spend)}</td>
                        <td className="text-right py-3 px-4">{formatNumber(channelPerformance.google.leads)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(channelPerformance.google.cpl)}</td>
                        <td className="text-right py-3 px-4">{formatNumber(channelPerformance.google.vips)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(channelPerformance.google.cpp)}</td>
                        <td className="text-right py-3 px-4">{channelPerformance.google.roas.toFixed(2)}x</td>
                      </tr>
                    )}
                    {(!channelPerformance?.meta && !channelPerformance?.google) && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          No ad performance data available yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
