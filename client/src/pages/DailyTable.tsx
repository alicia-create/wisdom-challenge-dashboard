import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DATE_RANGES, type DateRange } from "@shared/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Daily Table - Excel-style view of all metrics
 * Uses SAME data source as Overview (get_dashboard_metrics) for 100% consistency
 */
export default function DailyTable() {
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES.LAST_30_DAYS);

  // Fetch daily metrics using same source as Overview
  const { data: dailyData, isLoading } = trpc.dailyAnalysis.metrics.useQuery({
    dateRange,
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Format number
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!dailyData || dailyData.length === 0) {
      toast.error("No data to export");
      return;
    }

    // CSV headers
    const headers = [
      "Date",
      "Total Leads",
      "Wisdom+ Sales",
      "Kingdom Seekers",
      "Total Revenue",
      "Total Ad Spend",
      "Leads+Sales Spend",
      "CPL",
      "CPP",
      "AOV",
      "ROAS",
      "Conversion %",
      "Journals",
      "Paid Leads",
      "Paid Sales",
      "Paid Revenue",
      "Organic Leads",
      "Organic Sales",
      "Organic Revenue",
      "Meta Spend",
      "Meta Leads",
      "Meta Sales",
      "Google Spend",
      "Google Sales",
    ];

    // CSV rows
    const rows = dailyData.map((day: any) => [
      day.date,
      day.kpis?.totalLeads || 0,
      day.kpis?.wisdomSales || 0,
      day.kpis?.kingdomSeekerTrials || 0,
      day.kpis?.totalRevenue || 0,
      day.kpis?.totalSpend || 0,
      day.kpis?.leadsSalesSpend || 0,
      day.kpis?.cpl || 0,
      day.kpis?.cpp || 0,
      day.kpis?.aov || 0,
      day.kpis?.roas || 0,
      day.kpis?.wisdomConversion || 0,
      day.kpis?.totalJournals || 0,
      day.paidAdsFunnel?.leads || 0,
      day.paidAdsFunnel?.wisdomSales || 0,
      day.paidAdsFunnel?.revenue || 0,
      day.organicFunnel?.leads || 0,
      day.organicFunnel?.wisdomSales || 0,
      day.organicFunnel?.revenue || 0,
      day.metaPerformance?.spend || 0,
      day.metaPerformance?.leads || 0,
      day.metaPerformance?.purchases || 0,
      day.googlePerformance?.spend || 0,
      day.googlePerformance?.purchases || 0,
    ]);

    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `31DWC-Daily-Metrics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV exported successfully");
  };

  // Calculate totals - using v2.0 API structure (fields directly on day object)
  const totals = dailyData?.reduce((acc: any, day: any) => ({
    totalLeads: (acc.totalLeads || 0) + (day.totalLeads || 0),
    wisdomSales: (acc.wisdomSales || 0) + (day.totalWisdomSales || 0),
    kingdomSeekers: (acc.kingdomSeekers || 0) + (day.totalKingdomSeekers || 0),
    totalRevenue: (acc.totalRevenue || 0) + (day.totalRevenue || 0),
    totalSpend: (acc.totalSpend || 0) + (day.totalAdSpend || 0),
    leadsSalesSpend: (acc.leadsSalesSpend || 0) + (day.leadsSalesSpend || 0),
    journals: (acc.journals || 0) + (day.totalExtraJournals || 0),
    paidLeads: (acc.paidLeads || 0) + (day.paidLeads || 0),
    paidSales: (acc.paidSales || 0) + (day.paidWisdomSales || 0),
    paidRevenue: (acc.paidRevenue || 0) + (day.paidRevenue || 0),
    organicLeads: (acc.organicLeads || 0) + (day.organicLeads || 0),
    organicSales: (acc.organicSales || 0) + (day.organicWisdomSales || 0),
    organicRevenue: (acc.organicRevenue || 0) + (day.organicRevenue || 0),
    metaSpend: (acc.metaSpend || 0) + ((day.metaLeads?.spend || 0) + (day.metaSales?.spend || 0)),
    metaLeads: (acc.metaLeads || 0) + (day.metaLeads?.reportedLeads || 0),
    metaSales: (acc.metaSales || 0) + ((day.metaLeads?.reportedPurchases || 0) + (day.metaSales?.reportedPurchases || 0)),
    googleSpend: (acc.googleSpend || 0) + (day.google?.spend || 0),
    googleSales: (acc.googleSales || 0) + (day.google?.reportedPurchases || 0),
  }), {
    totalLeads: 0,
    wisdomSales: 0,
    kingdomSeekers: 0,
    totalRevenue: 0,
    totalSpend: 0,
    leadsSalesSpend: 0,
    journals: 0,
    paidLeads: 0,
    paidSales: 0,
    paidRevenue: 0,
    organicLeads: 0,
    organicSales: 0,
    organicRevenue: 0,
    metaSpend: 0,
    metaLeads: 0,
    metaSales: 0,
    googleSpend: 0,
    googleSales: 0,
  });

  // Calculate averages for CPL, CPP, AOV, ROAS
  const avgCPL = totals?.leadsSalesSpend && totals?.paidLeads 
    ? totals.leadsSalesSpend / totals.paidLeads 
    : 0;
  const avgCPP = totals?.leadsSalesSpend && totals?.paidSales 
    ? totals.leadsSalesSpend / totals.paidSales 
    : 0;
  const avgAOV = totals?.totalRevenue && totals?.wisdomSales 
    ? totals.totalRevenue / totals.wisdomSales 
    : 0;
  const avgROAS = totals?.leadsSalesSpend && totals?.paidRevenue 
    ? totals.paidRevenue / totals.leadsSalesSpend 
    : 0;
  const avgConversion = totals?.paidLeads && totals?.paidSales 
    ? (totals.paidSales / totals.paidLeads) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container py-6 space-y-6">
        {/* Page Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Daily Metrics Table</h1>
          <p className="text-muted-foreground">
            Excel-style view of all metrics • Same data source as Overview for 100% consistency
          </p>
        </div>
        {/* Filters */}
        <div className="flex items-center justify-between">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button
            onClick={exportToCSV}
            disabled={isLoading || !dailyData || dailyData.length === 0}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Table Card */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !dailyData || dailyData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No data available for selected date range
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold border-r">Date</th>
                      <th className="px-4 py-3 text-right font-semibold border-r">Leads</th>
                      <th className="px-4 py-3 text-right font-semibold border-r">Sales</th>
                      <th className="px-4 py-3 text-right font-semibold border-r">KS</th>
                      <th className="px-4 py-3 text-right font-semibold border-r">Revenue</th>
                      <th className="px-4 py-3 text-right font-semibold border-r">Total Spend</th>
                      <th className="px-4 py-3 text-right font-semibold border-r">L+S Spend</th>
                      <th className="px-4 py-3 text-right font-semibold border-r">CPL</th>
                      <th className="px-4 py-3 text-right font-semibold border-r">CPP</th>
                      <th className="px-4 py-3 text-right font-semibold border-r">AOV</th>
                      <th className="px-4 py-3 text-right font-semibold border-r">ROAS</th>
                      <th className="px-4 py-3 text-right font-semibold border-r">Conv%</th>
                      <th className="px-4 py-3 text-right font-semibold border-r">Journals</th>
                      <th className="px-4 py-3 text-right font-semibold border-r" colSpan={3}>Paid Funnel</th>
                      <th className="px-4 py-3 text-right font-semibold border-r" colSpan={3}>Organic Funnel</th>
                      <th className="px-4 py-3 text-right font-semibold border-r" colSpan={3}>Meta Ads</th>
                      <th className="px-4 py-3 text-right font-semibold" colSpan={2}>Google Ads</th>
                    </tr>
                    <tr className="text-xs text-muted-foreground">
                      <th className="px-4 py-2 border-r"></th>
                      <th className="px-4 py-2 border-r"></th>
                      <th className="px-4 py-2 border-r"></th>
                      <th className="px-4 py-2 border-r"></th>
                      <th className="px-4 py-2 border-r"></th>
                      <th className="px-4 py-2 border-r"></th>
                      <th className="px-4 py-2 border-r"></th>
                      <th className="px-4 py-2 border-r"></th>
                      <th className="px-4 py-2 border-r"></th>
                      <th className="px-4 py-2 border-r"></th>
                      <th className="px-4 py-2 border-r"></th>
                      <th className="px-4 py-2 border-r"></th>
                      <th className="px-4 py-2 border-r"></th>
                      <th className="px-2 py-2 text-right">Leads</th>
                      <th className="px-2 py-2 text-right">Sales</th>
                      <th className="px-2 py-2 text-right border-r">Rev</th>
                      <th className="px-2 py-2 text-right">Leads</th>
                      <th className="px-2 py-2 text-right">Sales</th>
                      <th className="px-2 py-2 text-right border-r">Rev</th>
                      <th className="px-2 py-2 text-right">Spend</th>
                      <th className="px-2 py-2 text-right">Leads</th>
                      <th className="px-2 py-2 text-right border-r">Sales</th>
                      <th className="px-2 py-2 text-right">Spend</th>
                      <th className="px-2 py-2 text-right">Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.map((day: any, idx: number) => (
                      <tr key={day.date} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="px-4 py-3 font-medium border-r">{day.date}</td>
                        <td className="px-4 py-3 text-right border-r">{formatNumber(day.totalLeads || 0)}</td>
                        <td className="px-4 py-3 text-right border-r">{formatNumber(day.totalWisdomSales || 0)}</td>
                        <td className="px-4 py-3 text-right border-r">{formatNumber(day.totalKingdomSeekers || 0)}</td>
                        <td className="px-4 py-3 text-right border-r">{formatCurrency(day.totalRevenue || 0)}</td>
                        <td className="px-4 py-3 text-right border-r">{formatCurrency(day.totalAdSpend || 0)}</td>
                        <td className="px-4 py-3 text-right border-r">{formatCurrency(day.leadsSalesSpend || 0)}</td>
                        <td className="px-4 py-3 text-right border-r">{formatCurrency(day.cpl || 0)}</td>
                        <td className="px-4 py-3 text-right border-r">{formatCurrency(day.cpp || 0)}</td>
                        <td className="px-4 py-3 text-right border-r">{formatCurrency(day.aov || 0)}</td>
                        <td className="px-4 py-3 text-right border-r">{(day.roas || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right border-r">{formatPercent(day.conversionRate || 0)}</td>
                        <td className="px-4 py-3 text-right border-r">{formatNumber(day.totalExtraJournals || 0)}</td>
                        <td className="px-2 py-3 text-right">{formatNumber(day.paidLeads || 0)}</td>
                        <td className="px-2 py-3 text-right">{formatNumber(day.paidWisdomSales || 0)}</td>
                        <td className="px-2 py-3 text-right border-r">{formatCurrency(day.paidRevenue || 0)}</td>
                        <td className="px-2 py-3 text-right">{formatNumber(day.organicLeads || 0)}</td>
                        <td className="px-2 py-3 text-right">{formatNumber(day.organicWisdomSales || 0)}</td>
                        <td className="px-2 py-3 text-right border-r">{formatCurrency(day.organicRevenue || 0)}</td>
                        <td className="px-2 py-3 text-right">{formatCurrency((day.metaLeads?.spend || 0) + (day.metaSales?.spend || 0))}</td>
                        <td className="px-2 py-3 text-right">{formatNumber(day.metaLeads?.reportedLeads || 0)}</td>
                        <td className="px-2 py-3 text-right border-r">{formatNumber((day.metaLeads?.reportedPurchases || 0) + (day.metaSales?.reportedPurchases || 0))}</td>
                        <td className="px-2 py-3 text-right">{formatCurrency(day.google?.spend || 0)}</td>
                        <td className="px-2 py-3 text-right">{formatNumber(day.google?.reportedPurchases || 0)}</td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-primary/10 font-semibold border-t-2 border-primary">
                      <td className="px-4 py-3 border-r">TOTAL</td>
                      <td className="px-4 py-3 text-right border-r">{formatNumber(totals?.totalLeads || 0)}</td>
                      <td className="px-4 py-3 text-right border-r">{formatNumber(totals?.wisdomSales || 0)}</td>
                      <td className="px-4 py-3 text-right border-r">{formatNumber(totals?.kingdomSeekers || 0)}</td>
                      <td className="px-4 py-3 text-right border-r">{formatCurrency(totals?.totalRevenue || 0)}</td>
                      <td className="px-4 py-3 text-right border-r">{formatCurrency(totals?.totalSpend || 0)}</td>
                      <td className="px-4 py-3 text-right border-r">{formatCurrency(totals?.leadsSalesSpend || 0)}</td>
                      <td className="px-4 py-3 text-right border-r">{formatCurrency(avgCPL)}</td>
                      <td className="px-4 py-3 text-right border-r">{formatCurrency(avgCPP)}</td>
                      <td className="px-4 py-3 text-right border-r">{formatCurrency(avgAOV)}</td>
                      <td className="px-4 py-3 text-right border-r">{avgROAS.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right border-r">{formatPercent(avgConversion)}</td>
                      <td className="px-4 py-3 text-right border-r">{formatNumber(totals?.journals || 0)}</td>
                      <td className="px-2 py-3 text-right">{formatNumber(totals?.paidLeads || 0)}</td>
                      <td className="px-2 py-3 text-right">{formatNumber(totals?.paidSales || 0)}</td>
                      <td className="px-2 py-3 text-right border-r">{formatCurrency(totals?.paidRevenue || 0)}</td>
                      <td className="px-2 py-3 text-right">{formatNumber(totals?.organicLeads || 0)}</td>
                      <td className="px-2 py-3 text-right">{formatNumber(totals?.organicSales || 0)}</td>
                      <td className="px-2 py-3 text-right border-r">{formatCurrency(totals?.organicRevenue || 0)}</td>
                      <td className="px-2 py-3 text-right">{formatCurrency(totals?.metaSpend || 0)}</td>
                      <td className="px-2 py-3 text-right">{formatNumber(totals?.metaLeads || 0)}</td>
                      <td className="px-2 py-3 text-right border-r">{formatNumber(totals?.metaSales || 0)}</td>
                      <td className="px-2 py-3 text-right">{formatCurrency(totals?.googleSpend || 0)}</td>
                      <td className="px-2 py-3 text-right">{formatNumber(totals?.googleSales || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Note */}
        <div className="text-sm text-muted-foreground text-center">
          💡 This table uses the same data source as Overview page for 100% consistency
        </div>
      </div>
    </div>
  );
}
