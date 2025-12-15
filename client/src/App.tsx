import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Skeleton } from "@/components/ui/skeleton";

// Eager load critical pages
import Home from "./pages/Home";
import Overview from "./pages/Overview";
import NotFound from "./pages/NotFound";

// Lazy load non-critical pages
const DailyAnalysis = lazy(() => import("./pages/DailyAnalysis"));
const EngagementSales = lazy(() => import("./pages/EngagementSales"));
const EmailLeadQuality = lazy(() => import("./pages/EmailLeadQuality"));
const RawData = lazy(() => import("./pages/RawData"));
const OtherData = lazy(() => import("./pages/OtherData"));
const DebugLeads = lazy(() => import("./pages/DebugLeads"));
const ContactDetails = lazy(() => import("./pages/ContactDetails"));
const DebugPurchases = lazy(() => import("./pages/DebugPurchases"));
const DebugGoogleCampaigns = lazy(() => import("./pages/DebugGoogleCampaigns"));
const DebugMetaCampaigns = lazy(() => import("./pages/DebugMetaCampaigns"));
const ErrorLogs = lazy(() => import("./pages/ErrorLogs"));
const FacebookAudiences = lazy(() => import("./pages/FacebookAudiences"));
const GA4LandingPageMetrics = lazy(() => import("./pages/GA4LandingPageMetrics"));
const Documentation = lazy(() => import("./pages/Documentation"));
const OptimizationAgent = lazy(() => import("./pages/OptimizationAgent"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const Products = lazy(() => import("./pages/Products"));
const Invites = lazy(() => import("./pages/Invites"));
const AdsDiary = lazy(() => import("./pages/AdsDiary"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4 w-full max-w-4xl p-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);


function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>      <Route path={"/"} component={Home} />
      <Route path={"/overview"} component={Overview} />
      <Route path={"/daily-analysis"} component={DailyAnalysis} />
      <Route path={"/engagement-sales"} component={EngagementSales} />
      <Route path={"/email-lead-quality"} component={EmailLeadQuality} />
      <Route path={"/raw-data"} component={RawData} />
      <Route path={"/other-data"} component={OtherData} />
      <Route path={"/raw-data/analytics-dashboard"} component={AnalyticsDashboard} />
      <Route path={"/raw-data/facebook-audiences"} component={FacebookAudiences} />
      <Route path={"/raw-data/ga4-landing-pages"} component={GA4LandingPageMetrics} />
      <Route path={"/documentation"} component={Documentation} />
      <Route path={"/optimization-agent"} component={OptimizationAgent} />
      <Route path={"/debug/leads"} component={DebugLeads} />
      <Route path={"/contact/:id"} component={ContactDetails} />
      <Route path={"/debug/purchases"} component={DebugPurchases} />
      <Route path={"/products"} component={Products} />
      <Route path={"/invites"} component={Invites} />
      <Route path={"/ads-diary"} component={AdsDiary} />
      <Route path={"/debug/google-campaigns"} component={DebugGoogleCampaigns} />
      <Route path={"/debug/meta-campaigns"} component={DebugMetaCampaigns} />
      <Route path="/debug/error-logs" component={ErrorLogs} />
      <Route path={"/404"} component={NotFound} />      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
    </Suspense>
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
