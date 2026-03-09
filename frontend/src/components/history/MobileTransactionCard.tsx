import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { Transaction } from "@/data/mock-data";

const typeColors: Record<string, string> = {
  reward: "border-accent/30 text-accent",
  stack: "border-primary/30 text-primary",
  unstack: "border-destructive/30 text-destructive",
  delegate: "border-success/30 text-success",
};

export function MobileTransactionCard({ transaction: t }: { transaction: Transaction }) {
  return (
    <div className="p-4 border-b border-border/30 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs capitalize ${typeColors[t.type] ?? ""}`}>
            {t.type}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${t.status === "confirmed" ? "border-success/30 text-success" : "border-warning/30 text-warning"}`}
          >
            {t.status}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{t.date}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-medium">{t.amount} {t.currency}</span>
        <span className="font-mono text-sm text-muted-foreground">${t.usdValue.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs text-muted-foreground font-mono">Cycle #{t.cycle}</span>
        <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
          {t.txId.slice(0, 10)}…
          <ExternalLink className="h-3 w-3 opacity-50" />
        </span>
      </div>
    </div>
  );
}
