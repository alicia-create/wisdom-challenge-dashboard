import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BookPlus } from "lucide-react";
import { toast } from "sonner";

interface AddToDiaryButtonProps {
  recommendation: {
    title: string;
    description: string;
    action_required: string;
    severity: string;
    ad_id?: string;
    adset_id?: string;
    campaign_id?: string;
  };
}

/**
 * Map LLM recommendation to diary action category
 */
function mapRecommendationToCategory(recommendation: AddToDiaryButtonProps["recommendation"]): string {
  const text = `${recommendation.title} ${recommendation.description} ${recommendation.action_required}`.toLowerCase();
  
  if (text.includes("pause") || text.includes("disable") || text.includes("stop")) {
    return "ad_change";
  }
  if (text.includes("budget") || text.includes("spend") || text.includes("bid")) {
    return "budget_adjustment";
  }
  if (text.includes("creative") || text.includes("copy") || text.includes("image") || text.includes("video")) {
    return "creative_swap";
  }
  if (text.includes("audience") || text.includes("targeting")) {
    return "audience_change";
  }
  if (text.includes("placement")) {
    return "placement_optimization";
  }
  if (text.includes("schedule") || text.includes("timing")) {
    return "schedule_adjustment";
  }
  
  // Default to ad_change for critical severity, optimization for others
  return recommendation.severity === "critical" ? "ad_change" : "optimization";
}

export function AddToDiaryButton({ recommendation }: AddToDiaryButtonProps) {
  const utils = trpc.useUtils();
  const createAction = trpc.diary.createAction.useMutation({
    onSuccess: () => {
      toast.success("Added to Ads Diary", {
        description: "Recommendation saved as pending task",
      });
      utils.diary.getEntries.invalidate();
      utils.diary.getActions.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to add to diary", {
        description: error.message,
      });
    },
  });

  const handleClick = () => {
    const category = mapRecommendationToCategory(recommendation);
    const description = `**${recommendation.title}**\n\n${recommendation.description}\n\n**Action Required:** ${recommendation.action_required}`;
    
    createAction.mutate({
      category,
      description,
      status: "pending",
      source: "llm_suggestion",
      adId: recommendation.ad_id || undefined,
      adName: undefined, // TODO: Extract from recommendation if available
      campaignId: recommendation.campaign_id || undefined,
      campaignName: undefined, // TODO: Extract from recommendation if available
    });
  };

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={handleClick}
      disabled={createAction.isPending}
    >
      <BookPlus className="h-3 w-3 mr-1" />
      {createAction.isPending ? "Adding..." : "Add to Diary"}
    </Button>
  );
}
