import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartSkeletonProps {
  title?: string;
  description?: string;
  height?: number;
}

export function ChartSkeleton({ title, description, height = 300 }: ChartSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        {title ? (
          <CardTitle>{title}</CardTitle>
        ) : (
          <Skeleton className="h-6 w-48" />
        )}
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : (
          <Skeleton className="h-4 w-64 mt-2" />
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3" style={{ height: `${height}px` }}>
          {/* Simulated chart bars/lines */}
          <div className="flex items-end justify-between h-full gap-2">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton 
                key={i} 
                className="flex-1" 
                style={{ 
                  height: `${Math.random() * 60 + 40}%`,
                  minHeight: '40%'
                }} 
              />
            ))}
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-3 w-12" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
