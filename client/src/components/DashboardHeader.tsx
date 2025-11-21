import { useLocation } from "wouter";
import { APP_TITLE } from "@/const";
import { cn } from "@/lib/utils";
import { Bug } from "lucide-react";
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
  { label: "Daily Analysis", path: "/daily-analysis" },
  { label: "Engagement & Sales", path: "/engagement-sales" },
];

export function DashboardHeader() {
  const [location, setLocation] = useLocation();

  return (
    <div className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between py-4">
          {/* Logo/Title */}
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {APP_TITLE}
            </h1>
            <p className="text-xs text-muted-foreground">
              Real-time analytics and performance metrics
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-4">
            <nav className="flex gap-1 bg-muted p-1 rounded-lg">
            {tabs.map((tab) => {
              const isActive = location === tab.path;
              return (
                <button
                  key={tab.path}
                  onClick={() => setLocation(tab.path)}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
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
            
            {/* Debug Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Bug className="h-4 w-4 mr-2" />
                  Raw Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocation("/debug/leads")}>
                  View Leads
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/debug/purchases")}>
                  View Purchases
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
