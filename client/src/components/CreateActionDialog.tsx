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
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface CreateActionDialogProps {
  defaultDate?: string;
  onSuccess?: () => void;
}

export function CreateActionDialog({ defaultDate, onSuccess }: CreateActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: defaultDate || new Date().toISOString().split("T")[0],
    category: "",
    description: "",
    adId: "",
    campaignId: "",
    scheduledFor: "",
  });

  const utils = trpc.useUtils();
  const createAction = trpc.diary.createAction.useMutation({
    onSuccess: () => {
      toast.success("Action created successfully");
      utils.diary.getEntries.invalidate();
      utils.diary.getActions.invalidate();
      setOpen(false);
      setFormData({
        date: defaultDate || new Date().toISOString().split("T")[0],
        category: "",
        description: "",
        adId: "",
        campaignId: "",
        scheduledFor: "",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to create action: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.description) {
      toast.error("Category and description are required");
      return;
    }

    createAction.mutate({
      date: formData.date,
      category: formData.category,
      description: formData.description,
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
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Action
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Action</DialogTitle>
            <DialogDescription>
              Log a manual action or task for campaign management
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Date */}
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

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
            <Button type="submit" disabled={createAction.isPending}>
              {createAction.isPending ? "Creating..." : "Create Action"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
