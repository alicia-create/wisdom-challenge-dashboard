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
import { ChevronLeft, ChevronRight, Search, X, Download, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
// ContactActivityModal removed - now using ContactDetails page

export default function DebugPurchases() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  // Removed modal state - now using Link to ContactDetails page

  const { data, isLoading } = trpc.debug.purchases.useQuery({
    page,
    pageSize: 50,
    search: search || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    minAmount: minAmount ? parseFloat(minAmount) : undefined,
    maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
  });

  const clearFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
    setPage(1);
  };

  const hasFilters = search || startDate || endDate || minAmount || maxAmount;

  // Keyboard shortcuts removed - no modal to close

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      <Link href="/overview">
        <Button variant="ghost" size="sm" className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
      
      <div className="container py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Purchases Debug</CardTitle>
                <CardDescription>
                  View and search all purchases/orders in the database
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
                    placeholder="Email, name, order ID..."
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

              <div>
                <label className="text-sm font-medium mb-2 block">Min Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={minAmount}
                  onChange={(e) => {
                    setMinAmount(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Max Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="1000.00"
                  value={maxAmount}
                  onChange={(e) => {
                    setMaxAmount(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Results Summary and Export */}
            {data && (
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((data.page - 1) * data.pageSize) + 1} - {Math.min(data.page * data.pageSize, data.total)} of {data.total} purchases
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
                    const headers = ['Order ID', 'Name', 'Email', 'Amount', 'Order Number', 'Created At'];
                    const rows = data.data.map((purchase: any) => [
                      purchase.id,
                      purchase.full_name || '',
                      purchase.email || '',
                      purchase.amount || '0',
                      purchase.order_number || '',
                      new Date(purchase.created_at).toLocaleString(),
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
                    a.download = `purchases-${new Date().toISOString().split('T')[0]}.csv`;
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
                      <TableHead>Order ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : data?.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No purchases found
                        </TableCell>
                      </TableRow>
                    ) : (
                      data?.data.map((purchase: any) => (
                        <TableRow key={purchase.id}>
                          <TableCell className="font-mono text-xs">
                            {purchase.id}
                          </TableCell>
                          <TableCell>
                            {purchase.contact_id ? (
                              <Link href={`/contact/${purchase.contact_id}`}>
                                <a className="text-blue-600 hover:underline font-medium">
                                  {purchase.contacts?.full_name || '-'}
                                </a>
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">{purchase.contacts?.full_name || '-'}</span>
                            )}
                          </TableCell>
                          <TableCell>{purchase.contacts?.email || '-'}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(purchase.order_total || 0)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={purchase.clickfunnels_order_number}>
                            {purchase.clickfunnels_order_number || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(purchase.created_at).toLocaleString('en-US', {
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

    {/* Contact Activity Modal removed - now using ContactDetails page */}
    </>
  );
}
