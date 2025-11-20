import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Calendar, Users, TrendingUp, DollarSign } from "lucide-react";

export default function EngagementSales() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container py-6">
        {/* Coming Soon Banner */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Engagement & Sales
          </h2>
          <p className="text-muted-foreground">
            Attendance tracking and high-ticket sales during the challenge
          </p>
        </div>

        {/* Placeholder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-[#560BAD]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <Users className="h-5 w-5 text-[#560BAD]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">Coming Soon</div>
              <p className="text-xs text-muted-foreground mt-1">
                Live + VIP participants
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#B5179E]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High-Ticket Sales</CardTitle>
              <TrendingUp className="h-5 w-5 text-[#B5179E]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">Coming Soon</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total HT conversions
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#3A0CA3]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Per Acquisition (HT)</CardTitle>
              <DollarSign className="h-5 w-5 text-[#3A0CA3]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">Coming Soon</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total spend / HT sales
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#4361EE]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROAS (Full Funnel)</CardTitle>
              <TrendingUp className="h-5 w-5 text-[#4361EE]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">Coming Soon</div>
              <p className="text-xs text-muted-foreground mt-1">
                VIP + OTO + HT revenue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Description Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#560BAD]" />
                Daily Attendance Tracking
              </CardTitle>
              <CardDescription>
                Monitor participant engagement throughout the 31-day challenge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-[#560BAD] mt-2" />
                <div>
                  <p className="font-medium text-sm">Free vs. VIP Attendance</p>
                  <p className="text-sm text-muted-foreground">
                    Track daily attendance split between YouTube (free) and Zoom (VIP) participants
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-[#560BAD] mt-2" />
                <div>
                  <p className="font-medium text-sm">Engagement Trends</p>
                  <p className="text-sm text-muted-foreground">
                    Visualize attendance patterns over the challenge duration
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-[#560BAD] mt-2" />
                <div>
                  <p className="font-medium text-sm">Drop-off Analysis</p>
                  <p className="text-sm text-muted-foreground">
                    Identify when participants stop attending and correlate with sales
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#B5179E]" />
                High-Ticket Sales Attribution
              </CardTitle>
              <CardDescription>
                Connect high-ticket sales back to original acquisition campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-[#B5179E] mt-2" />
                <div>
                  <p className="font-medium text-sm">Campaign Attribution</p>
                  <p className="text-sm text-muted-foreground">
                    Track which Meta/Google campaigns generated high-ticket buyers
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-[#B5179E] mt-2" />
                <div>
                  <p className="font-medium text-sm">Full Funnel ROAS</p>
                  <p className="text-sm text-muted-foreground">
                    Calculate true ROAS including VIP, OTO, and high-ticket revenue
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-[#B5179E] mt-2" />
                <div>
                  <p className="font-medium text-sm">Cost Per Acquisition</p>
                  <p className="text-sm text-muted-foreground">
                    Measure true CPA for high-ticket customers from initial ad click
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Implementation Note */}
        <Card className="mt-6 border-l-4 border-l-[#F72585]">
          <CardHeader>
            <CardTitle className="text-lg">📋 Implementation Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Data Sources Needed:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>YouTube API integration for free participant attendance</li>
              <li>Zoom API integration for VIP participant attendance</li>
              <li>High-ticket sales platform webhook (e.g., Stripe, ClickFunnels)</li>
              <li>UTM parameter tracking to link HT sales back to original campaigns</li>
            </ul>
            <p className="mt-4">
              <strong>Database Schema:</strong> New tables needed for <code className="bg-muted px-1 py-0.5 rounded">attendance</code> and <code className="bg-muted px-1 py-0.5 rounded">high_ticket_sales</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
