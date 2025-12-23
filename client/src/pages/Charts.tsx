import { useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { DATE_RANGES, type DateRange, getDateRangeValues } from '@shared/constants';

export default function Charts() {
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES.ALL);
  const { startDate, endDate } = getDateRangeValues(dateRange);

  const { data: dailyMetrics, isLoading } = trpc.daily.getDailyMetrics.useQuery({
    startDate,
    endDate,
  });

  // Transform data for charts
  const chartData = useMemo(() => {
    if (!dailyMetrics?.dailyData) return [];

    return dailyMetrics.dailyData.map((day: any) => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      spend: day.totalAdSpend || 0,
      leads: day.totalLeads || 0,
      cpl: day.cpl || 0,
      purchases: day.totalWisdomSales || 0,
      newCustomers: day.totalWisdomSales || 0,
      firstPayment: day.totalWisdomSales || 0,
      cpp: day.cpp || 0,
      cpnc: day.cpp || 0,
      leadRate: day.paidLeads > 0 && day.metaTotal?.landingPageViews > 0 
        ? (day.paidLeads / day.metaTotal.landingPageViews) * 100 
        : 0,
      salesRate: day.totalLeads > 0 ? (day.totalWisdomSales / day.totalLeads) * 100 : 0,
      leadToSalesRate: day.metaTotal?.landingPageViews > 0 
        ? (day.totalWisdomSales / day.metaTotal.landingPageViews) * 100 
        : 0,
    }));
  }, [dailyMetrics]);

  // Calculate cumulative leads
  const cumulativeData = useMemo(() => {
    let cumulative = 0;
    return chartData.map((day: any) => {
      cumulative += day.leads;
      return {
        ...day,
        cumulativeLeads: cumulative,
      };
    });
  }, [chartData]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!chartData.length) return { spend: 0, leads: 0, cpl: 0, purchases: 0, cpp: 0, leadRate: 0, salesRate: 0, leadToSalesRate: 0 };

    const totalSpend = chartData.reduce((sum: number, day: any) => sum + day.spend, 0);
    const totalLeads = chartData.reduce((sum: number, day: any) => sum + day.leads, 0);
    const totalPurchases = chartData.reduce((sum: number, day: any) => sum + day.purchases, 0);

    return {
      spend: totalSpend,
      leads: totalLeads,
      cpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
      purchases: totalPurchases,
      cpp: totalPurchases > 0 ? totalSpend / totalPurchases : 0,
      leadRate: chartData.length > 0 ? chartData.reduce((sum: number, d: any) => sum + d.leadRate, 0) / chartData.length : 0,
      salesRate: chartData.length > 0 ? chartData.reduce((sum: number, d: any) => sum + d.salesRate, 0) / chartData.length : 0,
      leadToSalesRate: chartData.length > 0 ? chartData.reduce((sum: number, d: any) => sum + d.leadToSalesRate, 0) / chartData.length : 0,
    };
  }, [chartData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container py-8">
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="container py-8">
        {/* Date Range Filter */}
        <div className="flex justify-end mb-6">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Amount Spent */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">Amount Spent</CardTitle>
              <p className="text-4xl font-bold text-pink-600">{formatCurrency(totals.spend)}</p>
              <p className="text-sm text-muted-foreground">Amount Spent</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="spend" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lead */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Lead</CardTitle>
              <p className="text-4xl font-bold text-orange-500">{formatNumber(totals.leads)}</p>
              <p className="text-sm text-muted-foreground">Lead</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => formatNumber(value)}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulativeLeads"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ fill: '#f97316', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cost Per Lead */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Cost Per Lead</CardTitle>
              <p className="text-4xl font-bold text-teal-600">{formatCurrency(totals.cpl)}</p>
              <p className="text-sm text-muted-foreground">Cost per Lead</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cpl"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={{ fill: '#14b8a6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Purchase */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Purchase</CardTitle>
              <div className="flex gap-4">
                <div>
                  <p className="text-2xl font-bold text-pink-600">{formatNumber(totals.purchases)}</p>
                  <p className="text-xs text-muted-foreground">Purchase</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-600">{formatNumber(totals.purchases)}</p>
                  <p className="text-xs text-muted-foreground">New Customer</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="purchases"
                    name="Purchase"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ fill: '#ec4899', r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="newCustomers"
                    name="New Customer"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={{ fill: '#14b8a6', r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="firstPayment"
                    name="First Payment"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cost Per Purchase */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Cost Per Purchase</CardTitle>
              <div className="flex gap-4">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.cpp)}</p>
                  <p className="text-xs text-muted-foreground">Cost per Purchase</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-pink-600">{formatCurrency(totals.cpp)}</p>
                  <p className="text-xs text-muted-foreground">Cost per New Customer</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cpp"
                    name="Cost per Purchase"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cpnc"
                    name="Cost per New Customer"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ fill: '#ec4899', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Funnel Performance */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">Funnel Performance</CardTitle>
              <div className="flex gap-6">
                <div>
                  <p className="text-3xl font-bold text-pink-600">{totals.leadRate.toFixed(2)}%</p>
                  <p className="text-sm text-muted-foreground">Lead Rate</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-600">{totals.salesRate.toFixed(2)}%</p>
                  <p className="text-sm text-muted-foreground">Sales Rate</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-teal-600">{totals.leadToSalesRate.toFixed(2)}%</p>
                  <p className="text-sm text-muted-foreground">Lead to Sales Rate</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(2)}%`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="leadRate"
                    name="Lead Rate"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ fill: '#ec4899', r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="salesRate"
                    name="Sales Rate"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="leadToSalesRate"
                    name="Lead to Sales Rate"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={{ fill: '#14b8a6', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
