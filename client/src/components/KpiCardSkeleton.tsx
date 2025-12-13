import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface KpiCardSkeletonProps {
  /** Number of skeleton cards to render */
  count?: number;
  /** Size variant - large for primary KPIs, small for secondary */
  size?: 'large' | 'small';
}

export function KpiCardSkeleton({ count = 1, size = 'large' }: KpiCardSkeletonProps) {
  const cards = Array.from({ length: count }, (_, i) => i);
  
  return (
    <>
      {cards.map((i) => (
        <Card key={i} className="p-6">
          <div className="space-y-3">
            {/* Title skeleton */}
            <Skeleton className="h-4 w-32" />
            
            {/* Value skeleton */}
            <Skeleton className={size === 'large' ? "h-10 w-40" : "h-8 w-24"} />
            
            {/* Subtitle/trend skeleton */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}
