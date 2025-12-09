import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useLocation } from "wouter";
import { Database, ShoppingCart, TrendingUp, AlertCircle, Users, Target, FileText, BarChart3, Mail, Activity, Package, UserPlus } from "lucide-react";

export default function OtherData() {
  const [, setLocation] = useLocation();

  const dataPages = [
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
      title: "Products",
      description: "All products with sales counts and revenue breakdown",
      icon: Package,
      path: "/products",
      color: "text-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-950",
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
      title: "Google Campaigns",
      description: "Google Ads campaign performance data and metrics",
      icon: TrendingUp,
      path: "/debug/google-campaigns",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Meta Campaigns",
      description: "Facebook and Instagram ad campaign data and insights",
      icon: TrendingUp,
      path: "/debug/meta-campaigns",
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950",
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
      title: "Facebook Audiences",
      description: "Custom audiences, lookalikes, and saved audiences from Facebook",
      icon: Target,
      path: "/raw-data/facebook-audiences",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
    },
    {
      title: "GA4 Landing Pages",
      description: "Landing page performance metrics from Google Analytics 4",
      icon: BarChart3,
      path: "/raw-data/ga4-landing-pages",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
    {
      title: "Documentation",
      description: "PRD, optimization rules, and API research documentation",
      icon: FileText,
      path: "/documentation",
      color: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-950",
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
          { label: "Other Data" },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Other Data</h1>
        </div>
        <p className="text-muted-foreground">
          Access email metrics, engagement data, raw data tables, campaigns, and system logs
        </p>
      </div>

      {/* Data Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dataPages.map((page) => {
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
    </>
  );
}
