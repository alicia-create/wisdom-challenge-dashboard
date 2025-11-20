import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DATE_RANGES, type DateRange } from "@shared/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function DailyAnalysis() {
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES.LAST_30_DAYS);

  // Fetch daily analysis metrics
  const { data: dailyData, isLoading } = trpc.dailyAnalysis.metrics.useQuery({
    dateRange,
  });

  // Format currency
  const formatCurrency = (value: number) => {
    if (value === 0) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    if (value === 0) return "0.00%";
    return `${value.toFixed(2)}%`;
  };

  // Format number
  const formatNumber = (value: number) => {
    if (value === 0) return "0";
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Calculate totals across all days
  const totals = dailyData?.reduce((acc, day) => {
    return {
      totalOptins: acc.totalOptins + day.totalOptins,
      totalVipSales: acc.totalVipSales + day.totalVipSales,
      totalVipRevenue: acc.totalVipRevenue + day.totalVipRevenue,
      totalSpend: acc.totalSpend + day.totalSpend,
      profitLoss: acc.profitLoss + day.profitLoss,
      metaSpend: acc.metaSpend + day.metaSpend,
      metaOptins: acc.metaOptins + day.metaOptins,
      metaVipSales: acc.metaVipSales + day.metaVipSales,
      metaClicks: acc.metaClicks + day.metaClicks,
      metaImpressions: acc.metaImpressions + day.metaImpressions,
      metaLandingPageViews: acc.metaLandingPageViews + day.metaLandingPageViews,
      googleSpend: acc.googleSpend + day.googleSpend,
      googleOptins: acc.googleOptins + day.googleOptins,
      googleVipSales: acc.googleVipSales + day.googleVipSales,
      googleClicks: acc.googleClicks + day.googleClicks,
      googleImpressions: acc.googleImpressions + day.googleImpressions,
    };
  }, {
    totalOptins: 0,
    totalVipSales: 0,
    totalVipRevenue: 0,
    totalSpend: 0,
    profitLoss: 0,
    metaSpend: 0,
    metaOptins: 0,
    metaVipSales: 0,
    metaClicks: 0,
    metaImpressions: 0,
    metaLandingPageViews: 0,
    googleSpend: 0,
    googleOptins: 0,
    googleVipSales: 0,
    googleClicks: 0,
    googleImpressions: 0,
  });

  // Calculate total derived metrics
  const totalVipTakeRate = totals && totals.totalOptins > 0 ? (totals.totalVipSales / totals.totalOptins) * 100 : 0;
  const totalTrueCPL = totals && totals.totalOptins > 0 ? totals.totalSpend / totals.totalOptins : 0;
  const totalTrueCPP = totals && totals.totalVipSales > 0 ? totals.totalSpend / totals.totalVipSales : 0;
  const totalROAS = totals && totals.totalSpend > 0 ? totals.totalVipRevenue / totals.totalSpend : 0;
  const totalMetaCPL = totals && totals.metaOptins > 0 ? totals.metaSpend / totals.metaOptins : 0;
  const totalMetaCPP = totals && totals.metaVipSales > 0 ? totals.metaSpend / totals.metaVipSales : 0;
  const totalMetaConnectRate = totals && totals.metaClicks > 0 ? (totals.metaLandingPageViews / totals.metaClicks) * 100 : 0;
  const totalMetaClickToLeadRate = totals && totals.metaClicks > 0 ? (totals.metaOptins / totals.metaClicks) * 100 : 0;
  const totalMetaClickToPurchaseRate = totals && totals.metaClicks > 0 ? (totals.metaVipSales / totals.metaClicks) * 100 : 0;
  const totalGoogleCPL = totals && totals.googleOptins > 0 ? totals.googleSpend / totals.googleOptins : 0;
  const totalGoogleCPP = totals && totals.googleVipSales > 0 ? totals.googleSpend / totals.googleVipSales : 0;
  const totalGoogleClickToLeadRate = totals && totals.googleClicks > 0 ? (totals.googleOptins / totals.googleClicks) * 100 : 0;
  const totalGoogleClickToPurchaseRate = totals && totals.googleClicks > 0 ? (totals.googleVipSales / totals.googleClicks) * 100 : 0;

  // Define metrics structure
  const metrics = [
    // Summary Data
    { category: "🔑 Summary Data", label: "Total Optins", key: "totalOptins", format: "number", totalValue: totals?.totalOptins },
    { category: "🔑 Summary Data", label: "Total VIP Sales", key: "totalVipSales", format: "number", totalValue: totals?.totalVipSales },
    { category: "🔑 Summary Data", label: "% VIP Take Rate", key: "vipTakeRate", format: "percent", totalValue: totalVipTakeRate },
    { category: "🔑 Summary Data", label: "Total VIP Revenue", key: "totalVipRevenue", format: "currency", totalValue: totals?.totalVipRevenue },
    
    // Costs & ROAS
    { category: "💰 Costs & ROAS", label: "Total Ad Spend", key: "totalSpend", format: "currency", totalValue: totals?.totalSpend },
    { category: "💰 Costs & ROAS", label: "True Cost Per Lead", key: "trueCPL", format: "currency", totalValue: totalTrueCPL },
    { category: "💰 Costs & ROAS", label: "True Cost Per Purchase", key: "trueCPP", format: "currency", totalValue: totalTrueCPP },
    { category: "💰 Costs & ROAS", label: "ROAS (Front-end)", key: "roas", format: "decimal", totalValue: totalROAS },
    { category: "💰 Costs & ROAS", label: "Front End Profit / Loss", key: "profitLoss", format: "currency", totalValue: totals?.profitLoss },
    
    // Meta Ads
    { category: "📢 Meta Ads", label: "Meta Ad Spend", key: "metaSpend", format: "currency", totalValue: totals?.metaSpend },
    { category: "📢 Meta Ads", label: "Meta Reported CPL", key: "metaCPL", format: "currency", totalValue: totalMetaCPL },
    { category: "📢 Meta Ads", label: "Meta Reported CPP", key: "metaCPP", format: "currency", totalValue: totalMetaCPP },
    { category: "📢 Meta Ads", label: "Meta Ad Optins", key: "metaOptins", format: "number", totalValue: totals?.metaOptins },
    { category: "📢 Meta Ads", label: "Meta Ad VIP Sales", key: "metaVipSales", format: "number", totalValue: totals?.metaVipSales },
    { category: "📢 Meta Ads", label: "Meta Clicks", key: "metaClicks", format: "number", totalValue: totals?.metaClicks },
    { category: "📢 Meta Ads", label: "Meta Impressions", key: "metaImpressions", format: "number", totalValue: totals?.metaImpressions },
    { category: "📢 Meta Ads", label: "Meta Page Views", key: "metaLandingPageViews", format: "number", totalValue: totals?.metaLandingPageViews },
    { category: "📢 Meta Ads", label: "Meta Connect Rate", key: "metaConnectRate", format: "percent", totalValue: totalMetaConnectRate },
    { category: "📢 Meta Ads", label: "Meta Click to Lead Rate", key: "metaClickToLeadRate", format: "percent", totalValue: totalMetaClickToLeadRate },
    { category: "📢 Meta Ads", label: "Meta Click to Purchase Rate", key: "metaClickToPurchaseRate", format: "percent", totalValue: totalMetaClickToPurchaseRate },
    
    // Google Ads
    { category: "📢 Google Ads", label: "Google Ad Spend", key: "googleSpend", format: "currency", totalValue: totals?.googleSpend },
    { category: "📢 Google Ads", label: "Google Reported CPL", key: "googleCPL", format: "currency", totalValue: totalGoogleCPL },
    { category: "📢 Google Ads", label: "Google Reported CPP", key: "googleCPP", format: "currency", totalValue: totalGoogleCPP },
    { category: "📢 Google Ads", label: "Google Ad Optins", key: "googleOptins", format: "number", totalValue: totals?.googleOptins },
    { category: "📢 Google Ads", label: "Google Ad VIP Sales", key: "googleVipSales", format: "number", totalValue: totals?.googleVipSales },
    { category: "📢 Google Ads", label: "Google Clicks", key: "googleClicks", format: "number", totalValue: totals?.googleClicks },
    { category: "📢 Google Ads", label: "Google Impressions", key: "googleImpressions", format: "number", totalValue: totals?.googleImpressions },
    { category: "📢 Google Ads", label: "Google Click to Lead Rate", key: "googleClickToLeadRate", format: "percent", totalValue: totalGoogleClickToLeadRate },
    { category: "📢 Google Ads", label: "Google Click to Purchase Rate", key: "googleClickToPurchaseRate", format: "percent", totalValue: totalGoogleClickToPurchaseRate },
  ];

  // Format value based on type
  const formatValue = (value: any, format: string) => {
    if (value === undefined || value === null) return "-";
    
    switch (format) {
      case "currency":
        return formatCurrency(value);
      case "percent":
        return formatPercent(value);
      case "number":
        return formatNumber(value);
      case "decimal":
        return `${value.toFixed(2)}x`;
      default:
        return value.toString();
    }
  };

  // Group metrics by category
  const groupedMetrics: Record<string, typeof metrics> = {};
  metrics.forEach(metric => {
    if (!groupedMetrics[metric.category]) {
      groupedMetrics[metric.category] = [];
    }
    groupedMetrics[metric.category].push(metric);
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container max-w-full py-6">
        {/* Date Filter */}
        <div className="flex justify-end mb-6">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        {/* Spreadsheet Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[600px] w-full" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="sticky left-0 z-10 bg-background text-left p-3 font-semibold min-w-[250px]">
                        Metric
                      </th>
                      <th className="text-right p-3 font-semibold min-w-[120px] bg-muted">
                        Total
                      </th>
                      {dailyData?.map((day) => (
                        <th key={day.date} className="text-right p-3 font-semibold min-w-[120px]">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedMetrics).map(([category, categoryMetrics]) => (
                      <>
                        {/* Category Header */}
                        <tr key={category} className="bg-muted/50">
                          <td colSpan={2 + (dailyData?.length || 0)} className="p-3 font-bold text-[#560BAD]">
                            {category}
                          </td>
                        </tr>
                        {/* Metrics in Category */}
                        {categoryMetrics.map((metric, idx) => (
                          <tr key={metric.key} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                            <td className="sticky left-0 z-10 bg-inherit text-left p-3 border-r border-border">
                              {metric.label}
                            </td>
                            <td className="text-right p-3 font-semibold bg-muted/50">
                              {formatValue(metric.totalValue, metric.format)}
                            </td>
                            {dailyData?.map((day) => (
                              <td key={`${day.date}-${metric.key}`} className="text-right p-3">
                                {formatValue((day as any)[metric.key], metric.format)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </>
                    ))}
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
