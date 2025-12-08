import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, BookOpen, Target, TrendingUp, BarChart3 } from "lucide-react";

export default function Documentation() {
  const documents = [
    {
      title: "Campaign Optimization Agent - PRD",
      description: "Complete Product Requirements Document for the AI-powered optimization agent. Includes functional requirements, technical architecture, and implementation phases.",
      icon: Target,
      file: "/docs/PRD-Campaign-Optimization-Agent.md",
      size: "29 KB",
      category: "Product",
    },
    {
      title: "Optimization Rules v2",
      description: "Detailed optimization rules with thresholds, funnel leak detection, and diagnostic priorities. Updated with approved targets (Click-to-Purchase 10%, CPP $30-$60).",
      icon: TrendingUp,
      file: "/docs/optimization-rules-v2.md",
      size: "14 KB",
      category: "Strategy",
    },

    {
      title: "Google Analytics 4 API Research",
      description: "Comprehensive guide to GA4 Data API for landing page metrics. Includes available metrics, dimensions, authentication, and example queries.",
      icon: BookOpen,
      file: "/docs/google-analytics-api-research.md",
      size: "7 KB",
      category: "Technical",
    },
  ];

  const handleDownload = (file: string, title: string) => {
    const link = document.createElement("a");
    link.href = file;
    link.download = file.split("/").pop() || "document.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Documentation</h1>
          <p className="text-muted-foreground">
            Product requirements, optimization strategies, and technical integration guides for the 31DWC 2025 campaign.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {documents.map((doc) => {
            const Icon = doc.icon;
            return (
              <Card key={doc.file} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg mb-1">{doc.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="px-2 py-0.5 bg-secondary rounded-md">{doc.category}</span>
                          <span>•</span>
                          <span>{doc.size}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-3">{doc.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownload(doc.file, doc.title)}
                      className="flex-1"
                      variant="default"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={() => window.open(doc.file, "_blank")}
                      variant="outline"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Campaign Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold mb-1">Campaign</p>
                <p className="text-muted-foreground">31DWC 2025 (31-Day Wisdom Challenge)</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Total Budget</p>
                <p className="text-muted-foreground">$1.2M (Dec 15 - Jan 1)</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Phase 1</p>
                <p className="text-muted-foreground">Dec 15-25: $150K total (~$13K/day) - Build baseline</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Phase 2</p>
                <p className="text-muted-foreground">Dec 26-Jan 1: $150K/day ($1.05M total) - Scale</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Primary Metrics</p>
                <p className="text-muted-foreground">Click-to-Purchase Rate: 10% | CPP: $30-$60</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Strategy</p>
                <p className="text-muted-foreground">Broad/Advantage+ Audiences, Creative-driven performance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
