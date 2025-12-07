import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Search, RefreshCw, TrendingUp, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
// Removed Select import to avoid empty value issue

export default function ErrorLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');

  const { data: logs, isLoading, refetch } = trpc.logs.list.useQuery({
    page,
    pageSize: 50,
    search: search || undefined,
    workflowName: workflowFilter && workflowFilter !== 'all' ? workflowFilter : undefined,
  });

  const { data: stats } = trpc.logs.stats.useQuery();

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSearchInput('');
    setWorkflowFilter('all');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="container mx-auto space-y-6">
        {/* Navigation */}
        <Link href="/overview">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              Workflow Error Logs
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitor and debug n8n workflow errors
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalErrors.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.last24Hours.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Error Source</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium truncate">
                  {stats.topWorkflows[0]?.workflow_name || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.topWorkflows[0]?.error_count || 0} errors
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search and filter workflow errors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search errors..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
              <div className="w-full md:w-64">
                <select
                  value={workflowFilter}
                  onChange={(e) => setWorkflowFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Workflows</option>
                  {stats?.topWorkflows.map((wf) => (
                    <option key={wf.workflow_name} value={wf.workflow_name}>
                      {wf.workflow_name}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleClearFilters} variant="outline">
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Error Logs</CardTitle>
            <CardDescription>
              {logs?.total || 0} errors found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead>Workflow</TableHead>
                      <TableHead>Error Node</TableHead>
                      <TableHead>Error Message</TableHead>
                      <TableHead className="w-[100px]">Execution ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : logs?.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No errors found
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs?.data.map((error: any) => (
                        <TableRow key={error.id}>
                          <TableCell className="text-sm">
                            {new Date(error.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {error.workflow_name}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{error.error_node}</TableCell>
                          <TableCell className="max-w-md">
                            <div className="text-sm text-red-600 dark:text-red-400 line-clamp-2" title={error.error_message}>
                              {error.error_message}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-muted-foreground">
                              #{error.execution_id}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            {logs && logs.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {logs.page} of {logs.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={logs.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(logs.totalPages, p + 1))}
                    disabled={logs.page === logs.totalPages}
                  >
                    Next
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
