import { Play, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface VSLPerformanceProps {
  data: {
    vsl5Percent: number;
    vsl25Percent: number;
    vsl75Percent: number;
    vsl95Percent: number;
    wisdomPurchases: number;
    vslToPurchaseRate: number;
  };
}

export function VSLPerformance({ data }: VSLPerformanceProps) {
  const milestones = [
    { label: "5% watched", count: data.vsl5Percent, color: "bg-purple-500" },
    { label: "25% watched", count: data.vsl25Percent, color: "bg-blue-500" },
    { label: "75% watched", count: data.vsl75Percent, color: "bg-indigo-500" },
    { label: "95% watched", count: data.vsl95Percent, color: "bg-cyan-500" },
  ];

  const maxCount = data.vsl5Percent || 1;

  return (
    <div className="space-y-6">
      {/* VSL Watch Milestones */}
      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const percentage = maxCount > 0 ? (milestone.count / maxCount) * 100 : 0;
          const dropOff = index > 0 
            ? milestones[index - 1].count - milestone.count 
            : 0;
          const dropOffPercent = index > 0 && milestones[index - 1].count > 0
            ? (dropOff / milestones[index - 1].count) * 100
            : 0;

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{milestone.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{milestone.count.toLocaleString()}</span>
                  {dropOff > 0 && (
                    <span className="text-xs text-red-600">
                      -{dropOffPercent.toFixed(1)}% drop-off
                    </span>
                  )}
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </div>

      {/* VSL to Purchase Conversion */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-semibold">VSL → Wisdom+ Conversion</div>
              <div className="text-sm text-muted-foreground">
                {data.wisdomPurchases} purchases from {data.vsl5Percent} VSL views
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {data.vslToPurchaseRate.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
