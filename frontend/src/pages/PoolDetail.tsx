import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageTransition } from "@/components/PageTransition";
import { PageHeading } from "@/components/PageHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, CheckCircle, Copy, Wallet, ArrowLeft, Twitter, LogIn } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from "recharts";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { mockPools } from "@/data/mock-data";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";


export default function PoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const pool = mockPools.find((p) => p.id === id);
  const { isConnected, truncatedAddress, connect } = useWallet();
  const [showDelegationConfirm, setShowDelegationConfirm] = useState(false);

  if (!pool) {
    return (
      <AppLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4 font-display">Pool Not Found</h1>
          <p className="text-muted-foreground mb-6">The pool you're looking for doesn't exist.</p>
          <Button asChild variant="outline">
            <Link to="/pools"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Pools</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const chartData = pool.performanceHistory.map((apy, i) => ({ cycle: i + 1, apy }));
  const grossApy = pool.apy / (1 - pool.fee / 100);
  const feeDeduction = grossApy - pool.apy;

  const copyAddress = () => {
    navigator.clipboard.writeText(pool.address);
    toast.success("Address copied to clipboard");
  };

  return (
    <AppLayout>
      <PageTransition>
        <div className="container py-8 max-w-3xl space-y-6">
          <PageHeading
            title={pool.name}
            icon={pool.verified ? <CheckCircle className="h-5 w-5 text-success" /> : undefined}
            actions={
              <div className="flex items-center gap-2">
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
                {pool.twitter && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={pool.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                      <Twitter className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="icon" asChild>
                  <a href={pool.website} target="_blank" rel="noopener noreferrer" aria-label="Website">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            }
          />

          <p className="text-muted-foreground">{pool.description}</p>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Net APY", value: `${pool.apy}%` },
              { label: "Pool Fee", value: `${pool.fee}%` },
              { label: "Min Delegation", value: `${pool.minAmount.toLocaleString()} STX` },
              { label: "Total Stacked", value: `$${(pool.totalStacked * 1.82 / 1e6).toFixed(1)}M` },
              { label: "Delegators", value: pool.stackers.toLocaleString() },
              { label: "Payout", value: pool.payoutSchedule },
            ].map((m) => (
              <Card key={m.label} className="glass-card">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div className="text-lg font-semibold font-mono">{m.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* APY Chart */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium mb-4">APY History</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="poolPageGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis dataKey="cycle" tickFormatter={(v) => `C${v}`} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
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
                    <Area type="monotone" dataKey="apy" stroke="hsl(var(--primary))" fill="url(#poolPageGrad)" strokeWidth={2} activeDot={{ r: 5, strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Fee Structure */}
          <Card className="glass-card">
            <CardContent className="p-6 space-y-3">
              <h3 className="text-sm font-medium">Fee Structure</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gross APY</span>
                <span className="font-mono font-medium">{grossApy.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: "100%" }} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pool Fee ({pool.fee}%)</span>
                <span className="font-mono text-destructive">-{feeDeduction.toFixed(2)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-destructive/60" style={{ width: `${(feeDeduction / grossApy) * 100}%` }} />
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="font-medium">Net APY</span>
                <span className="font-mono font-bold text-success">{pool.apy}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Contract Address */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="text-xs text-muted-foreground mb-1">Contract Address</div>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono break-all flex-1">{pool.address}</code>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copyAddress}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Delegation Confirmation */}
          {showDelegationConfirm && (
            <Card className="glass-card border-primary/30">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-semibold">Confirm Delegation</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Wallet</span>
                    <span className="font-mono">{truncatedAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pool Address</span>
                    <span className="font-mono text-xs">{pool.address.slice(0, 12)}…</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Delegation</span>
                    <span className="font-mono">{pool.minAmount.toLocaleString()} STX</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 glow-primary"
                    onClick={() => {
                      setShowDelegationConfirm(false);
                      toast.success("Delegation submitted", { description: `Delegating to ${pool.name}. This is a simulated transaction.` });
                    }}
                  >
                    Confirm Delegation
                  </Button>
                  <Button variant="outline" onClick={() => setShowDelegationConfirm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA */}
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <span className="w-full">
                  {!isConnected ? (
                    <Button className="w-full gap-2" size="lg" onClick={() => connect()} disabled={pool.status !== "active"}>
                      <LogIn className="h-4 w-4" /> Connect Wallet to Delegate
                    </Button>
                  ) : (
                    <Button className="w-full gap-2 glow-primary" size="lg" disabled={pool.status !== "active"} onClick={() => setShowDelegationConfirm(true)}>
                      <Wallet className="h-4 w-4" /> Delegate to {pool.name}
                    </Button>
                  )}
                </span>
              </TooltipTrigger>
              {pool.status !== "active" && (
                <TooltipContent>
                  {pool.status === "full" ? "This pool is currently at capacity" : "This pool is winding down operations"}
                </TooltipContent>
              )}
            </UITooltip>
          </TooltipProvider>

        </div>
      </PageTransition>
    </AppLayout>
  );
}
