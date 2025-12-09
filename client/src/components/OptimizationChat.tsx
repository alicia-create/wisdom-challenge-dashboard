import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Streamdown } from "streamdown";

export default function OptimizationChat() {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ question: string; answer: any }>>([]);

  const chatMutation = trpc.optimization.chat.useMutation({
    onSuccess: (data) => {
      setChatHistory((prev) => [...prev, { question: data.question, answer: data.answer }]);
      setQuestion("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    chatMutation.mutate({ question: question.trim() });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Ask the Optimization Agent
        </CardTitle>
        <CardDescription>
          Ask specific questions about your campaign performance and get AI-powered insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {chatHistory.map((chat, index) => (
              <div key={index} className="space-y-2">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="font-medium text-sm">You:</p>
                  <p className="text-sm">{chat.question}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-medium text-sm mb-2">Agent:</p>
                  <Streamdown>{chat.answer}</Streamdown>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="e.g., Why is my CPP so high? Which ad should I pause?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={chatMutation.isPending}
          />
          <Button
            type="submit"
            disabled={chatMutation.isPending || !question.trim()}
          >
            {chatMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Example Questions */}
        {chatHistory.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Example questions:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Why is my CPP higher than target?",
                "Which campaigns should I scale?",
                "What's causing the funnel leak?",
                "Should I pause any ads?",
              ].map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestion(example)}
                  disabled={chatMutation.isPending}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
