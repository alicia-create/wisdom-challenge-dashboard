import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { DATE_RANGES, type DateRange } from "@shared/constants";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, Users, TrendingUp, DollarSign, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function EngagementSales() {
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES.LAST_30_DAYS);

  // Fetch engagement metrics
  const { data: engagementData, isLoading: engagementLoading } = trpc.engagement.metrics.useQuery({
    dateRange,
  });

  // Fetch high-ticket sales
  const { data: htSalesData, isLoading: htSalesLoading } = trpc.engagement.highTicketSales.useQuery({
    dateRange,
  });

  // Fetch full funnel metrics
  const { data: fullFunnelData, isLoading: fullFunnelLoading } = trpc.engagement.fullFunnel.useQuery({
    dateRange,
  });

  const isLoading = engagementLoading || htSalesLoading || fullFunnelLoading;

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

  // Export HT sales to CSV
  const exportHtSalesToCSV = () => {
    if (!htSalesData?.htSalesList || htSalesData.htSalesList.length === 0) {
      toast.error("No high-ticket sales data to export");
      return;
    }

    // Build CSV header
    const headers = [
      "Customer Name",
      "Customer Email",
      "Product",
      "Price",
      "Purchase Date",
      "UTM Source",
      "UTM Medium",
      "UTM Campaign",
      "UTM Term",
      "UTM Content",
      "Days from Lead to Sale"
    ];

    // Build CSV rows
    const rows = htSalesData.htSalesList.map((sale: any) => [
      sale.customer_name || "",
      sale.customer_email || "",
      sale.product_name || "",
      formatCurrency(parseFloat(sale.price || 0)),
      new Date(sale.purchase_date).toLocaleDateString('en-US'),
      sale.utm_source || "",
      sale.utm_medium || "",
      sale.utm_campaign || "",
      sale.utm_term || "",
      sale.utm_content || "",
      sale.days_from_lead_to_sale || ""
    ]);

    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => {
        const cellStr = String(cell);
        if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `31DWC-HighTicket-Sales-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV exported successfully");
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container py-6">
        {/* Date Filter */}
        <div className="flex justify-end mb-6">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Attendance */}
          <Card className="border-l-4 border-l-[#560BAD]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <Users className="h-5 w-5 text-[#560BAD]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{formatNumber(engagementData?.todayAttendance || 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Live + VIP participants
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* High-Ticket Sales (Today) */}
          <Card className="border-l-4 border-l-[#B5179E]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High-Ticket Sales (Today)</CardTitle>
              <TrendingUp className="h-5 w-5 text-[#B5179E]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{formatNumber(htSalesData?.todayHtSales || 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total HT conversions today
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cost Per Acquisition (HT) */}
          <Card className="border-l-4 border-l-[#3A0CA3]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost per Acquisition (HT)</CardTitle>
              <DollarSign className="h-5 w-5 text-[#3A0CA3]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{formatCurrency(fullFunnelData?.htCpa || 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total spend / HT sales
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* ROAS (Full Funnel) */}
          <Card className="border-l-4 border-l-[#4361EE]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROAS (Full Funnel)</CardTitle>
              <TrendingUp className="h-5 w-5 text-[#4361EE]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{(fullFunnelData?.fullFunnelRoas || 0).toFixed(2)}x</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    VIP + OTO + HT revenue
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Attendance Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#560BAD]" />
              Daily Attendance (Free vs. VIP)
            </CardTitle>
            <CardDescription>
              Participant engagement throughout the 31-day challenge
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : engagementData?.attendanceByDay && engagementData.attendanceByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={engagementData.attendanceByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    formatter={(value: number) => formatNumber(value)}
                  />
                  <Legend />
                  <Bar dataKey="freeCount" fill="#4895EF" name="Free (YouTube)" />
                  <Bar dataKey="vipCount" fill="#560BAD" name="VIP (Zoom)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance data available yet</p>
                  <p className="text-sm mt-2">Attendance tracking will begin on Day 1 of the challenge</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* High-Ticket Sales Attribution Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#B5179E]" />
                  High-Ticket Sales Attribution
                </CardTitle>
                <CardDescription>
                  Connect high-ticket sales back to original acquisition campaigns
                </CardDescription>
              </div>
              <Button
                onClick={exportHtSalesToCSV}
                disabled={isLoading || !htSalesData?.htSalesList || htSalesData.htSalesList.length === 0}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export to CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : htSalesData?.htSalesList && htSalesData.htSalesList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Customer</th>
                      <th className="text-left p-3 font-medium">Product</th>
                      <th className="text-right p-3 font-medium">Price</th>
                      <th className="text-left p-3 font-medium">Purchase Date</th>
                      <th className="text-left p-3 font-medium">Campaign</th>
                      <th className="text-left p-3 font-medium">Source</th>
                      <th className="text-right p-3 font-medium">Days to Sale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {htSalesData.htSalesList.map((sale: any, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-medium">{sale.customer_name}</div>
                          <div className="text-xs text-muted-foreground">{sale.customer_email}</div>
                        </td>
                        <td className="p-3">{sale.product_name}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(parseFloat(sale.price || 0))}</td>
                        <td className="p-3">{new Date(sale.purchase_date).toLocaleDateString('en-US')}</td>
                        <td className="p-3">
                          <div className="text-xs">
                            <div className="font-medium">{sale.utm_campaign || '-'}</div>
                            <div className="text-muted-foreground">{sale.utm_content || '-'}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-xs">
                            <div>{sale.utm_source || '-'}</div>
                            <div className="text-muted-foreground">{sale.utm_medium || '-'}</div>
                          </div>
                        </td>
                        <td className="p-3 text-right">{sale.days_from_lead_to_sale || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No high-ticket sales yet</p>
                  <p className="text-sm mt-2">High-ticket sales will appear here as they are recorded</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
