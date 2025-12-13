import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TableSkeleton } from "@/components/TableSkeleton";

export default function DebugMetaCampaigns() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading } = trpc.debug.metaCampaigns.useQuery({
    page,
    pageSize: 50,
    search: search || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Meta Campaigns Debug</CardTitle>
            <CardDescription>
              View and search all Meta Ads campaigns in the database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Campaign, ad set, ad name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1); // Reset to first page on search
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Results count and Export */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {data ? ((page - 1) * 50 + 1) : 0} - {data ? Math.min(page * 50, data.total) : 0} of {data?.total || 0} records
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!data?.data || data.data.length === 0) {
                    toast.error("No data to export");
                    return;
                  }
                  
                  // Generate CSV
                  const headers = ['Date', 'Campaign', 'Ad Set', 'Ad', 'Spend', 'Impressions', 'Link Clicks', 'Leads', 'Purchases'];
                  const rows = data.data.map((campaign: any) => [
                    new Date(campaign.date).toLocaleDateString(),
                    campaign.campaign_name || '',
                    campaign.adset_name || '',
                    campaign.ad_name || '',
                    campaign.spend || '0',
                    campaign.impressions || '0',
                    campaign.inline_link_clicks || '0',
                    campaign.reported_leads || '0',
                    campaign.reported_purchases || '0',
                  ]);
                  
                  const csvContent = [
                    headers.join(','),
                    ...rows.map(row => row.map(cell => `\"${cell}\"`).join(','))
                  ].join('\\n');
                  
                  // Download
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `meta-campaigns-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  
                  toast.success("CSV exported successfully");
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
              <div className="overflow-x-auto">
                {isLoading ? (
                  <TableSkeleton rows={10} columns={9} />
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Ad Set</TableHead>
                      <TableHead>Ad</TableHead>
                      <TableHead className="text-right">Spend</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">Link Clicks</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Purchases</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No Meta campaigns found
                        </TableCell>
                      </TableRow>
                    ) : (
                      data?.data.map((campaign: any, index: number) => (
                        <TableRow key={`${campaign.id}-${index}`}>
                          <TableCell className="text-sm">
                            {new Date(campaign.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={campaign.campaign_name}>
                            {campaign.campaign_name || '-'}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate" title={campaign.adset_name}>
                            {campaign.adset_name || '-'}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate" title={campaign.ad_name}>
                            {campaign.ad_name || '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(parseFloat(campaign.spend || '0'))}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(parseInt(campaign.impressions || '0', 10))}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(parseInt(campaign.inline_link_clicks || '0', 10))}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(parseInt(campaign.reported_leads || '0', 10))}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(parseInt(campaign.reported_purchases || '0', 10))}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                )}
              </div>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {data.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
