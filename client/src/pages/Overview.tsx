import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Users, ShoppingCart, Target, Percent } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";

export default function Overview() {
  const { data: overview, isLoading: overviewLoading } = trpc.dashboard.overview.useQuery();
  const { data: dailyKpis, isLoading: kpisLoading } = trpc.dashboard.dailyKpis.useQuery();

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!dailyKpis) return [];
    
    return dailyKpis
      .slice()
      .reverse()
      .map((kpi) => ({
        date: new Date(kpi.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        spend: parseFloat(kpi.total_spend || '0'),
        leads: kpi.total_leads || 0,
        roas: parseFloat(kpi.roas || '0'),
      }));
  }, [dailyKpis]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (overviewLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Leads",
      value: formatNumber(overview?.totalLeads || 0),
      icon: Users,
      description: "All-time lead acquisition",
    },
    {
      title: "Total Spend",
      value: formatCurrency(overview?.totalSpend || 0),
      icon: DollarSign,
      description: "Total ad spend across platforms",
    },
    {
      title: "Cost Per Lead (CPL)",
      value: formatCurrency(overview?.cpl || 0),
      icon: Target,
      description: "Average cost to acquire a lead",
    },
    {
      title: "VIP Sales",
      value: formatNumber(overview?.vipSales || 0),
      icon: ShoppingCart,
      description: "Total VIP purchases",
    },
    {
      title: "Cost Per Purchase (CPP)",
      value: formatCurrency(overview?.cpp || 0),
      icon: TrendingUp,
      description: "Average cost per VIP sale",
    },
    {
      title: "ROAS",
      value: `${(overview?.roas || 0).toFixed(2)}x`,
      icon: Percent,
      description: `Return on Ad Spend: ${formatCurrency(overview?.vipRevenue || 0)} revenue`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">{kpi.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Spend & Leads Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Spend & Leads</CardTitle>
            <CardDescription>Tracking ad spend and lead acquisition over time</CardDescription>
          </CardHeader>
          <CardContent>
            {kpisLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="spend"
                    stroke="hsl(var(--chart-1))"
                    name="Spend ($)"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="leads"
                    stroke="hsl(var(--chart-2))"
                    name="Leads"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ROAS Chart */}
        <Card>
          <CardHeader>
            <CardTitle>ROAS Trend</CardTitle>
            <CardDescription>Return on Ad Spend performance</CardDescription>
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
                  <Line
                    type="monotone"
                    dataKey="roas"
                    stroke="hsl(var(--chart-3))"
                    name="ROAS"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
