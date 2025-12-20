import { useState, useEffect, Fragment } from "react";
import { trpc } from "@/lib/trpc";
import { DATE_RANGES, type DateRange } from "@shared/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Daily Table (Transposed) - Metrics as rows, days as columns
 * Excel-style view showing all metrics from get_daily_metrics
 */
export default function DailyTableTransposed() {
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES.TODAY);

  // Fetch daily metrics
  const { data: dailyData, isLoading } = trpc.dailyAnalysis.metrics.useQuery({
    dateRange,
  });

  // DEBUG: Show full JSON response in console
  useEffect(() => {
    if (dailyData) {
      console.log('===== FULL get_daily_metrics JSON RESPONSE =====');
      console.log(JSON.stringify(dailyData, null, 2));
      console.log('================================================');
    }
  }, [dailyData]);

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

  // Define all metrics to display
  const metrics = [
    // Leads section
    { key: 'totalLeads', label: 'Total Leads', format: formatNumber, group: 'Leads' },
    { key: 'paidLeads', label: 'Paid Leads', format: formatNumber, group: 'Leads' },
    { key: 'organicLeads', label: 'Organic Leads', format: formatNumber, group: 'Leads' },
    
    // Sales section
    { key: 'totalWisdomSales', label: 'Total Wisdom+ Sales', format: formatNumber, group: 'Sales' },
    { key: 'paidWisdomSales', label: 'Paid Wisdom+ Sales', format: formatNumber, group: 'Sales' },
    { key: 'organicWisdomSales', label: 'Organic Wisdom+ Sales', format: formatNumber, group: 'Sales' },
    
    // Kingdom Seekers
    { key: 'totalKingdomSeekers', label: 'Total Kingdom Seekers', format: formatNumber, group: 'Upsells' },
    { key: 'paidKingdomSeekers', label: 'Paid Kingdom Seekers', format: formatNumber, group: 'Upsells' },
    { key: 'organicKingdomSeekers', label: 'Organic Kingdom Seekers', format: formatNumber, group: 'Upsells' },
    
    // Extra Journals
    { key: 'totalExtraJournals', label: 'Total Extra Journals', format: formatNumber, group: 'Upsells' },
    { key: 'paidExtraJournals', label: 'Paid Extra Journals', format: formatNumber, group: 'Upsells' },
    { key: 'organicExtraJournals', label: 'Organic Extra Journals', format: formatNumber, group: 'Upsells' },
    
    // Revenue
    { key: 'totalRevenue', label: 'Total Revenue', format: formatCurrency, group: 'Revenue' },
    { key: 'paidRevenue', label: 'Paid Revenue', format: formatCurrency, group: 'Revenue' },
    { key: 'organicRevenue', label: 'Organic Revenue', format: formatCurrency, group: 'Revenue' },
    
    // Ad Spend
    { key: 'totalAdSpend', label: 'Total Ad Spend', format: formatCurrency, group: 'Ad Spend' },
    { key: 'leadsSalesSpend', label: 'Meta L+S Spend', format: formatCurrency, group: 'Ad Spend' },
    
    // Metrics
    { key: 'cpl', label: 'CPL', format: formatCurrency, group: 'Metrics' },
    { key: 'cpp', label: 'CPP', format: formatCurrency, group: 'Metrics' },
    { key: 'roas', label: 'ROAS', format: (v: number) => v.toFixed(2), group: 'Metrics' },
    { key: 'conversionRate', label: 'Conversion Rate', format: formatPercent, group: 'Metrics' },
    
    // Meta Leads Campaign
    { key: 'metaLeads.spend', label: 'Meta Leads - Spend', format: formatCurrency, group: 'Meta Leads' },
    { key: 'metaLeads.clicks', label: 'Meta Leads - Clicks', format: formatNumber, group: 'Meta Leads' },
    { key: 'metaLeads.impressions', label: 'Meta Leads - Impressions', format: formatNumber, group: 'Meta Leads' },
    { key: 'metaLeads.reportedLeads', label: 'Meta Leads - Reported Leads', format: formatNumber, group: 'Meta Leads' },
    { key: 'metaLeads.reportedPurchases', label: 'Meta Leads - Reported Purchases', format: formatNumber, group: 'Meta Leads' },
    
    // Meta Sales Campaign
    { key: 'metaSales.spend', label: 'Meta Sales - Spend', format: formatCurrency, group: 'Meta Sales' },
    { key: 'metaSales.clicks', label: 'Meta Sales - Clicks', format: formatNumber, group: 'Meta Sales' },
    { key: 'metaSales.impressions', label: 'Meta Sales - Impressions', format: formatNumber, group: 'Meta Sales' },
    { key: 'metaSales.reportedLeads', label: 'Meta Sales - Reported Leads', format: formatNumber, group: 'Meta Sales' },
    { key: 'metaSales.reportedPurchases', label: 'Meta Sales - Reported Purchases', format: formatNumber, group: 'Meta Sales' },
    
    // Google Ads
    { key: 'google.spend', label: 'Google - Spend', format: formatCurrency, group: 'Google' },
    { key: 'google.clicks', label: 'Google - Clicks', format: formatNumber, group: 'Google' },
    { key: 'google.impressions', label: 'Google - Impressions', format: formatNumber, group: 'Google' },
    { key: 'google.reportedPurchases', label: 'Google - Reported Purchases', format: formatNumber, group: 'Google' },
  ];

  // Helper to get nested value from object using dot notation
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj) ?? 0;
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!dailyData || dailyData.length === 0) {
      toast.error("No data to export");
      return;
    }

    // CSV headers: Metric, Date1, Date2, ...
    const headers = ['Metric', ...dailyData.map((d: any) => d.date)];
    
    // CSV rows: one per metric
    const rows = metrics.map(metric => {
      const values = dailyData.map((day: any) => {
        const value = getNestedValue(day, metric.key);
        return typeof value === 'number' ? value : 0;
      });
      return [metric.label, ...values];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily-metrics-transposed-${dateRange}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("CSV exported successfully");
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button onClick={exportToCSV} variant="outline" disabled={isLoading || !dailyData}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Breakdown (Transposed)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !dailyData || dailyData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No data available for selected period
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-semibold min-w-[200px]">
                        Metric
                      </th>
                      {dailyData.map((day: any, idx: number) => (
                        <th key={idx} className="px-4 py-3 text-right font-semibold min-w-[120px] whitespace-nowrap">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((metric, metricIdx) => {
                      // Add group header rows
                      const isFirstInGroup = metricIdx === 0 || metrics[metricIdx - 1].group !== metric.group;
                      
                      return (
                        <Fragment key={metric.key}>
                          {isFirstInGroup && (
                            <tr className="bg-muted/30">
                              <td colSpan={dailyData.length + 1} className="px-4 py-2 font-semibold text-xs uppercase tracking-wide">
                                {metric.group}
                              </td>
                            </tr>
                          )}
                          <tr className="border-b hover:bg-muted/20">
                            <td className="sticky left-0 z-10 bg-background px-4 py-3 font-medium">
                              {metric.label}
                            </td>
                            {dailyData.map((day: any, dayIdx: number) => {
                              const value = getNestedValue(day, metric.key);
                              return (
                                <td key={dayIdx} className="px-4 py-3 text-right tabular-nums">
                                  {metric.format(value)}
                                </td>
                              );
                            })}
                          </tr>
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground text-center">
          💡 This table uses get_daily_metrics API for comprehensive daily breakdown
        </p>
      </div>
    </div>
  );
}
