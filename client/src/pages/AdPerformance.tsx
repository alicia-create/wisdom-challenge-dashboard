import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertCircle, BarChart3, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function AdPerformance() {
  const { user, loading: authLoading } = useAuth();
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [selectedAdset, setSelectedAdset] = useState<string>("");
  const [selectedAd, setSelectedAd] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");

  // Fetch ad hierarchy for filters
  const { data: hierarchy, isLoading: hierarchyLoading } = trpc.dashboard.adHierarchy.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Fetch detailed ad performance with filters
  const { data: adPerformance, isLoading: performanceLoading } = trpc.dashboard.adPerformanceDetailed.useQuery(
    {
      campaignId: selectedCampaign || undefined,
      adsetId: selectedAdset || undefined,
      adId: selectedAd || undefined,
      platform: selectedPlatform || undefined,
    },
    { enabled: !!user }
  );

  // Fetch landing page metrics
  const { data: landingPageMetrics, isLoading: landingPageLoading } = trpc.dashboard.landingPageMetrics.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <img src={APP_LOGO} alt={APP_TITLE} className="h-16 w-16" />
        <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
        <p className="text-muted-foreground">Please sign in to view the dashboard</p>
        <Button asChild>
          <a href={getLoginUrl()}>Sign In</a>
        </Button>
      </div>
    );
  }

  // Calculate average landing page view rate
  const avgLandingPageRate = landingPageMetrics && landingPageMetrics.length > 0
    ? landingPageMetrics.reduce((sum, m: any) => sum + (parseFloat(m.landing_page_view_per_link_click) || 0), 0) / landingPageMetrics.length
    : 0;

  // Find ads with low landing page view rate (< 0.6)
  const lowPerformingAds = landingPageMetrics?.filter((m: any) => parseFloat(m.landing_page_view_per_link_click) < 0.6) || [];

  // Get available campaigns for selected platform
  const availableCampaigns = hierarchy?.filter((c: any) => 
    !selectedPlatform || c.platform === selectedPlatform
  ) || [];

  // Get available ad sets for selected campaign
  const selectedCampaignData = hierarchy?.find((c: any) => c.id === selectedCampaign);
  const availableAdsets = selectedCampaignData?.adsets || [];

  // Get available ads for selected ad set
  const selectedAdsetData = availableAdsets.find((a: any) => a.id === selectedAdset);
  const availableAds = selectedAdsetData?.ads || [];

  // Calculate totals
  const totals = adPerformance?.reduce((acc: any, row: any) => ({
    spend: acc.spend + parseFloat(row.spend || '0'),
    impressions: acc.impressions + parseInt(row.impressions || '0'),
    clicks: acc.clicks + parseInt(row.clicks || '0'),
    inline_link_clicks: acc.inline_link_clicks + parseInt(row.inline_link_clicks || '0'),
    reported_leads: acc.reported_leads + parseInt(row.reported_leads || '0'),
    reported_purchases: acc.reported_purchases + parseInt(row.reported_purchases || '0'),
  }), { spend: 0, impressions: 0, clicks: 0, inline_link_clicks: 0, reported_leads: 0, reported_purchases: 0 }) || {};

  const avgCTR = totals.impressions > 0 ? (totals.clicks / totals.impressions * 100) : 0;
  const avgCPL = totals.reported_leads > 0 ? (totals.spend / totals.reported_leads) : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ad Performance Analysis</h1>
            <p className="text-muted-foreground">Campaign, Ad Set, and Ad level insights with landing page metrics</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Landing Page Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(avgLandingPageRate * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {avgLandingPageRate >= 0.8 ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Excellent load performance
                  </span>
                ) : avgLandingPageRate >= 0.6 ? (
                  <span className="text-yellow-600">Good performance</span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Needs improvement
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Performing Ads</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowPerformingAds.length}</div>
              <p className="text-xs text-muted-foreground">
                Ads with &lt; 60% landing page view rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgCTR.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Click-through rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average CPL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${avgCPL.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Cost per lead
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter by platform, campaign, ad set, or individual ad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <Select value={selectedPlatform} onValueChange={(value) => {
                  setSelectedPlatform(value);
                  setSelectedCampaign("");
                  setSelectedAdset("");
                  setSelectedAd("");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All platforms</SelectItem>
                    <SelectItem value="meta">Meta Ads</SelectItem>
                    <SelectItem value="google">Google Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign</label>
                <Select value={selectedCampaign} onValueChange={(value) => {
                  setSelectedCampaign(value);
                  setSelectedAdset("");
                  setSelectedAd("");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All campaigns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All campaigns</SelectItem>
                    {availableCampaigns.map((campaign: any) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ad Set</label>
                <Select 
                  value={selectedAdset} 
                  onValueChange={(value) => {
                    setSelectedAdset(value);
                    setSelectedAd("");
                  }}
                  disabled={!selectedCampaign}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All ad sets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All ad sets</SelectItem>
                    {availableAdsets.map((adset: any) => (
                      <SelectItem key={adset.id} value={adset.id}>
                        {adset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ad</label>
                <Select 
                  value={selectedAd} 
                  onValueChange={setSelectedAd}
                  disabled={!selectedAdset}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All ads" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All ads</SelectItem>
                    {availableAds.map((ad: any) => (
                      <SelectItem key={ad.id} value={ad.id}>
                        {ad.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(selectedPlatform || selectedCampaign || selectedAdset || selectedAd) && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => {
                  setSelectedPlatform("");
                  setSelectedCampaign("");
                  setSelectedAdset("");
                  setSelectedAd("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Ad Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Ad Performance Data</CardTitle>
            <CardDescription>
              {performanceLoading ? "Loading..." : `${adPerformance?.length || 0} rows`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {performanceLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : adPerformance && adPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Ad Set</TableHead>
                      <TableHead>Ad</TableHead>
                      <TableHead className="text-right">Spend</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Link Clicks</TableHead>
                      <TableHead className="text-right">LP View Rate</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Purchases</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adPerformance.map((row: any, idx: number) => {
                      const lpRate = parseFloat(row.landing_page_view_per_link_click);
                      const lpRateColor = lpRate >= 0.8 ? 'text-green-600' : lpRate >= 0.6 ? 'text-yellow-600' : 'text-red-600';
                      
                      return (
                        <TableRow key={idx}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell className="capitalize">{row.platform}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{row.campaign_name || '-'}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{row.adset_name || '-'}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{row.ad_name || '-'}</TableCell>
                          <TableCell className="text-right">${parseFloat(row.spend || '0').toFixed(2)}</TableCell>
                          <TableCell className="text-right">{row.impressions || 0}</TableCell>
                          <TableCell className="text-right">{row.clicks || 0}</TableCell>
                          <TableCell className="text-right">{row.inline_link_clicks || 0}</TableCell>
                          <TableCell className={`text-right font-medium ${lpRateColor}`}>
                            {lpRate ? `${(lpRate * 100).toFixed(1)}%` : '-'}
                          </TableCell>
                          <TableCell className="text-right">{row.reported_leads || 0}</TableCell>
                          <TableCell className="text-right">{row.reported_purchases || 0}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No ad performance data available. Make sure the Meta Ads workflow is running and populating data.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Performing Ads Alert */}
        {lowPerformingAds.length > 0 && (
          <Card className="border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Ads Needing Attention
              </CardTitle>
              <CardDescription>
                These ads have landing page view rates below 60%, indicating potential issues with page load speed or ad relevance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowPerformingAds.slice(0, 5).map((ad: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{ad.ad_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {ad.campaign_name} → {ad.adset_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        {(parseFloat(ad.landing_page_view_per_link_click) * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ad.inline_link_clicks} link clicks
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
