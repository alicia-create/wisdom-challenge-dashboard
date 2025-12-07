import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Mail, Users, MousePointerClick, AlertCircle, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmailLeadQuality() {
  const { data: emailMetrics, isLoading: emailLoading } = trpc.keap.emailEngagement.useQuery();
  const { data: leadQuality, isLoading: qualityLoading } = trpc.keap.leadQuality.useQuery();
  const { data: wisdomTags, isLoading: tagsLoading } = trpc.keap.wisdomTags.useQuery();

  if (emailLoading || qualityLoading || tagsLoading) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const totalBroadcastSubscribers = emailMetrics?.broadcastSubscribers || 0;
  const wisdomBroadcastSubscribers = emailMetrics?.wisdomBroadcastSubscribers || 0;

  const totalOptouts = emailMetrics
    ? emailMetrics.reminderOptouts + emailMetrics.replayOptouts + emailMetrics.promoOptouts
    : 0;

  // Click rates (now from backend)
  const totalClickRate = totalBroadcastSubscribers > 0
    ? ((emailMetrics?.emailClickers || 0) / totalBroadcastSubscribers * 100).toFixed(2)
    : "0.00";
  
  const wisdomClickRate = emailMetrics?.wisdomClickRate?.toFixed(2) || "0.00";

  // Lead quality totals
  const totalLeads = leadQuality?.trafficLight.total || 0;
  const greenPercentage = leadQuality?.trafficLight.greenPercent.toFixed(1) || "0";
  const yellowPercentage = leadQuality?.trafficLight.yellowPercent.toFixed(1) || "0";
  const redPercentage = leadQuality?.trafficLight.redPercent.toFixed(1) || "0";

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Email & Lead Quality</h1>
        <p className="text-muted-foreground mt-2">
          Métricas de engajamento de email e qualidade de leads do Keap
        </p>
      </div>

      {/* Email Engagement Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Mail className="h-6 w-6" />
          Email Engagement
        </h2>
        
        {/* Wisdom Subset Metrics */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2 text-purple-600">Wisdom Challenge Subset</h3>
          <p className="text-sm text-amber-600 mb-3 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Baseado em amostra dos primeiros 1.000 contatos de cada categoria
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Broadcast Subscribers</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{wisdomBroadcastSubscribers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Wisdom contacts subscribed
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email Clickers</CardTitle>
                <MousePointerClick className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{emailMetrics?.wisdomEmailClickers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Wisdom contacts who clicked
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{wisdomClickRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Clickers / Subscribers
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Total Metrics */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-muted-foreground">All Contacts (Total)</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Broadcast Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBroadcastSubscribers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de inscritos em broadcasts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Clickers</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emailMetrics?.emailClickers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Clicaram em emails
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClickRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Taxa de cliques (total)
              </p>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Email Preferences Breakdown */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Email Preferences Breakdown</CardTitle>
            <CardDescription>Distribuição de opt-ins e opt-outs por tipo de email</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Reminder Emails</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Opt-ins:</span>
                    <span className="text-sm font-semibold text-green-600">{emailMetrics?.reminderOptins || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Opt-outs:</span>
                    <span className="text-sm font-semibold text-red-600">{emailMetrics?.reminderOptouts || 0}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Replay Emails</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Opt-ins:</span>
                    <span className="text-sm font-semibold text-green-600">{emailMetrics?.replayOptins || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Opt-outs:</span>
                    <span className="text-sm font-semibold text-red-600">{emailMetrics?.replayOptouts || 0}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Promo Emails</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Opt-ins:</span>
                    <span className="text-sm font-semibold text-green-600">{emailMetrics?.promoOptins || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Opt-outs:</span>
                    <span className="text-sm font-semibold text-red-600">{emailMetrics?.promoOptouts || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Quality Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-6 w-6" />
          Lead Quality (List Defender)
        </h2>
        
        {/* Wisdom Subset Metrics */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2 text-purple-600">Wisdom Challenge Subset</h3>
          <p className="text-sm text-amber-600 mb-3 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Baseado em amostra dos primeiros 1.000 contatos de cada categoria
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-l-4 border-l-green-500 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Green (Safe)</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{leadQuality?.wisdomTrafficLight.green.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {leadQuality?.wisdomTrafficLight.greenPercent.toFixed(1) || 0}% do total Wisdom
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Yellow (Re-engage)</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{leadQuality?.wisdomTrafficLight.yellow.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {leadQuality?.wisdomTrafficLight.yellowPercent.toFixed(1) || 0}% do total Wisdom
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Red (Do Not Send)</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{leadQuality?.wisdomTrafficLight.red.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {leadQuality?.wisdomTrafficLight.redPercent.toFixed(1) || 0}% do total Wisdom
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Total Metrics */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-muted-foreground">All Contacts (Total)</h3>
          <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Green (Safe)</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leadQuality?.trafficLight.green || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {greenPercentage}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yellow (Re-engage)</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leadQuality?.trafficLight.yellow || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {yellowPercentage}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Red (Do Not Send)</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leadQuality?.trafficLight.red || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {redPercentage}% do total
              </p>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Engagement Levels */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Engagement Levels</CardTitle>
            <CardDescription>Distribuição de níveis de engajamento dos leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">High Engaged</p>
                <p className="text-2xl font-bold text-green-600">{leadQuality?.engagement.high || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Low Engaged</p>
                <p className="text-2xl font-bold text-yellow-600">{leadQuality?.engagement.low || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Never Engaged</p>
                <p className="text-2xl font-bold text-red-600">{leadQuality?.engagement.neverEngaged || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Slipping</p>
                <p className="text-2xl font-bold text-orange-600">{leadQuality?.engagement.slipping || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Flags */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Risk Flags</CardTitle>
            <CardDescription>Leads com problemas de qualidade identificados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Disposable Email</p>
                <p className="text-lg font-semibold">{leadQuality?.riskFlags.disposable || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Suspicious</p>
                <p className="text-lg font-semibold">{leadQuality?.riskFlags.suspicious || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Invalid Emails</p>
                <p className="text-lg font-semibold">{leadQuality?.riskFlags.invalidEmails || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wisdom Challenge Tags Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Wisdom Challenge Tags</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">VIP Buyers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total VIP Buyers:</span>
                  <span className="text-sm font-semibold">{wisdomTags?.vipBuyers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">VIP Take Rate:</span>
                  <span className="text-sm font-semibold">{wisdomTags?.vipTakeRate.toFixed(2) || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Opt-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Opt-ins:</span>
                  <span className="text-sm font-semibold">{wisdomTags?.totalOptins || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Journal Buyers:</span>
                  <span className="text-sm font-semibold">{wisdomTags?.journalBuyers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Kingdom Seekers:</span>
                  <span className="text-sm font-semibold">{wisdomTags?.kingdomSeekerTrials || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
