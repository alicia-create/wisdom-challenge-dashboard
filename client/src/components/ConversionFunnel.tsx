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
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap justify-center">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    <span className="text-green-600 font-semibold whitespace-nowrap">
                      {conversionRate?.toFixed(1)}% converted
                    </span>
                  </div>
                  {dropOffRate > 0 && (
                    <span className="text-red-600 whitespace-nowrap">
                      {dropOffRate.toFixed(1)}% dropped off
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Funnel stage */}
            <div className="relative">
              <div
                className={`${stage.color} rounded-lg p-3 sm:p-4 transition-all duration-500 ease-out`}
                style={{ width: `${Math.max(widthPercent, 30)}%`, marginLeft: 'auto', marginRight: 'auto' }}
              >
                <div className="flex items-center justify-between text-white gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                      {stage.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm sm:text-base truncate">{stage.name}</div>
                      <div className="text-xs sm:text-sm opacity-90">
                        {stage.count.toLocaleString()} users
                      </div>
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold flex-shrink-0">
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
