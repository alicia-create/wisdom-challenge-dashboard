import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
}

interface FunnelVisualizationProps {
  steps: FunnelStep[];
  isLoading?: boolean;
}

export function FunnelVisualization({ steps, isLoading }: FunnelVisualizationProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Step-by-step conversion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!steps || steps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Step-by-step conversion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No funnel data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate conversion rates between steps
  const conversionRates: number[] = [];
  for (let i = 0; i < steps.length - 1; i++) {
    const currentCount = steps[i]?.count || 0;
    const nextCount = steps[i + 1]?.count || 0;
    const rate = currentCount > 0 ? (nextCount / currentCount) * 100 : 0;
    conversionRates.push(rate);
  }

  // Get max count for width scaling
  const maxCount = Math.max(...steps.map((s) => s.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>Step-by-step conversion rates through the wisdom challenge funnel</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((step, index) => {
            const widthPercentage = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
            const conversionRate = conversionRates[index];
            const isLastStep = index === steps.length - 1;

            return (
              <div key={index} className="space-y-2">
                {/* Funnel Step */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div
                      className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-4 transition-all hover:shadow-md"
                      style={{ width: `${Math.max(widthPercentage, 20)}%` }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm">{step.name}</div>
                          <div className="text-xs opacity-90 mt-1">
                            {step.count.toLocaleString()} users ({step.percentage.toFixed(1)}%)
                          </div>
                        </div>
                        <div className="text-2xl font-bold">{index + 1}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversion Rate Arrow */}
                {!isLastStep && (
                  <div className="flex items-center gap-2 pl-4">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          conversionRate >= 50
                            ? "text-green-600"
                            : conversionRate >= 25
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {conversionRate.toFixed(1)}% conversion
                      </span>
                      {conversionRate >= 50 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Overall Funnel Stats */}
          <div className="pt-4 border-t mt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{steps[0]?.count.toLocaleString() || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Entries</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {steps[steps.length - 1]?.count.toLocaleString() || 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Conversions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {steps[0]?.count > 0
                    ? ((steps[steps.length - 1]?.count / steps[0]?.count) * 100).toFixed(1)
                    : 0}
                  %
                </div>
                <div className="text-xs text-muted-foreground mt-1">Overall Rate</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
