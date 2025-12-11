import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useLocation } from "wouter";
import { Database, ShoppingCart, TrendingUp, AlertCircle, Users, Target, FileText, Mail, Activity, Package, UserPlus, BookOpen, Link as LinkIcon } from "lucide-react";

export default function OtherData() {
  const [, setLocation] = useLocation();

  // Priority 1: Most important (large cards) - 4 cards
  const primaryPages = [
    {
      title: "Leads Data",
      description: "View all lead records with contact information and source tracking",
      icon: Users,
      path: "/debug/leads",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Purchases Data",
      description: "Complete purchase history with order details and customer information",
      icon: ShoppingCart,
      path: "/debug/purchases",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Ads Diary",
      description: "Daily summaries and action log for campaign management",
      icon: BookOpen,
      path: "/ads-diary",
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950",
    },
    {
      title: "Meta Campaigns",
      description: "Facebook and Instagram ad campaign data and insights",
      icon: TrendingUp,
      path: "/debug/meta-campaigns",
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950",
    },
  ];

  // Priority 2: Secondary data (medium cards) - 4 cards
  const secondaryPages = [
    {
      title: "Google Campaigns",
      description: "Google Ads campaign performance data and metrics",
      icon: TrendingUp,
      path: "/debug/google-campaigns",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Products",
      description: "All products with sales counts and revenue breakdown",
      icon: Package,
      path: "/products",
      color: "text-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-950",
    },
    {
      title: "Email & Leads",
      description: "Email engagement metrics and lead quality analysis from Keap",
      icon: Mail,
      path: "/email-lead-quality",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Engagement",
      description: "User engagement metrics and sales performance analysis",
      icon: Activity,
      path: "/engagement-sales",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
  ];

  // Priority 3: System pages (small cards) - 5 cards
  const tertiaryPages = [
    {
      title: "API Connections",
      description: "Configure Meta and Google Ads API connections",
      icon: LinkIcon,
      path: "/api-connections",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Error Logs",
      description: "System error logs and debugging information",
      icon: AlertCircle,
      path: "/debug/error-logs",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
    },
    {
      title: "User Management",
      description: "Generate invite links for users outside @pedroadao.com domain",
      icon: UserPlus,
      path: "/invites",
      color: "text-violet-600",
      bgColor: "bg-violet-50 dark:bg-violet-950",
    },
    {
      title: "Documentation",
      description: "PRD, optimization rules, and API research documentation",
      icon: FileText,
      path: "/documentation",
      color: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-950",
    },
    {
      title: "Facebook Audiences",
      description: "Custom audiences, lookalikes, and saved audiences from Facebook",
      icon: Target,
      path: "/raw-data/facebook-audiences",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
    },
  ];

  return (
    <>
      <DashboardHeader />
      <div className="container py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Data Hub" },
        ]}
      />

      {/* Header */}
      <div className="mb-8 mt-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Data Hub</h1>
        </div>
        <p className="text-muted-foreground">
          Access leads, purchases, campaigns, analytics, and system data
        </p>
      </div>

      {/* Primary Pages - Large Cards (4 cards in a row) */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Primary Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {primaryPages.map((page) => {
            const Icon = page.icon;
            return (
              <Card
                key={page.path}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                onClick={() => setLocation(page.path)}
              >
                <CardHeader>
                  <div className={`w-14 h-14 rounded-lg ${page.bgColor} flex items-center justify-center mb-3`}>
                    <Icon className={`h-7 w-7 ${page.color}`} />
                  </div>
                  <CardTitle className="text-xl">{page.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {page.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <button className="text-sm font-medium text-primary hover:underline">
                    View Data →
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Secondary Pages - Medium Cards (4 cards in a row) */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Analytics & Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {secondaryPages.map((page) => {
            const Icon = page.icon;
            return (
              <Card
                key={page.path}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                onClick={() => setLocation(page.path)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${page.bgColor} flex items-center justify-center mb-3`}>
                    <Icon className={`h-6 w-6 ${page.color}`} />
                  </div>
                  <CardTitle className="text-lg">{page.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {page.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <button className="text-sm font-medium text-primary hover:underline">
                    View Data →
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Tertiary Pages - Small Cards (6 cards in a row) */}
      <div>
        <h2 className="text-xl font-semibold mb-4">System & Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {tertiaryPages.map((page) => {
            const Icon = page.icon;
            return (
              <Card
                key={page.path}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                onClick={() => setLocation(page.path)}
              >
                <CardHeader className="p-4">
                  <div className={`w-10 h-10 rounded-lg ${page.bgColor} flex items-center justify-center mb-2`}>
                    <Icon className={`h-5 w-5 ${page.color}`} />
                  </div>
                  <CardTitle className="text-sm">{page.title}</CardTitle>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
}
