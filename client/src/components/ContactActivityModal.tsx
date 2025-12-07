import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface ContactActivityModalProps {
  contactId: number | null;
  contactEmail?: string;
  onClose: () => void;
}

export function ContactActivityModal({ contactId, contactEmail, onClose }: ContactActivityModalProps) {
  const { data: activities, isLoading } = trpc.debug.contactActivities.useQuery(
    { contactId: contactId! },
    { enabled: !!contactId }
  );

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      lead: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      purchase: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      action: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      analytics: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    };
    return colors[type] || colors.analytics;
  };

  const getEventIcon = (name: string) => {
    const icons: Record<string, string> = {
      lead_acquired: "👤",
      purchase_completed: "💰",
      order_completed: "🛒",
      form_submission: "📝",
      "form_submission.created": "📝",
      event_attendance: "📅",
      "attendee.checked_in": "✅",
      "attendee.created": "➕",
      utm_tracked: "🔗",
      calendar_booked: "📆",
      Manychat: "💬",
      manychat: "💬",
      Obvio: "🎫",
      two: "2️⃣",
      ShipStation: "📦",
      ShippingStation: "📦",
      livechat_url: "💬",
      "subscription.trial_started": "🎁",
      "subscription.trial_ended": "⏰",
      "Contact Update from Zapier": "⚡",
    };
    return icons[name] || "📊";
  };

  return (
    <Dialog open={!!contactId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[85vh] sm:max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Contact Activity Timeline</DialogTitle>
          <DialogDescription>
            {contactEmail && `All events for ${contactEmail}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No activities found for this contact
          </div>
        ) : (
          <ScrollArea className="h-[400px] sm:h-[500px] pr-2 sm:pr-4">
            <div className="space-y-4">
              {activities.map((activity: any) => (
                <div
                  key={activity.id}
                  className="border rounded-lg p-3 sm:p-4 hover:bg-accent/50 transition-colors"
                >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 w-full">
                      <div className="text-2xl mt-1">{getEventIcon(activity.name)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{activity.name}</h4>
                          <Badge variant="outline" className={`text-xs ${getEventTypeColor(activity.type)}`}>
                            {activity.type}
                          </Badge>
                        </div>
                        {activity.comment && (
                          <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                            {activity.comment}
                          </p>
                        )}
                        {activity.value && (
                          <div className="text-xs font-mono bg-muted px-2 py-1 rounded inline-block">
                            {activity.value.length > 100 
                              ? activity.value.substring(0, 100) + '...' 
                              : activity.value}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap self-start sm:self-auto">
                      {new Date(activity.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {activities && activities.length > 0 && (
          <div className="border-t pt-4 text-sm text-muted-foreground">
            Total: {activities.length} events
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
