import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function DailyAnalysis() {
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});
  
  const { data: dailyKpis, isLoading } = trpc.dashboard.dailyKpis.useQuery(dateRange);

  const formatCurrency = (value: string | number | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatNumber = (value: number | null | undefined) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  const formatPercent = (value: string | number | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return `${num.toFixed(2)}%`;
  };

  const formatROAS = (value: string | number | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return `${num.toFixed(2)}x`;
  };

  // Calculate totals
  const totals = useMemo(() => {
    if (!dailyKpis || dailyKpis.length === 0) {
      return {
        leads: 0,
        spend: 0,
        vipSales: 0,
        vipRevenue: 0,
        avgCpl: 0,
        avgCpp: 0,
        avgRoas: 0,
        avgTakeRate: 0,
      };
    }

    const totalLeads = dailyKpis.reduce((sum, kpi) => sum + (kpi.total_leads || 0), 0);
    const totalSpend = dailyKpis.reduce((sum, kpi) => sum + parseFloat(kpi.total_spend || '0'), 0);
    const totalVipSales = dailyKpis.reduce((sum, kpi) => sum + (kpi.vip_sales || 0), 0);
    const totalVipRevenue = dailyKpis.reduce((sum, kpi) => sum + parseFloat(kpi.vip_revenue || '0'), 0);

    return {
      leads: totalLeads,
      spend: totalSpend,
      vipSales: totalVipSales,
      vipRevenue: totalVipRevenue,
      avgCpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
      avgCpp: totalVipSales > 0 ? totalSpend / totalVipSales : 0,
      avgRoas: totalSpend > 0 ? totalVipRevenue / totalSpend : 0,
      avgTakeRate: totalLeads > 0 ? (totalVipSales / totalLeads) * 100 : 0,
    };
  }, [dailyKpis]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily Performance Analysis</CardTitle>
              <CardDescription>
                Detailed daily breakdown of campaign metrics
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Filter Dates
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">CPL</TableHead>
                  <TableHead className="text-right">VIP Sales</TableHead>
                  <TableHead className="text-right">VIP Revenue</TableHead>
                  <TableHead className="text-right">CPP</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">Take Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyKpis && dailyKpis.length > 0 ? (
                  <>
                    {dailyKpis.map((kpi) => (
                      <TableRow key={kpi.id}>
                        <TableCell className="font-medium">
                          {new Date(kpi.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(kpi.total_leads)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(kpi.total_spend)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(kpi.cpl)}</TableCell>
                        <TableCell className="text-right">{formatNumber(kpi.vip_sales)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(kpi.vip_revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(kpi.cpp)}</TableCell>
                        <TableCell className="text-right">{formatROAS(kpi.roas)}</TableCell>
                        <TableCell className="text-right">{formatPercent(kpi.vip_take_rate)}</TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">{formatNumber(totals.leads)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.spend)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.avgCpl)}</TableCell>
                      <TableCell className="text-right">{formatNumber(totals.vipSales)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.vipRevenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.avgCpp)}</TableCell>
                      <TableCell className="text-right">{formatROAS(totals.avgRoas)}</TableCell>
                      <TableCell className="text-right">{formatPercent(totals.avgTakeRate)}</TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
