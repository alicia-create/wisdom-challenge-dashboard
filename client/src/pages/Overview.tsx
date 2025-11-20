import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, TrendingUp, ShoppingCart, Mail, Target } from "lucide-react";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { DATE_RANGES, type DateRange } from "@shared/constants";
import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * Overview Page - Main dashboard with KPIs and trends
 * 
 * Displays:
 * - Total Leads, Total Spend, CPL
 * - VIP Sales, VIP Revenue, CPP, ROAS
 * - Email Engagement Rate
 * - Daily Spend & Leads Chart
 * - ROAS Trend Chart
 */
export default function Overview() {
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES.LAST_30_DAYS);
  
  const { data: metrics, isLoading: metricsLoading } = trpc.overview.metrics.useQuery({ dateRange });
  const { data: dailyKpis, isLoading: kpisLoading } = trpc.overview.dailyKpis.useQuery({ dateRange });
  const { data: emailEngagement } = trpc.overview.emailEngagement.useQuery();

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Prepare chart data
  const chartData = dailyKpis?.map((kpi) => ({
    date: new Date(kpi.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    spend: parseFloat(kpi.total_spend_meta || '0') + parseFloat(kpi.total_spend_google || '0'),
    leads: kpi.total_leads || 0,
    roas: parseFloat(kpi.roas || '0'),
  })).reverse() || [];

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

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Leads */}
          <Card className="border-l-4 border-l-chart-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Leads
              </CardTitle>
              <Users className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold text-foreground">
                  {metrics?.totalLeads.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Spend */}
          <Card className="border-l-4 border-l-chart-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Spend
              </CardTitle>
              <DollarSign className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold text-foreground">
                  {formatCurrency(metrics?.totalSpend || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Per Lead */}
          <Card className="border-l-4 border-l-chart-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cost Per Lead
              </CardTitle>
              <Target className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold text-foreground">
                  {formatCurrency(metrics?.cpl || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* VIP Sales */}
          <Card className="border-l-4 border-l-chart-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                VIP Sales
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold text-foreground">
                  {metrics?.vipSales.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Per Purchase */}
          <Card className="border-l-4 border-l-chart-5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cost Per Purchase
              </CardTitle>
              <DollarSign className="h-4 w-4 text-chart-5" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold text-foreground">
                  {formatCurrency(metrics?.cpp || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ROAS */}
          <Card className="border-l-4 border-l-chart-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ROAS
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-6" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold text-foreground">
                  {metrics?.roas.toFixed(2)}x
                </div>
              )}
            </CardContent>
          </Card>

          {/* VIP Take Rate */}
          <Card className="border-l-4 border-l-chart-7">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                VIP Take Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-7" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold text-foreground">
                  {formatPercent(metrics?.vipTakeRate || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Click Rate */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Email Click Rate
              </CardTitle>
              <Mail className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-3xl font-bold text-foreground">
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
          {/* Daily Spend & Leads Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Spend & Leads</CardTitle>
              <CardDescription>
                Ad spend and lead generation over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="spend" 
                      fill="hsl(var(--chart-2))" 
                      name="Spend ($)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="leads" 
                      fill="hsl(var(--chart-1))" 
                      name="Leads"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* ROAS Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>ROAS Trend</CardTitle>
              <CardDescription>
                Return on ad spend over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="roas" 
                      stroke="hsl(var(--chart-6))" 
                      strokeWidth={3}
                      name="ROAS"
                      dot={{ fill: 'hsl(var(--chart-6))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
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
