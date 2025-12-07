import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useLocation } from "wouter";
import { Database, ShoppingCart, TrendingUp, AlertCircle, Users } from "lucide-react";

export default function RawData() {
  const [, setLocation] = useLocation();

  const dataPages = [
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
  ];

  return (
    <>
      <DashboardHeader />
      <div className="container py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Raw Data" },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Raw Data</h1>
        </div>
        <p className="text-muted-foreground">
          Access detailed raw data tables for leads, purchases, campaigns, and system logs
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
