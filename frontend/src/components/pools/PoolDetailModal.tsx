import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle, Copy, Wallet, FileText, ArrowRight } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from "recharts";
import type { Pool } from "@/data/mock-data";

interface Props {
  pool: Pool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PoolDetailModal({ pool, open, onOpenChange }: Props) {
  if (!pool) return null;

  const chartData = pool.performanceHistory.map((apy, i) => ({ cycle: i + 1, apy }));
  const grossApy = pool.apy / (1 - pool.fee / 100);
  const feeDeduction = grossApy - pool.apy;

  const copyAddress = () => {
    navigator.clipboard.writeText(pool.address);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl glass-card border-border/50 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            {pool.name}
            {pool.verified && <CheckCircle className="h-4 w-4 text-success" />}
            <Badge
              variant="outline"
              className={
                pool.status === "active" ? "border-success/30 text-success" :
                pool.status === "full" ? "border-warning/30 text-warning" :
                "border-destructive/30 text-destructive"
              }
            >
              {pool.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">{pool.description}</p>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="delegate" className="flex-1">How to Delegate</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-5 mt-4">
            {/* APY History Chart */}
            <div>
              <h4 className="text-sm font-medium mb-2">APY History</h4>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="poolApyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis
                      dataKey="cycle"
                      tickFormatter={(v) => `C${v}`}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: 12,
                        color: "hsl(var(--popover-foreground))",
                      }}
                      formatter={(value: number) => [`${value}%`, "APY"]}
                    />
                    <Area type="monotone" dataKey="apy" stroke="hsl(var(--primary))" fill="url(#poolApyGrad)" strokeWidth={2} activeDot={{ r: 5, strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Net APY", value: `${pool.apy}%` },
                { label: "Pool Fee", value: `${pool.fee}%` },
                { label: "Min Delegation", value: `${pool.minAmount.toLocaleString()} STX` },
                { label: "Total Stacked", value: `$${(pool.totalStacked * 1.82 / 1e6).toFixed(1)}M` },
                { label: "Delegators", value: pool.stackers.toLocaleString() },
                { label: "Payout", value: pool.payoutSchedule },
              ].map((m) => (
                <div key={m.label} className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div className="text-sm font-semibold font-mono">{m.value}</div>
                </div>
              ))}
            </div>

            {/* Fee Structure Breakdown */}
            <div>
              <h4 className="text-sm font-medium mb-3">Fee Structure</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gross APY</span>
                  <span className="font-mono font-medium">{grossApy.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pool Fee ({pool.fee}%)</span>
                  <span className="font-mono text-destructive">-{feeDeduction.toFixed(2)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-destructive/60"
                    style={{ width: `${(feeDeduction / grossApy) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-border">
                  <span className="font-medium">Net APY</span>
                  <span className="font-mono font-bold text-success">{pool.apy}%</span>
                </div>
              </div>
            </div>

            {/* Payout Schedule */}
            <div>
              <h4 className="text-sm font-medium mb-2">Payout Details</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground">Frequency</div>
                  <div className="text-sm font-semibold">{pool.payoutSchedule}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground">Reward</div>
                  <div className="text-sm font-semibold">BTC</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground">Next Payout</div>
                  <div className="text-sm font-semibold">~4 days</div>
                </div>
              </div>
            </div>

            {/* Contract Address */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">Contract Address</div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono truncate flex-1">{pool.address}</code>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyAddress}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Links */}
            <div className="flex gap-3">
              <Button className="flex-1 gap-2 glow-primary" disabled={pool.status !== "active"}>
                Delegate STX
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href={pool.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              {pool.twitter && (
                <Button variant="outline" size="icon" asChild>
                  <a href={pool.twitter} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="delegate" className="space-y-5 mt-4">
            <div>
              <h4 className="text-sm font-medium mb-4">Delegation Instructions</h4>
              <ol className="space-y-4">
                {[
                  { icon: Wallet, title: "Open your Stacks wallet", desc: "Use Leather, Xverse, or any compatible Stacks wallet." },
                  { icon: FileText, title: "Select \"Delegate\" or \"Stack\"", desc: "Navigate to the stacking section and choose delegation mode." },
                  { icon: Copy, title: "Enter the pool address", desc: pool.address },
                  { icon: ArrowRight, title: "Confirm the transaction", desc: `Minimum ${pool.minAmount.toLocaleString()} STX required. The pool fee of ${pool.fee}% is deducted from rewards automatically.` },
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <step.icon className="h-4 w-4 text-muted-foreground" />
                        {step.title}
                      </div>
                      {i === 2 ? (
                        <div className="mt-1 flex items-center gap-2 p-2 rounded-md bg-muted/50">
                          <code className="text-xs font-mono truncate flex-1">{step.desc}</code>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyAddress}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-4 rounded-lg border border-warning/30 bg-warning/5">
              <p className="text-sm text-warning font-medium">Important</p>
              <p className="text-xs text-muted-foreground mt-1">
                Once delegated, your STX will be locked for the duration of the stacking cycle (~2 weeks per cycle). 
                You can revoke delegation after the current cycle ends.
              </p>
            </div>

            <Button className="w-full gap-2 glow-primary" disabled={pool.status !== "active"}>
              <Wallet className="h-4 w-4" />
              Delegate to {pool.name}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
