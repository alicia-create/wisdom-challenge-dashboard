import { useLocation } from "wouter";
import { APP_TITLE } from "@/const";
import { cn } from "@/lib/utils";
import { Bug, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Tab {
  label: string;
  path: string;
}

const tabs: Tab[] = [
  { label: "Overview", path: "/overview" },
  { label: "Daily", path: "/daily-analysis" },
  { label: "Analytics", path: "/raw-data/analytics-dashboard" },
  { label: "Data Hub", path: "/other-data" },
  { label: "🎯 Agent", path: "/optimization-agent" },
];

export function DashboardHeader() {
  const [location, setLocation] = useLocation();

  return (
    <div className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 py-4">
          {/* Logo/Title */}
          <div className="flex-shrink-0">
            <h1 className="text-lg md:text-xl font-bold text-foreground">
              {APP_TITLE}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Real-time analytics and performance metrics
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 sm:justify-end overflow-x-auto">
            <nav className="flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto scrollbar-hide min-w-0 flex-1 sm:flex-initial">
            {tabs.map((tab) => {
              const isActive = location === tab.path;
              return (
                <button
                  key={tab.path}
                  onClick={() => setLocation(tab.path)}
                  className={cn(
                    "px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
