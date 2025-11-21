import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Download, X, Search } from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function DebugLeads() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading } = trpc.debug.leads.useQuery({
    page,
    pageSize: 50,
    search: search || undefined,
    utmSource: utmSource || undefined,
    utmCampaign: utmCampaign || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const clearFilters = () => {
    setSearch("");
    setUtmSource("");
    setUtmCampaign("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasFilters = search || utmSource || utmCampaign || startDate || endDate;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Leads Debug</CardTitle>
                <CardDescription>
                  View and search all leads in the database
                </CardDescription>
              </div>
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Email, name..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">UTM Source</label>
                <Input
                  placeholder="facebook, google..."
                  value={utmSource}
                  onChange={(e) => {
                    setUtmSource(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">UTM Campaign</label>
                <Input
                  placeholder="31DWC2026..."
                  value={utmCampaign}
                  onChange={(e) => {
                    setUtmCampaign(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Results Summary and Export */}
            {data && (
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((data.page - 1) * data.pageSize) + 1} - {Math.min(data.page * data.pageSize, data.total)} of {data.total} leads
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
                    const headers = ['ID', 'Email', 'Name', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Email Clicked', 'Created At'];
                    const rows = data.data.map((lead: any) => [
                      lead.id,
                      lead.email || '',
                      lead.name || '',
                      lead.utm_source || '',
                      lead.utm_medium || '',
                      lead.utm_campaign || '',
                      lead.welcome_email_clicked ? 'Yes' : 'No',
                      new Date(lead.created_at).toLocaleString(),
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
                    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                    
                    toast.success("CSV exported successfully");
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
              </div>
            )}

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>UTM Source</TableHead>
                      <TableHead>UTM Medium</TableHead>
                      <TableHead>UTM Campaign</TableHead>
                      <TableHead>Email Clicked</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : data?.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No leads found
                        </TableCell>
                      </TableRow>
                    ) : (
                      data?.data.map((lead: any) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-mono text-xs">{lead.id}</TableCell>
                          <TableCell>{lead.email || '-'}</TableCell>
                          <TableCell>{lead.name || '-'}</TableCell>
                          <TableCell>{lead.utm_source || '-'}</TableCell>
                          <TableCell>{lead.utm_medium || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={lead.utm_campaign}>
                            {lead.utm_campaign || '-'}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              lead.welcome_email_clicked 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                            }`}>
                              {lead.welcome_email_clicked ? 'Yes' : 'No'}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(lead.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Page {data.page} of {data.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={data.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={data.page === data.totalPages}
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
