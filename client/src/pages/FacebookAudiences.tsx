import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function FacebookAudiences() {
  const [search, setSearch] = useState("");

  const { data: audiences, isLoading, refetch } = trpc.facebook.audiences.useQuery();
  const syncMutation = trpc.facebook.sync.useMutation({
    onSuccess: (data) => {
      toast.success(`Synced ${data.count} audiences from Facebook`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to sync: ${error.message}`);
    },
  });

  const filteredAudiences = audiences?.filter(audience => 
    audience.name.toLowerCase().includes(search.toLowerCase()) ||
    audience.audienceId.includes(search) ||
    audience.adAccountId.includes(search)
  ) || [];

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "N/A";
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <DashboardHeader />
      <div className="container py-6 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/overview">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/raw-data">Raw Data</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Facebook Audiences</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Facebook Audiences</h1>
            <p className="text-muted-foreground">
              Custom audiences, lookalike audiences, and saved audiences from Facebook Marketing API
            </p>
          </div>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync from Facebook
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Audiences ({formatNumber(filteredAudiences.length)})</CardTitle>
            <CardDescription>
              {audiences && `Last synced: ${formatDate(audiences[0]?.syncedAt)}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, audience ID, or ad account..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading audiences...</div>
            ) : filteredAudiences.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {audiences?.length === 0 
                  ? "No audiences found. Click 'Sync from Facebook' to fetch audiences."
                  : "No audiences match your search."}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Audience ID</TableHead>
                      <TableHead>Ad Account</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Size (Lower)</TableHead>
                      <TableHead className="text-right">Size (Upper)</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAudiences.map((audience) => (
                      <TableRow key={audience.id}>
                        <TableCell className="font-medium">{audience.name}</TableCell>
                        <TableCell className="font-mono text-sm">{audience.audienceId}</TableCell>
                        <TableCell className="font-mono text-sm">{audience.adAccountId}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {audience.subtype || 'CUSTOM'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(audience.sizeLowerBound)}</TableCell>
                        <TableCell className="text-right">{formatNumber(audience.sizeUpperBound)}</TableCell>
                        <TableCell>{formatDate(audience.timeCreated)}</TableCell>
                        <TableCell>{formatDate(audience.timeUpdated)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
