import { invokeLLM } from "./_core/llm";
import type { AdRecommendation, FunnelLeak, FatigueAlert } from "./optimization-engine";

export interface DailyReportInsights {
  executive_summary: string;
  top_priorities: {
    rank: number;
    issue: string;
    impact: string;
    action: string;
    expected_result: string;
  }[];
  narrative: string;
  key_metrics_analysis: string;
  next_steps: string[];
}

export interface RecommendationExplanation {
  why_this_matters: string;
  root_cause_analysis: string;
  step_by_step_action: string[];
  expected_timeline: string;
  risk_if_ignored: string;
}

/**
 * Generate a comprehensive daily optimization report with LLM-powered insights
 */
export async function generateDailyReport(
  adRecommendations: AdRecommendation[],
  funnelLeaks: FunnelLeak[],
  creativeFatigue: FatigueAlert[],
  campaignMetrics: {
    total_spend: number;
    total_clicks: number;
    total_purchases: number;
    click_to_purchase_rate: number;
    avg_cpp: number;
    // Extended metrics (optional)
    total_leads?: number;
    total_revenue?: number;
    total_journals?: number;
    conversion_rate?: number;
    cpl?: number;
    roas?: number;
    aov?: number;
  }
): Promise<DailyReportInsights> {
  const criticalRecs = adRecommendations.filter((r) => r.severity === "critical");
  const warningRecs = adRecommendations.filter((r) => r.severity === "warning");

  // Build extended metrics section if available
  const extendedMetrics = campaignMetrics.total_leads ? `
- Total Leads: ${campaignMetrics.total_leads?.toLocaleString() || 0}
- Total Revenue: $${campaignMetrics.total_revenue?.toLocaleString() || 0}
- Journals Sold: ${campaignMetrics.total_journals || 0}
- Lead-to-Purchase Conversion: ${((campaignMetrics.conversion_rate || 0) * 100).toFixed(1)}%
- Cost Per Lead: $${(campaignMetrics.cpl || 0).toFixed(2)}
- ROAS: ${(campaignMetrics.roas || 0).toFixed(2)}x
- AOV: $${(campaignMetrics.aov || 0).toFixed(2)}` : '';

  const prompt = `You are a Facebook Ads optimization expert analyzing the 31DWC2026 campaign performance.

**Campaign Context:**
- Budget: $150K/day (Phase 2 scale period: Dec 26 - Jan 1)
- Strategy: Broad/Advantage+ Audiences, Creative-driven performance
- Primary Metric: Click-to-Purchase Rate (Target: 10%)
- Cost Per Purchase: Target $30-$60
- Journal Sales Goal: 20,000 units

**Current Performance (Last 7 Days):**
- Total Spend: $${campaignMetrics.total_spend.toLocaleString()}
- Total Clicks: ${campaignMetrics.total_clicks.toLocaleString()}
- Total Purchases: ${campaignMetrics.total_purchases}
- Click-to-Purchase Rate: ${(campaignMetrics.click_to_purchase_rate * 100).toFixed(1)}% (Target: 10%)
- Average CPP: $${campaignMetrics.avg_cpp.toFixed(2)} (Target: $30-$60)${extendedMetrics}

**Issues Detected:**
- Critical Actions: ${criticalRecs.length} ads need immediate disabling
- Performance Warnings: ${warningRecs.length} ads showing declining performance
- Funnel Leaks: ${funnelLeaks.length} leaks detected
- Creative Fatigue: ${creativeFatigue.length} creatives showing saturation

**Critical Recommendations:**
${criticalRecs.slice(0, 5).map((r, i) => `${i + 1}. ${r.title}\n   - ${r.description}\n   - Action: ${r.action_required}\n   - Impact: ${r.expected_impact}`).join("\n\n")}

**Funnel Leaks:**
${funnelLeaks.map((l, i) => `${i + 1}. ${l.title}\n   - ${l.description}\n   - Root Cause: ${l.root_cause}\n   - Action: ${l.action_required}`).join("\n\n")}

**Creative Fatigue Alerts:**
${creativeFatigue.slice(0, 3).map((f, i) => `${i + 1}. ${f.title}\n   - ${f.description}`).join("\n\n")}

**Your Task:**
Generate a comprehensive daily optimization report in JSON format with the following structure:

{
  "executive_summary": "2-3 sentence high-level summary of campaign health and most urgent action needed",
  "top_priorities": [
    {
      "rank": 1,
      "issue": "Specific issue name",
      "impact": "Business impact in dollars or percentage",
      "action": "Specific action to take",
      "expected_result": "Expected outcome with numbers"
    }
    // Top 3 priorities only
  ],
  "narrative": "3-4 paragraph analysis explaining: (1) What's working well, (2) What's not working and why, (3) How the issues are connected, (4) Strategic recommendations for the next 24-48 hours. Use specific numbers and be direct.",
  "key_metrics_analysis": "2-3 paragraph deep dive into Click-to-Purchase Rate and CPP trends. Explain whether the campaign is on track to hit targets and what needs to change.",
  "next_steps": [
    "Actionable step 1 with specific numbers/targets",
    "Actionable step 2 with specific numbers/targets",
    "Actionable step 3 with specific numbers/targets"
  ]
}

**Guidelines:**
- Be direct and actionable, not generic
- Use specific numbers from the data
- Prioritize by business impact (wasted spend, missed revenue)
- Explain WHY something is happening, not just WHAT
- Focus on the top 3 priorities - don't overwhelm with too many actions
- If Click-to-Purchase Rate is below 10%, make this the #1 priority
- If CPP is above $60, explain which part of the funnel is broken
- Connect the dots between funnel leaks and ad performance`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a Facebook Ads optimization expert. Always respond with valid JSON only, no markdown formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "daily_optimization_report",
          strict: true,
          schema: {
            type: "object",
            properties: {
              executive_summary: {
                type: "string",
                description: "2-3 sentence high-level summary",
              },
              top_priorities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    rank: { type: "number" },
                    issue: { type: "string" },
                    impact: { type: "string" },
                    action: { type: "string" },
                    expected_result: { type: "string" },
                  },
                  required: ["rank", "issue", "impact", "action", "expected_result"],
                  additionalProperties: false,
                },
              },
              narrative: {
                type: "string",
                description: "3-4 paragraph analysis",
              },
              key_metrics_analysis: {
                type: "string",
                description: "2-3 paragraph deep dive",
              },
              next_steps: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["executive_summary", "top_priorities", "narrative", "key_metrics_analysis", "next_steps"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No content in LLM response");
    }

    const insights: DailyReportInsights = JSON.parse(content);
    return insights;
  } catch (error) {
    console.error("[Optimization LLM] Error generating daily report:", error);
    // Return fallback insights if LLM fails
    return {
      executive_summary: "Unable to generate AI insights at this time. Please review the rule-based recommendations below.",
      top_priorities: [],
      narrative: "AI analysis temporarily unavailable. The rule-based optimization engine has identified the issues listed below.",
      key_metrics_analysis: `Current Click-to-Purchase Rate: ${(campaignMetrics.click_to_purchase_rate * 100).toFixed(1)}% (Target: 10%). Average CPP: $${campaignMetrics.avg_cpp.toFixed(2)} (Target: $30-$60).`,
      next_steps: [
        "Review critical recommendations and disable underperforming ads",
        "Investigate funnel leaks to identify conversion bottlenecks",
        "Monitor creative fatigue and prepare refresh if needed",
      ],
    };
  }
}

/**
 * Generate detailed explanation for a specific recommendation
 */
export async function explainRecommendation(
  recommendation: AdRecommendation
): Promise<RecommendationExplanation> {
  const prompt = `You are a Facebook Ads optimization expert. Explain this recommendation in detail:

**Recommendation:**
- Title: ${recommendation.title}
- Description: ${recommendation.description}
- Action Required: ${recommendation.action_required}
- Expected Impact: ${recommendation.expected_impact}

**Metadata:**
${JSON.stringify(recommendation.metadata, null, 2)}

**Your Task:**
Provide a detailed explanation in JSON format:

{
  "why_this_matters": "1-2 sentences explaining the business impact and urgency",
  "root_cause_analysis": "2-3 sentences explaining WHY this is happening (audience, creative, landing page, etc.)",
  "step_by_step_action": [
    "Step 1: Specific action",
    "Step 2: Specific action",
    "Step 3: Specific action"
  ],
  "expected_timeline": "How long until you see results (e.g., '24-48 hours', 'Immediate', '3-5 days')",
  "risk_if_ignored": "What happens if you don't take action (quantify in dollars if possible)"
}

**Guidelines:**
- Be specific and actionable
- Use numbers from the metadata
- Explain the "why" behind the recommendation
- Keep it concise but informative`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a Facebook Ads optimization expert. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "recommendation_explanation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              why_this_matters: { type: "string" },
              root_cause_analysis: { type: "string" },
              step_by_step_action: {
                type: "array",
                items: { type: "string" },
              },
              expected_timeline: { type: "string" },
              risk_if_ignored: { type: "string" },
            },
            required: ["why_this_matters", "root_cause_analysis", "step_by_step_action", "expected_timeline", "risk_if_ignored"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No content in LLM response");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("[Optimization LLM] Error explaining recommendation:", error);
    return {
      why_this_matters: "This recommendation helps optimize ad spend and improve campaign performance.",
      root_cause_analysis: "Analysis temporarily unavailable.",
      step_by_step_action: [recommendation.action_required],
      expected_timeline: "Varies",
      risk_if_ignored: "Continued wasted spend or missed opportunities.",
    };
  }
}

/**
 * Generate strategic insights for funnel leaks
 */
export async function explainFunnelLeak(leak: FunnelLeak): Promise<string> {
  const prompt = `You are a Facebook Ads optimization expert. Explain this funnel leak in 2-3 paragraphs:

**Funnel Leak:**
- Type: ${leak.type}
- Title: ${leak.title}
- Description: ${leak.description}
- Root Cause: ${leak.root_cause}
- Action Required: ${leak.action_required}

**Metrics:**
${JSON.stringify(leak.metrics, null, 2)}

**Your Task:**
Write 2-3 paragraphs explaining:
1. What this leak means for the business (impact in dollars or conversion rate)
2. Why this is happening (technical, creative, offer, or audience issue)
3. Specific steps to fix it (prioritized by impact)

Be direct, use numbers, and focus on actionable insights.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a Facebook Ads optimization expert. Provide clear, actionable explanations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === 'string') {
      return content;
    }
    return "Analysis temporarily unavailable.";
  } catch (error) {
    console.error("[Optimization LLM] Error explaining funnel leak:", error);
    return `${leak.description} ${leak.root_cause} ${leak.action_required}`;
  }
}
