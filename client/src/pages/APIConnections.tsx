import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, RefreshCw, Link as LinkIcon } from "lucide-react";

export default function APIConnections() {
  // Meta Ads state
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaAdAccountId, setMetaAdAccountId] = useState("");
  const [metaConnectionStatus, setMetaConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  // Google Ads state
  const [googleRefreshToken, setGoogleRefreshToken] = useState("");
  const [googleCustomerId, setGoogleCustomerId] = useState("");
  const [googleConnectionStatus, setGoogleConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  // Sync state
  const [syncStartDate, setSyncStartDate] = useState("");
  const [syncEndDate, setSyncEndDate] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Test Meta connection
  const testMetaConnection = trpc.ads.testMetaConnection.useMutation({
    onSuccess: () => {
      setMetaConnectionStatus("success");
      toast.success("Meta Ads API connection successful!");
    },
    onError: (error: any) => {
      setMetaConnectionStatus("error");
      toast.error(`Meta connection failed: ${error.message}`);
    },
  });

  // Test Google connection
  const testGoogleConnection = trpc.ads.testGoogleConnection.useMutation({
    onSuccess: () => {
      setGoogleConnectionStatus("success");
      toast.success("Google Ads API connection successful!");
    },
    onError: (error: any) => {
      setGoogleConnectionStatus("error");
      toast.error(`Google connection failed: ${error.message}`);
    },
  });

  // Sync ad data
  const syncAdData = trpc.ads.syncAdData.useMutation({
    onSuccess: (result: any) => {
      setIsSyncing(false);
      toast.success(`Synced ${result.metaRows + result.googleRows} rows successfully!`);
    },
    onError: (error: any) => {
      setIsSyncing(false);
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  const handleTestMeta = () => {
    if (!metaAccessToken || !metaAdAccountId) {
      toast.error("Please provide both Meta Access Token and Ad Account ID");
      return;
    }
    setMetaConnectionStatus("testing");
    testMetaConnection.mutate({
      accessToken: metaAccessToken,
      adAccountId: metaAdAccountId,
    });
  };

  const handleTestGoogle = () => {
    if (!googleRefreshToken || !googleCustomerId) {
      toast.error("Please provide both Google Refresh Token and Customer ID");
      return;
    }
    setGoogleConnectionStatus("testing");
    testGoogleConnection.mutate({
      refreshToken: googleRefreshToken,
      customerId: googleCustomerId,
    });
  };

  const handleSyncData = () => {
    if (!syncStartDate || !syncEndDate) {
      toast.error("Please select start and end dates for sync");
      return;
    }

    if (metaConnectionStatus !== "success" && googleConnectionStatus !== "success") {
      toast.error("Please test and verify at least one API connection first");
      return;
    }

    setIsSyncing(true);
    syncAdData.mutate({
      startDate: syncStartDate,
      endDate: syncEndDate,
      metaConfig: metaConnectionStatus === "success" ? {
        accessToken: metaAccessToken,
        adAccountId: metaAdAccountId,
      } : undefined,
      googleConfig: googleConnectionStatus === "success" ? {
        refreshToken: googleRefreshToken,
        customerId: googleCustomerId,
      } : undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>;
      case "error":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "testing":
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Testing...</Badge>;
      default:
        return <Badge variant="outline">Not Connected</Badge>;
    }
  };

  return (
    <>
      <DashboardHeader />
      <div className="container py-8">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Data Hub", href: "/other-data" },
            { label: "API Connections" },
          ]}
        />

        <div className="mb-8 mt-8">
          <div className="flex items-center gap-3 mb-2">
            <LinkIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">API Connections</h1>
          </div>
          <p className="text-muted-foreground">
            Configure and test Meta and Google Ads API connections to sync campaign data
          </p>
        </div>

        <div className="grid gap-6">
          {/* Meta Ads Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Meta Ads API</CardTitle>
                  <CardDescription>
                    Connect to Facebook and Instagram Ads data
                  </CardDescription>
                </div>
                {getStatusBadge(metaConnectionStatus)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="metaAccessToken">Access Token</Label>
                  <Input
                    id="metaAccessToken"
                    type="password"
                    placeholder="EAAxxxxxxxxxx..."
                    value={metaAccessToken}
                    onChange={(e) => setMetaAccessToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get from Meta Business Suite → Settings → Business Settings → System Users
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaAdAccountId">Ad Account ID</Label>
                  <Input
                    id="metaAdAccountId"
                    placeholder="act_123456789"
                    value={metaAdAccountId}
                    onChange={(e) => setMetaAdAccountId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: act_XXXXXXXXX (found in Ads Manager URL)
                  </p>
                </div>
              </div>
              <Button
                onClick={handleTestMeta}
                disabled={metaConnectionStatus === "testing"}
              >
                {metaConnectionStatus === "testing" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Google Ads Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Google Ads API</CardTitle>
                  <CardDescription>
                    Connect to Google Ads campaign data
                  </CardDescription>
                </div>
                {getStatusBadge(googleConnectionStatus)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="googleRefreshToken">Refresh Token</Label>
                  <Input
                    id="googleRefreshToken"
                    type="password"
                    placeholder="1//0xxxxxxxxxx..."
                    value={googleRefreshToken}
                    onChange={(e) => setGoogleRefreshToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    OAuth 2.0 refresh token from Google Cloud Console
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleCustomerId">Customer ID</Label>
                  <Input
                    id="googleCustomerId"
                    placeholder="123-456-7890"
                    value={googleCustomerId}
                    onChange={(e) => setGoogleCustomerId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    10-digit ID from Google Ads account (top right corner)
                  </p>
                </div>
              </div>
              <Button
                onClick={handleTestGoogle}
                disabled={googleConnectionStatus === "testing"}
              >
                {googleConnectionStatus === "testing" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Data Sync */}
          <Card>
            <CardHeader>
              <CardTitle>Sync Campaign Data</CardTitle>
              <CardDescription>
                Pull ad performance data from connected APIs into the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="syncStartDate">Start Date</Label>
                  <Input
                    id="syncStartDate"
                    type="date"
                    value={syncStartDate}
                    onChange={(e) => setSyncStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="syncEndDate">End Date</Label>
                  <Input
                    id="syncEndDate"
                    type="date"
                    value={syncEndDate}
                    onChange={(e) => setSyncEndDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">What will be synced:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Campaign, Ad Set, and Ad level data</li>
                  <li>• Spend, clicks, impressions, conversions</li>
                  <li>• Data will be saved to ad_performance table</li>
                  <li>• Performance by Channel will update automatically</li>
                </ul>
              </div>

              <Button
                onClick={handleSyncData}
                disabled={isSyncing || (metaConnectionStatus !== "success" && googleConnectionStatus !== "success")}
                size="lg"
                className="w-full"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing Data...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
