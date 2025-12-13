import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, Phone, MessageCircle, ExternalLink, 
  TrendingUp, ShoppingCart, Clock, Calendar,
  ChevronRight, Home
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ContactDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  
  const contactId = parseInt(id || "0", 10);

  // Fetch contact details
  const { data: contact, isLoading: contactLoading } = trpc.contacts.getById.useQuery(
    { id: contactId },
    { enabled: contactId > 0 }
  );

  // Fetch contact activities
  const { data: activities, isLoading: activitiesLoading } = trpc.contacts.getActivities.useQuery(
    { contactId },
    { enabled: contactId > 0 }
  );

  // Fetch contact orders
  const { data: orders, isLoading: ordersLoading } = trpc.orders.getByContactId.useQuery(
    { contactId },
    { enabled: contactId > 0 }
  );

  if (contactLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Contact not found</p>
            <div className="flex justify-center mt-4">
              <Link 
                href="/debug/leads"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Back to Leads
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getLeadScoreBadge = (score: number) => {
    if (score >= 4) return <Badge className="bg-green-500">Score: {score} (Hot)</Badge>;
    if (score >= 2) return <Badge className="bg-yellow-500">Score: {score} (Warm)</Badge>;
    return <Badge variant="secondary">Score: {score} (Cold)</Badge>;
  };

  const totalRevenue = (orders || []).reduce((sum, o) => sum + parseFloat(o.order_total || "0"), 0);
  const daysSinceCreated = contact.created_at 
    ? Math.floor((Date.now() - new Date(contact.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const lastActivity = activities && activities.length > 0 
    ? activities[0].timestamp 
    : contact.created_at;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/debug/leads" className="hover:text-foreground transition-colors">
              Leads
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">{contact.full_name || contact.email}</span>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 border-b">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                {(contact.full_name || contact.first_name || contact.email || "?").charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-3xl font-bold">{contact.full_name || "Unknown"}</h1>
                <div className="flex flex-wrap gap-3 mt-2 text-muted-foreground">
                  {contact.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${contact.email}`} className="hover:text-foreground">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${contact.phone}`} className="hover:text-foreground">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {contact.messenger_id && (
                  <a 
                    href={`https://m.me/${contact.messenger_id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message on Messenger
                  </a>
                )}
                {contact.email && (
                  <a 
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </a>
                )}
                {contact.phone && (
                  <a 
                    href={`tel:${contact.phone}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </a>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lead Score</p>
                  <div className="mt-2">
                    {getLeadScoreBadge(contact.lead_score || 0)}
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Purchases</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{orders?.length || 0} orders</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Activity</p>
                  <p className="text-sm font-medium mt-1">
                    {lastActivity ? formatDate(lastActivity) : "Never"}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Days Since First Contact</p>
                  <p className="text-2xl font-bold mt-1">{daysSinceCreated}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {contact.created_at ? formatDate(contact.created_at) : "Unknown"}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">📊 Overview</TabsTrigger>
            <TabsTrigger value="orders">🛒 Orders</TabsTrigger>
            <TabsTrigger value="journey">📈 Journey</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>All events for this contact</CardDescription>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : activities && activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity: any, idx: number) => (
                      <div key={idx} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {activity.type === "action" ? "📝" : 
                             activity.type === "purchase" ? "💰" : 
                             activity.type === "page_view" ? "👁️" : "🔔"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{activity.name}</p>
                              {activity.value && (
                                <p className="text-sm font-semibold text-foreground mt-1">
                                  {activity.value}
                                </p>
                              )}
                              {activity.comment && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {activity.comment}
                                </p>
                              )}
                            </div>
                            <Badge variant={
                              activity.type === "purchase" ? "default" : 
                              activity.type === "action" ? "secondary" : "outline"
                            }>
                              {activity.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No activities recorded yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase History</CardTitle>
                <CardDescription>All orders from this contact</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : orders && orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Date</th>
                          <th className="text-left py-3 px-4 font-medium">Product</th>
                          <th className="text-right py-3 px-4 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order: any, idx: number) => (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">{formatDate(order.order_date)}</td>
                            <td className="py-3 px-4">{order.product_name || "Unknown"}</td>
                            <td className="text-right py-3 px-4 font-medium">
                              {formatCurrency(parseFloat(order.order_total || "0"))}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{order.order_status || "completed"}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No orders yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Engagement</CardTitle>
                <CardDescription>Keap tags and email activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Keap Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {contact.keap_tags && contact.keap_tags.length > 0 ? (
                        contact.keap_tags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{tag}</Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No tags applied</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Email Stats</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-2xl font-bold">{contact.email_opens || 0}</p>
                        <p className="text-sm text-muted-foreground">Opens</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-2xl font-bold">{contact.email_clicks || 0}</p>
                        <p className="text-sm text-muted-foreground">Clicks</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Journey Tab */}
          <TabsContent value="journey" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Journey</CardTitle>
                <CardDescription>Funnel progress and VSL engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium mb-3">Funnel Progress</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          contact.id ? "bg-green-500 text-white" : "bg-gray-200"
                        }`}>
                          ✓
                        </div>
                        <span>Lead Created</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          contact.wisdom_plus_purchased ? "bg-green-500 text-white" : "bg-gray-200"
                        }`}>
                          {contact.wisdom_plus_purchased ? "✓" : "○"}
                        </div>
                        <span>Wisdom+ Purchase</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          contact.kingdom_seekers_purchased ? "bg-green-500 text-white" : "bg-gray-200"
                        }`}>
                          {contact.kingdom_seekers_purchased ? "✓" : "○"}
                        </div>
                        <span>Kingdom Seekers Purchase</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-3">VSL Engagement</p>
                    <div className="grid grid-cols-4 gap-4">
                      {[5, 25, 75, 95].map(percent => (
                        <div key={percent} className="p-4 border rounded-lg text-center">
                          <p className="text-2xl font-bold">
                            {contact[`vsl_${percent}_watched` as keyof typeof contact] ? "✓" : "-"}
                          </p>
                          <p className="text-sm text-muted-foreground">{percent}% watched</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
