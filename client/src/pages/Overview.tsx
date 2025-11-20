import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DATE_RANGES, type DateRange } from "@shared/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, DollarSign, ShoppingCart, TrendingUp, Target, Percent, Mail } from "lucide-react";
import { DateRangeFilter } from "@/components/DateRangeFilter";

export default function Overview() {
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES.LAST_30_DAYS);

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

  // Prepare chart data
  const chartData = dailyKpis?.map((kpi: any) => ({
    date: new Date(kpi.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    spend: parseFloat(kpi.total_spend_meta || '0') + parseFloat(kpi.total_spend_google || '0'),
    leads: kpi.total_leads || 0,
    roas: parseFloat(kpi.roas || '0'),
  })) || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                31-Day Wisdom Challenge Dashboard
              </h1>
              <p className="text-muted-foreground">
                Real-time analytics and performance metrics
              </p>
            </div>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* Primary KPIs - Large Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Leads */}
          <Card className="border-l-4 border-l-[#560BAD]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-5 w-5 text-[#560BAD]" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold">{metrics?.totalLeads || 0}</div>
              )}
            </CardContent>
          </Card>

          {/* Total VIP Sales */}
          <Card className="border-l-4 border-l-[#B5179E]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total VIP Sales</CardTitle>
              <ShoppingCart className="h-5 w-5 text-[#B5179E]" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold">{metrics?.vipSales || 0}</div>
              )}
            </CardContent>
          </Card>

          {/* Total Ad Spend */}
          <Card className="border-l-4 border-l-[#3A0CA3]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ad Spend</CardTitle>
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
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
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
              <CardTitle className="text-xs font-medium text-muted-foreground">Cost Per Lead</CardTitle>
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
              <CardTitle className="text-xs font-medium text-muted-foreground">Cost Per Purchase</CardTitle>
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
              <CardTitle className="text-xs font-medium text-muted-foreground">AOV</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <div className="text-xl font-bold">{formatCurrency(metrics?.aov || 0)}</div>
              )}
            </CardContent>
          </Card>

          {/* ROAS */}
          <Card className="border-l-2 border-l-[#3A0CA3]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">ROAS</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <div className="text-xl font-bold">{(metrics?.roas || 0).toFixed(2)}x</div>
              )}
            </CardContent>
          </Card>

          {/* VIP Take Rate */}
          <Card className="border-l-2 border-l-[#4361EE]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">VIP Take Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <div className="text-xl font-bold">{formatPercent(metrics?.vipTakeRate || 0)}</div>
              )}
            </CardContent>
          </Card>

          {/* Welcome Email Click Rate */}
          <Card className="border-l-2 border-l-[#4895EF]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Email Click Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-6 w-16" />
              ) : (
                <div className="text-xl font-bold">
                  {formatPercent(emailEngagement?.clickRate || 0)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {emailEngagement?.clicked || 0} / {emailEngagement?.totalLeads || 0} clicked
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Spend & Leads */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Spend & Leads</CardTitle>
              <CardDescription>Ad spend and lead generation over time</CardDescription>
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="spend" fill="#560BAD" name="Spend ($)" />
                    <Bar yAxisId="right" dataKey="leads" fill="#4895EF" name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* ROAS Trend */}
          <Card>
            <CardHeader>
              <CardTitle>ROAS Trend</CardTitle>
              <CardDescription>Return on ad spend over time</CardDescription>
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="roas" stroke="#B5179E" strokeWidth={2} name="ROAS" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
