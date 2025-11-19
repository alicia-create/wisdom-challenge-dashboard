import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart3, Calendar, Users, TrendingUp } from "lucide-react";

const navItems = [
  {
    title: "Overview",
    href: "/",
    icon: BarChart3,
  },
  {
    title: "Daily Analysis",
    href: "/daily",
    icon: Calendar,
  },
  {
    title: "Engagement & Sales",
    href: "/engagement",
    icon: Users,
  },
  {
    title: "Ad Performance",
    href: "/ad-performance",
    icon: TrendingUp,
  },
];

export function DashboardNav() {
  const [location] = useLocation();

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
