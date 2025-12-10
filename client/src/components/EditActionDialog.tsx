import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

interface EditActionDialogProps {
  action: any;
  onSuccess?: () => void;
}

export function EditActionDialog({ action, onSuccess }: EditActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: action.category || "",
    description: action.description || "",
    adName: action.adName || "",
    campaignName: action.campaignName || "",
    adId: action.adId || "",
    campaignId: action.campaignId || "",
    scheduledFor: action.scheduledFor ? new Date(action.scheduledFor).toISOString().slice(0, 16) : "",
  });

  const utils = trpc.useUtils();
  const updateAction = trpc.diary.updateAction.useMutation({
    onSuccess: () => {
      toast.success("Action updated successfully");
      utils.diary.getEntries.invalidate();
      utils.diary.getActions.invalidate();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to update action: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.description) {
      toast.error("Category and description are required");
      return;
    }

    updateAction.mutate({
      actionId: action.id,
      category: formData.category,
      description: formData.description,
      adName: formData.adName || undefined,
      campaignName: formData.campaignName || undefined,
      adId: formData.adId || undefined,
      campaignId: formData.campaignId || undefined,
      scheduledFor: formData.scheduledFor || undefined,
    });
  };

  const categories = [
    "Ad Change",
    "Budget Adjustment",
    "Creative Swap",
    "Campaign Launch",
    "Campaign Pause",
    "Audience Update",
    "Bid Strategy Change",
    "Keap Email",
    "SMS Campaign",
    "Other",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="w-3 h-3 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Action</DialogTitle>
            <DialogDescription>
              Update action details for campaign management
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the action taken or planned..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            {/* Ad Name */}
            <div className="grid gap-2">
              <Label htmlFor="adName">Ad Name</Label>
              <Input
                id="adName"
                placeholder="e.g., 31DWC - VSL - Warm Audience"
                value={formData.adName}
                onChange={(e) => setFormData({ ...formData, adName: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Human-readable ad name for quick identification
              </p>
            </div>

            {/* Campaign Name */}
            <div className="grid gap-2">
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                placeholder="e.g., 31DWC2026 - Optin - Cold"
                value={formData.campaignName}
                onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Human-readable campaign name for quick identification
              </p>
            </div>

            {/* Ad ID (Optional) */}
            <div className="grid gap-2">
              <Label htmlFor="adId">Ad ID (Optional)</Label>
              <Input
                id="adId"
                placeholder="e.g., 123456789"
                value={formData.adId}
                onChange={(e) => setFormData({ ...formData, adId: e.target.value })}
              />
            </div>

            {/* Campaign ID (Optional) */}
            <div className="grid gap-2">
              <Label htmlFor="campaignId">Campaign ID (Optional)</Label>
              <Input
                id="campaignId"
                placeholder="e.g., 987654321"
                value={formData.campaignId}
                onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
              />
            </div>

            {/* Scheduled For (Optional) */}
            <div className="grid gap-2">
              <Label htmlFor="scheduledFor">Scheduled For (Optional)</Label>
              <Input
                id="scheduledFor"
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Set a future date/time if this is a scheduled task
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateAction.isPending}>
              {updateAction.isPending ? "Updating..." : "Update Action"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
