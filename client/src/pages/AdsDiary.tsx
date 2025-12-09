import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CreateActionDialog } from "@/components/CreateActionDialog";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Clock,
  CheckCircle2,
  Circle,
  XCircle,
  AlertCircle,
} from "lucide-react";

/**
 * Ads Diary Page
 * Timeline view of daily summaries and action logs
 */
export default function AdsDiary() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days ago
    endDate: new Date().toISOString().split("T")[0], // Today
  });

  // Fetch diary entries for date range
  const { data: entries, isLoading } = trpc.diary.getEntries.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ads Diary</h1>
            <p className="text-muted-foreground mt-1">
              Daily summaries and action log for campaign management
            </p>
          </div>
          
          <CreateActionDialog />
        </div>

        {/* Date Range Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="border rounded px-3 py-2"
                />
              </div>
              <span className="text-muted-foreground">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="border rounded px-3 py-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : entries && entries.length > 0 ? (
          <div className="space-y-6">
            {entries.map((entry) => (
              <DailyEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No diary entries found for this date range
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Entries are auto-generated from daily_kpis when you add actions
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

/**
 * Daily Entry Card Component
 * Shows daily summary metrics + associated actions
 */
function DailyEntryCard({ entry }: { entry: any }) {
  const metrics = entry.metrics;
  const date = new Date(entry.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {formattedDate}
            </CardTitle>
            <CardDescription className="mt-1">
              Summary for {metrics.date}
            </CardDescription>
          </div>
          <Badge variant="outline">{entry.actions?.length || 0} actions</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Daily Summary Metrics */}
        <div>
          <h3 className="font-semibold mb-3">Daily Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<DollarSign className="w-4 h-4" />}
              label="Total Spend"
              value={`$${metrics.totalFbUs.spent.toFixed(2)}`}
              trend={null}
            />
            <MetricCard
              icon={<Users className="w-4 h-4" />}
              label="Leads"
              value={metrics.totalFbUs.leads}
              subtext={`$${metrics.totalFbUs.cpl.toFixed(2)} CPL`}
            />
            <MetricCard
              icon={<Target className="w-4 h-4" />}
              label="Wisdom+ Sales"
              value={metrics.totalFbUs.purchases}
              subtext={`$${metrics.totalFbUs.cpa.toFixed(2)} CPA`}
            />
            <MetricCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Wisdom+ Take Rate"
              value={`${metrics.totalFbUs.vipTakeRate.toFixed(1)}%`}
              subtext="Goal: 10%"
            />
          </div>
        </div>

        {/* Actions Log */}
        {entry.actions && entry.actions.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Actions</h3>
            <div className="space-y-2">
              {entry.actions.map((action: any) => (
                <ActionItem key={action.id} action={action} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({
  icon,
  label,
  value,
  subtext,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: "up" | "down" | null;
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {trend && (
          trend === "up" ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )
        )}
      </div>
      {subtext && (
        <p className="text-sm text-muted-foreground mt-1">{subtext}</p>
      )}
    </div>
  );
}

/**
 * Status Update Button Component
 */
function StatusUpdateButton({ actionId, currentStatus }: { actionId: number; currentStatus: string }) {
  const utils = trpc.useUtils();
  const updateStatus = trpc.diary.updateActionStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      utils.diary.getEntries.invalidate();
      utils.diary.getActions.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const statuses: Array<"pending" | "in_progress" | "completed" | "verified" | "cancelled"> = ["pending", "in_progress", "completed", "verified", "cancelled"];
  const nextStatus = statuses[statuses.indexOf(currentStatus as any) + 1] || "completed";

  const handleClick = () => {
    updateStatus.mutate({ actionId, status: nextStatus as "pending" | "in_progress" | "completed" | "verified" | "cancelled" });
  };

  if (currentStatus === "verified" || currentStatus === "cancelled") {
    return null; // No more status updates needed
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={updateStatus.isPending}
    >
      {updateStatus.isPending ? "Updating..." : `Mark ${nextStatus.replace("_", " ")}`}
    </Button>
  );
}

/**
 * Action Item Component
 */
function ActionItem({ action }: { action: any }) {
  const statusIcons = {
    pending: <Circle className="w-4 h-4 text-yellow-500" />,
    in_progress: <Clock className="w-4 h-4 text-blue-500" />,
    completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    verified: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    cancelled: <XCircle className="w-4 h-4 text-red-500" />,
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    in_progress: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    verified: "bg-green-100 text-green-900 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  const typeIcons = {
    manual: "👤",
    llm_suggestion: "🤖",
    meta_api_sync: "📡",
    scheduled: "⏰",
  };

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="mt-0.5">
        {statusIcons[action.status as keyof typeof statusIcons]}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">{typeIcons[action.actionType as keyof typeof typeIcons]}</span>
          {action.category && (
            <Badge variant="outline" className="text-xs">
              {action.category}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={`text-xs ${statusColors[action.status as keyof typeof statusColors]}`}
          >
            {action.status.replace("_", " ")}
          </Badge>
        </div>
        
        <p className="text-sm">{action.description}</p>
        
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          {action.source && <span>Source: {action.source}</span>}
          {action.createdBy && <span>By: {action.createdBy}</span>}
          {action.createdAt && (
            <span>
              {new Date(action.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex gap-1">
        <StatusUpdateButton actionId={action.id} currentStatus={action.status} />
      </div>
    </div>
  );
}
