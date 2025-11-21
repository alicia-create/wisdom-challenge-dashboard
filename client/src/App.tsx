import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Overview from "./pages/Overview";
import DailyAnalysis from "./pages/DailyAnalysis";
import EngagementSales from "./pages/EngagementSales";
import DebugLeads from "./pages/DebugLeads";
import DebugPurchases from "./pages/DebugPurchases";
import DebugGoogleCampaigns from "./pages/DebugGoogleCampaigns";
import DebugMetaCampaigns from "./pages/DebugMetaCampaigns";

function Router() {
  return (
    <Switch>      <Route path={"/"} component={Home} />
      <Route path={"/overview"} component={Overview} />
      <Route path={"/daily-analysis"} component={DailyAnalysis} />
      <Route path={"/engagement-sales"} component={EngagementSales} />      <Route path={"/debug/leads"} component={DebugLeads} />
      <Route path={"/debug/purchases"} component={DebugPurchases} />
      <Route path={"/debug/google-campaigns"} component={DebugGoogleCampaigns} />
      <Route path={"/debug/meta-campaigns"} component={DebugMetaCampaigns} />
      <Route path={"/404"} component={NotFound} />      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
