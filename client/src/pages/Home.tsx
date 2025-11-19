import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import Overview from "./Overview";

export default function Home() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="max-w-md w-full mx-auto p-8 space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">{APP_TITLE}</h1>
            <p className="text-muted-foreground">
              Real-time analytics dashboard for the 31-Day Wisdom Challenge campaign
            </p>
          </div>
          <div className="space-y-4">
            <Button asChild size="lg" className="w-full">
              <a href={getLoginUrl()}>Sign In to Continue</a>
            </Button>
            <p className="text-sm text-muted-foreground">
              Track your $2M paid media campaign performance in real-time
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <Overview />;
}
