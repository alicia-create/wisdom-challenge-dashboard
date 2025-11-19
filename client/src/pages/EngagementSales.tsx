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
import { Mail, ShoppingBag, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EngagementSales() {
  const { data: emailEngagement, isLoading: emailLoading } = trpc.dashboard.emailEngagement.useQuery();
  const { data: orders, isLoading: ordersLoading } = trpc.dashboard.orders.useQuery({ limit: 50 });
  const { data: attendance, isLoading: attendanceLoading } = trpc.dashboard.attendance.useQuery();

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="space-y-6">
      {/* Email Engagement Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {emailLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatNumber(emailEngagement?.totalLeads || 0)}</div>
                <p className="text-xs text-muted-foreground">All-time lead count</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Welcome Email Clicks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {emailLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatNumber(emailEngagement?.clicked || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {emailEngagement?.clickRate.toFixed(2)}% click rate
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {emailLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {emailEngagement?.clickRate ? `${emailEngagement.clickRate.toFixed(1)}%` : '0%'}
                </div>
                <p className="text-xs text-muted-foreground">Email engagement rate</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales with Attribution */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales with UTM Attribution</CardTitle>
          <CardDescription>
            High-ticket sales traced back to original acquisition campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Medium</TableHead>
                    <TableHead>Campaign</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders && orders.length > 0 ? (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{order.email || 'N/A'}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{order.product_name || 'N/A'}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(order.order_total)}
                        </TableCell>
                        <TableCell>
                          {order.utm_source ? (
                            <Badge variant="secondary">{order.utm_source}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {order.utm_medium ? (
                            <Badge variant="outline">{order.utm_medium}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {order.utm_campaign || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No sales data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Attendance */}
      {attendance && attendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Challenge Attendance</CardTitle>
            <CardDescription>Daily participation tracking</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge>{record.attendance_type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(record.count)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
