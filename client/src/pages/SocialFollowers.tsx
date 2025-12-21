import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Facebook, Instagram, Youtube } from "lucide-react";
import { toast } from "sonner";

/**
 * Social Media Followers Tracking
 * Manual entry form to track Facebook, Instagram, and YouTube followers by date
 */
export default function SocialFollowers() {
  const [date, setDate] = useState(() => {
    // Default to today in YYYY-MM-DD format
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [facebookFollowers, setFacebookFollowers] = useState("");
  const [instagramFollowers, setInstagramFollowers] = useState("");
  const [youtubeFollowers, setYoutubeFollowers] = useState("");
  const [comment, setComment] = useState("");

  // Fetch existing records
  const { data: records, isLoading, refetch } = trpc.socialMedia.list.useQuery();

  // Upsert mutation
  const upsertMutation = trpc.socialMedia.upsert.useMutation({
    onSuccess: () => {
      toast.success("Followers saved successfully!");
      refetch();
      // Reset form
      setFacebookFollowers("");
      setInstagramFollowers("");
      setYoutubeFollowers("");
      setComment("");
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = trpc.socialMedia.delete.useMutation({
    onSuccess: () => {
      toast.success("Record deleted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fb = parseInt(facebookFollowers, 10);
    const ig = parseInt(instagramFollowers, 10);
    const yt = parseInt(youtubeFollowers, 10);

    if (isNaN(fb) || isNaN(ig) || isNaN(yt)) {
      toast.error("Please enter valid numbers for all platforms");
      return;
    }

    upsertMutation.mutate({
      date,
      facebookFollowers: fb,
      instagramFollowers: ig,
      youtubeFollowers: yt,
      comment: comment.trim() || undefined,
    });
  };

  const handleDelete = (recordDate: string) => {
    if (confirm(`Delete followers record for ${recordDate}?`)) {
      deleteMutation.mutate({ date: recordDate });
    }
  };

  // Format number with commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container py-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Social Media Followers</h1>
          <p className="text-muted-foreground mt-1">
            Manually track follower counts across Facebook, Instagram, and YouTube
          </p>
        </div>

        {/* Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Followers Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date */}
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Followers Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="facebook" className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    Facebook Followers
                  </Label>
                  <Input
                    id="facebook"
                    type="number"
                    min="0"
                    value={facebookFollowers}
                    onChange={(e) => setFacebookFollowers(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    Instagram Followers
                  </Label>
                  <Input
                    id="instagram"
                    type="number"
                    min="0"
                    value={instagramFollowers}
                    onChange={(e) => setInstagramFollowers(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="youtube" className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-600" />
                    YouTube Subscribers
                  </Label>
                  <Input
                    id="youtube"
                    type="number"
                    min="0"
                    value={youtubeFollowers}
                    onChange={(e) => setYoutubeFollowers(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Comment */}
              <div>
                <Label htmlFor="comment">Notes (Optional)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Any notes about this data point..."
                  rows={2}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={upsertMutation.isPending}
                className="w-full md:w-auto"
              >
                {upsertMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Save Followers
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Followers History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !records || records.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No records yet. Add your first entry above!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-right font-semibold">
                        <div className="flex items-center justify-end gap-2">
                          <Facebook className="w-4 h-4 text-blue-600" />
                          Facebook
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        <div className="flex items-center justify-end gap-2">
                          <Instagram className="w-4 h-4 text-pink-600" />
                          Instagram
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        <div className="flex items-center justify-end gap-2">
                          <Youtube className="w-4 h-4 text-red-600" />
                          YouTube
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">Notes</th>
                      <th className="px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, idx) => (
                      <tr
                        key={record.date}
                        className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
                      >
                        <td className="px-4 py-3 font-medium">{record.date}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatNumber(record.facebookFollowers)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatNumber(record.instagramFollowers)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatNumber(record.youtubeFollowers)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-sm">
                          {record.comment || "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.date)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
