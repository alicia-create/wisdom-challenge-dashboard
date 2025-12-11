import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, RefreshCw, Link as LinkIcon, LogOut } from "lucide-react";

export default function APIConnections() {
  const [location] = useLocation();
  const [syncStartDate, setSyncStartDate] = useState("");
  const [syncEndDate, setSyncEndDate] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Get connection status
  const { data: connectionStatus, refetch: refetchStatus } = trpc.oauth.getConnectionStatus.useQuery();

  // Get OAuth URLs
  const { data: metaAuthUrl } = trpc.oauth.getMetaAuthUrl.useQuery();
  const { data: googleAuthUrl } = trpc.oauth.getGoogleAuthUrl.useQuery();

  // Handle OAuth callbacks
  const handleMetaCallback = trpc.oauth.handleMetaCallback.useMutation({
    onSuccess: (result: any) => {
      toast.success(`Connected to Meta Ads: ${result.accountName}`);
      refetchStatus();
    },
    onError: (error: any) => {
      toast.error(`Meta connection failed: ${error.message}`);
    },
  });

  const handleGoogleCallback = trpc.oauth.handleGoogleCallback.useMutation({
    onSuccess: () => {
      toast.success("Connected to Google Ads successfully!");
      refetchStatus();
    },
    onError: (error: any) => {
      toast.error(`Google connection failed: ${error.message}`);
    },
  });

  // Disconnect mutation
  const disconnectMutation = trpc.oauth.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Disconnected successfully");
      refetchStatus();
    },
    onError: (error: any) => {
      toast.error(`Disconnect failed: ${error.message}`);
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

  // Handle success/error messages from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success === 'meta_connected') {
      toast.success('Successfully connected to Meta Ads!');
      refetchStatus();
      window.history.replaceState({}, '', '/api-connections');
    } else if (success === 'google_connected') {
      toast.success('Successfully connected to Google Ads!');
      refetchStatus();
      window.history.replaceState({}, '', '/api-connections');
    } else if (error) {
      toast.error(`Connection failed: ${decodeURIComponent(error)}`);
      window.history.replaceState({}, '', '/api-connections');
    }
  }, [location]);

  const handleConnectMeta = () => {
    if (metaAuthUrl?.url) {
      window.location.href = metaAuthUrl.url;
    }
  };

  const handleConnectGoogle = () => {
    if (googleAuthUrl?.url) {
      window.location.href = googleAuthUrl.url;
    }
  };

  const handleDisconnect = (platform: 'meta' | 'google') => {
    disconnectMutation.mutate({ platform });
  };

  const handleSyncData = () => {
    if (!syncStartDate || !syncEndDate) {
      toast.error("Please select start and end dates for sync");
      return;
    }

    if (!connectionStatus?.meta.connected && !connectionStatus?.google.connected) {
      toast.error("Please connect at least one API first");
      return;
    }

    setIsSyncing(true);
    syncAdData.mutate({
      startDate: syncStartDate,
      endDate: syncEndDate,
      // Backend will use stored tokens from database
    });
  };

  const getStatusBadge = (connected: boolean, accountName?: string | null) => {
    if (connected) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Connected {accountName && `- ${accountName}`}
        </Badge>
      );
    }
    return <Badge variant="outline">Not Connected</Badge>;
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
            Connect Meta and Google Ads APIs using OAuth 2.0 to sync campaign data
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
                {getStatusBadge(connectionStatus?.meta.connected || false, connectionStatus?.meta.accountName)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionStatus?.meta.connected ? (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Connected Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Ad Account: {connectionStatus.meta.adAccountId}
                    </p>
                    {connectionStatus.meta.expiresAt && (
                      <p className="text-sm text-muted-foreground">
                        Expires: {new Date(connectionStatus.meta.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => handleDisconnect('meta')}
                    disabled={disconnectMutation.isPending}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">How it works:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Click "Connect with Facebook" below</li>
                      <li>• Authorize access to your Meta Ads account</li>
                      <li>• We'll securely store your access token</li>
                      <li>• Sync campaign data automatically</li>
                    </ul>
                  </div>
                  <Button
                    onClick={handleConnectMeta}
                    disabled={!metaAuthUrl}
                    className="w-full"
                  >
                    {handleMetaCallback.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Connect with Facebook
                      </>
                    )}
                  </Button>
                </div>
              )}
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
                {getStatusBadge(connectionStatus?.google.connected || false)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionStatus?.google.connected ? (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Connected Account</h4>
                    {connectionStatus.google.expiresAt && (
                      <p className="text-sm text-muted-foreground">
                        Expires: {new Date(connectionStatus.google.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => handleDisconnect('google')}
                    disabled={disconnectMutation.isPending}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">How it works:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Click "Connect with Google" below</li>
                      <li>• Authorize access to your Google Ads account</li>
                      <li>• We'll securely store your access token</li>
                      <li>• Sync campaign data automatically</li>
                    </ul>
                  </div>
                  <Button
                    onClick={handleConnectGoogle}
                    disabled={!googleAuthUrl}
                    className="w-full"
                  >
                    {handleGoogleCallback.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Connect with Google
                      </>
                    )}
                  </Button>
                </div>
              )}
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
                disabled={isSyncing || (!connectionStatus?.meta.connected && !connectionStatus?.google.connected)}
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
