import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Mail, Trash2, XCircle, CheckCircle, Clock } from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function Invites() {
  const [email, setEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);

  const { data: invites, isLoading, refetch } = trpc.invites.list.useQuery();
  const createInvite = trpc.invites.create.useMutation({
    onSuccess: (data) => {
      toast.success("Invite created successfully!");
      // Copy invite URL to clipboard
      navigator.clipboard.writeText(data.inviteUrl);
      toast.info("Invite URL copied to clipboard");
      setEmail("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create invite: ${error.message}`);
    },
  });

  const revokeInvite = trpc.invites.revoke.useMutation({
    onSuccess: () => {
      toast.success("Invite revoked");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to revoke invite: ${error.message}`);
    },
  });

  const deleteInvite = trpc.invites.delete.useMutation({
    onSuccess: () => {
      toast.success("Invite deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete invite: ${error.message}`);
    },
  });

  const handleCreateInvite = () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    createInvite.mutate({ email, expiresInDays });
  };

  const copyInviteUrl = (token: string) => {
    const inviteUrl = `${import.meta.env.VITE_OAUTH_PORTAL_URL || "https://login.manus.im"}?invite=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite URL copied to clipboard");
  };

  const getInviteStatus = (invite: any) => {
    if (invite.revokedAt) {
      return { label: "Revoked", variant: "destructive" as const, icon: XCircle };
    }
    if (invite.usedAt) {
      return { label: "Used", variant: "secondary" as const, icon: CheckCircle };
    }
    if (new Date(invite.expiresAt) < new Date()) {
      return { label: "Expired", variant: "outline" as const, icon: Clock };
    }
    return { label: "Active", variant: "default" as const, icon: Mail };
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Invite Management</h1>
          <p className="text-muted-foreground">
            Generate invite links for users outside @pedroadao.com domain
          </p>
        </div>

        {/* Create Invite Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Invite</CardTitle>
            <CardDescription>
              Generate an invite link for a specific email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateInvite();
                    }
                  }}
                />
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 7)}
                  placeholder="Days"
                />
              </div>
              <Button
                onClick={handleCreateInvite}
                disabled={createInvite.isPending}
              >
                {createInvite.isPending ? "Creating..." : "Create Invite"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Invite will expire in {expiresInDays} day{expiresInDays !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {/* Invites List */}
        <Card>
          <CardHeader>
            <CardTitle>All Invites</CardTitle>
            <CardDescription>
              Manage existing invites
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading invites...</p>
            ) : !invites || invites.length === 0 ? (
              <p className="text-muted-foreground">No invites created yet</p>
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => {
                  const status = getInviteStatus(invite);
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{invite.email}</span>
                          <Badge variant={status.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <p>Created by {invite.createdBy} on {new Date(invite.createdAt).toLocaleDateString()}</p>
                          <p>Expires: {new Date(invite.expiresAt).toLocaleDateString()}</p>
                          {invite.usedAt && (
                            <p className="text-green-600">Used on {new Date(invite.usedAt).toLocaleDateString()}</p>
                          )}
                          {invite.revokedAt && (
                            <p className="text-destructive">Revoked on {new Date(invite.revokedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!invite.usedAt && !invite.revokedAt && new Date(invite.expiresAt) > new Date() && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyInviteUrl(invite.token)}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy Link
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => revokeInvite.mutate({ inviteId: invite.id })}
                              disabled={revokeInvite.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Revoke
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInvite.mutate({ inviteId: invite.id })}
                          disabled={deleteInvite.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
