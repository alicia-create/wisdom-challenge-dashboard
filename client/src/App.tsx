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
import EmailLeadQuality from "./pages/EmailLeadQuality";
import RawData from "./pages/RawData";
import OtherData from "./pages/OtherData";
import DebugLeads from "./pages/DebugLeads";
import ContactDetails from "./pages/ContactDetails";
import DebugPurchases from "./pages/DebugPurchases";
import DebugGoogleCampaigns from "./pages/DebugGoogleCampaigns";
import DebugMetaCampaigns from "./pages/DebugMetaCampaigns";
import ErrorLogs from "./pages/ErrorLogs";
import FacebookAudiences from "./pages/FacebookAudiences";
import GA4LandingPageMetrics from "./pages/GA4LandingPageMetrics";
import Documentation from "./pages/Documentation";
import OptimizationAgent from "./pages/OptimizationAgent";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import Products from "./pages/Products";
import Invites from "./pages/Invites";
import AdsDiary from "./pages/AdsDiary";


function Router() {
  return (
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
