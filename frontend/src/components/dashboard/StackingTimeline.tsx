import { Bitcoin, Lock, Unlock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TimelineEvent {
  cycle: number;
  type: "reward" | "lock" | "unlock" | "delegate";
  label: string;
  date: string;
  isCurrent?: boolean;
  isFuture?: boolean;
}

const iconMap = {
  reward: Bitcoin,
  lock: Lock,
  unlock: Unlock,
  delegate: Users,
};

const colorMap = {
  reward: "bg-accent/20 text-accent border-accent/30",
  lock: "bg-primary/20 text-primary border-primary/30",
  unlock: "bg-success/20 text-success border-success/30",
  delegate: "bg-primary/20 text-primary border-primary/30",
};

const mockTimeline: TimelineEvent[] = [
  { cycle: 89, type: "delegate", label: "Delegated 100k STX", date: "Dec 14" },
  { cycle: 89, type: "lock", label: "Stacking started", date: "Dec 15" },
  { cycle: 90, type: "reward", label: "0.0082 BTC", date: "Jan 28" },
  { cycle: 91, type: "reward", label: "0.0089 BTC", date: "Feb 28" },
  { cycle: 92, type: "reward", label: "0.0091 BTC", date: "Mar 2", isCurrent: true },
  { cycle: 93, type: "reward", label: "~0.009 BTC", date: "~Mar 16", isFuture: true },
  { cycle: 95, type: "unlock", label: "STX unlocks", date: "~Apr 26", isFuture: true },
];

export function StackingTimeline() {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Stacking Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Horizontal scroll container */}
          <div className="overflow-x-auto pb-2">
            <div className="flex items-start gap-0 min-w-max">
              {mockTimeline.map((event, i) => {
                const Icon = iconMap[event.type];
                return (
                  <div key={i} className="flex flex-col items-center relative" style={{ minWidth: 120 }}>
                    {/* Connector line */}
                    {i > 0 && (
                      <div
                        className={`absolute top-4 right-1/2 h-0.5 ${
                          event.isFuture ? "bg-border border-dashed" : "bg-primary/40"
                        }`}
                        style={{ width: "100%", transform: "translateX(-50%)" }}
                      />
                    )}
                    {/* Node */}
                    <div
                      className={`relative z-10 h-8 w-8 rounded-full border-2 flex items-center justify-center ${
                        event.isCurrent
                          ? "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20"
                          : event.isFuture
                          ? "bg-muted border-border text-muted-foreground"
                          : colorMap[event.type]
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    {/* Label */}
                    <div className="mt-2 text-center px-2">
                      <div className="text-xs font-medium">
                        {event.isCurrent && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 mb-1 border-primary/30 text-primary">
                            Now
                          </Badge>
                        )}
                      </div>
                      <div className={`text-xs font-mono ${event.isFuture ? "text-muted-foreground" : "text-foreground"}`}>
                        {event.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Cycle {event.cycle} • {event.date}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
