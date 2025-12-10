import { ArrowDown, Users, ShoppingCart, Zap, MessageCircle, Bell } from "lucide-react";

interface FunnelStage {
  name: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

interface ConversionFunnelProps {
  data: {
    totalLeads: number;
    wisdomPurchases: number;
    kingdomSeekerTrials: number;
    manychatConnected: number;
    botAlertsSubscribed: number;
    leadToWisdomRate: number;
    wisdomToKingdomRate: number;
    kingdomToManychatRate: number;
    manychatToBotAlertsRate: number;
  };
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const stages: FunnelStage[] = [
    {
      name: "Leads",
      count: data.totalLeads,
      icon: <Users className="h-5 w-5" />,
      color: "bg-purple-500",
    },
    {
      name: "Wisdom+ Purchases",
      count: data.wisdomPurchases,
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "bg-blue-500",
    },
    {
      name: "Kingdom Seekers Trial",
      count: data.kingdomSeekerTrials,
      icon: <Zap className="h-5 w-5" />,
      color: "bg-indigo-500",
    },
    {
      name: "ManyChat Connected",
      count: data.manychatConnected,
      icon: <MessageCircle className="h-5 w-5" />,
      color: "bg-cyan-500",
    },
    {
      name: "Bot Alerts Subscribed",
      count: data.botAlertsSubscribed,
      icon: <Bell className="h-5 w-5" />,
      color: "bg-teal-500",
    },
  ];

  const conversionRates = [
    data.leadToWisdomRate,
    data.wisdomToKingdomRate,
    data.kingdomToManychatRate,
    data.manychatToBotAlertsRate,
  ];

  const maxCount = Math.max(...stages.map(s => s.count));

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const widthPercent = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
        const conversionRate = conversionRates[index - 1];
        const dropOffRate = conversionRate !== undefined ? 100 - conversionRate : 0;

        return (
          <div key={index}>
            {/* Conversion arrow between stages */}
            {index > 0 && (
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-semibold">
                      {conversionRate?.toFixed(1)}% converted
                    </span>
                  </div>
                  {dropOffRate > 0 && (
                    <span className="text-red-600">
                      {dropOffRate.toFixed(1)}% dropped off
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Funnel stage */}
            <div className="relative">
              <div
                className={`${stage.color} rounded-lg p-4 transition-all duration-500 ease-out`}
                style={{ width: `${Math.max(widthPercent, 20)}%`, marginLeft: 'auto', marginRight: 'auto' }}
              >
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      {stage.icon}
                    </div>
                    <div>
                      <div className="font-semibold">{stage.name}</div>
                      <div className="text-sm opacity-90">
                        {stage.count.toLocaleString()} users
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">
                    {stage.count.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
