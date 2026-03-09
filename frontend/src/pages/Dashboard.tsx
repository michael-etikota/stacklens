import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PageHeading } from "@/components/PageHeading";
import { ShimmerSkeleton } from "@/components/ShimmerSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { useCountUp } from "@/hooks/use-count-up";
import { TrendingUp, TrendingDown, Coins, Lock, Bitcoin, Activity, Wallet, Clock, Calculator, ArrowRight, Rocket, Globe, BarChart3 } from "lucide-react";
import { NotConnectedIllustration, NotStackingIllustration } from "@/components/dashboard/EmptyStateIllustration";
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar } from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWallet } from "@/contexts/WalletContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTourAutoStart } from "@/contexts/TourContext";
import { ErrorState } from "@/components/ErrorState";
import { StackingTimeline } from "@/components/dashboard/StackingTimeline";
import { mockYieldHistory, calculateRewards } from "@/data/mock-data";
import {
  useStackingStats,
  useNetworkStats,
  useYieldHistory,
  useStackingPosition,
  useCycleProgress,
  useRecentActivity,
} from "@/hooks/use-stacking-data";


const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className={className} aria-hidden="true">
      <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetricCard({
  title, value, subtitle, icon: Icon, trend, loading, sparkline,
}: {
  title: string; value: string; subtitle?: string; icon: React.ElementType; trend?: number; loading?: boolean; sparkline?: number[];
}) {
  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <ShimmerSkeleton className="h-4 w-24 mb-3" />
          <ShimmerSkeleton className="h-8 w-32 mb-2" />
          <ShimmerSkeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="glass-card hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200" role="region" aria-label={title}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="text-2xl font-bold font-mono">{value}</div>
          {sparkline && <Sparkline data={sparkline} className="opacity-60" />}
        </div>
        {(subtitle || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {trend !== undefined && (
              <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? "text-success" : "text-destructive"}`}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend)}%
              </span>
            )}
            {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RewardProjection({ amountStacked, cyclesRemaining, startCycle, apy }: {
  amountStacked: number; cyclesRemaining: number; startCycle: number; apy: number;
}) {
  const rewards = calculateRewards(amountStacked, cyclesRemaining, "pool", 5);
  const barData = rewards.projections.map((p, i) => ({
    cycle: `C${startCycle + i + 1}`,
    btc: p.cumulativeBtc - (i > 0 ? rewards.projections[i - 1].cumulativeBtc : 0),
  }));

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Reward Projection ({cyclesRemaining} cycles left)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1 space-y-1">
            <div className="text-sm text-muted-foreground">Projected Total</div>
            <div className="text-2xl font-bold font-mono text-accent">{rewards.totalBtc.toFixed(6)} BTC</div>
            <div className="text-sm text-muted-foreground">≈ ${rewards.totalUsd.toLocaleString()} USD</div>
          </div>
          <div className="flex-1 h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <Bar dataKey="btc" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                <XAxis dataKey="cycle" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: 12,
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(v: number) => [`${v.toFixed(6)} BTC`, "Per Cycle"]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const apySparkline = mockYieldHistory.map((h) => h.apy);
const btcSparkline = mockYieldHistory.map((h) => h.btcReward);

function DashboardMetrics({ loading, stats }: { loading: boolean; stats: any }) {
  const balance = useCountUp(stats?.stxBalance ?? 0, 1200, 0);
  const stacked = useCountUp(stats?.currentlyStacked ?? 0, 1200, 0);
  const apy = useCountUp(stats?.currentAPY ?? 0, 1200, 1);
  const btc = useCountUp(stats?.cumulativeBtcRewards ?? 0, 1200, 4);
  const usdBalance = (stats?.stxBalance ?? 0) * (stats?.stxUsdPrice ?? 0);
  const usdBtc = (stats?.cumulativeBtcRewards ?? 0) * (stats?.btcUsdPrice ?? 0);

  return (
    <div data-tour="metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="STX Balance"
        value={loading ? "" : `${balance.toLocaleString()} STX`}
        subtitle={`≈ $${loading ? "..." : usdBalance.toLocaleString()}`}
        icon={Coins}
        loading={loading}
      />
      <MetricCard
        title="Currently Stacked"
        value={loading ? "" : `${stacked.toLocaleString()} STX`}
        icon={Lock}
        loading={loading}
      />
      <MetricCard
        title="Current APY"
        value={loading ? "" : `${apy}%`}
        trend={stats?.apyChange}
        icon={TrendingUp}
        loading={loading}
        sparkline={apySparkline}
      />
      <MetricCard
        title="BTC Rewards"
        value={loading ? "" : `${btc} BTC`}
        subtitle={`≈ $${loading ? "..." : usdBtc.toLocaleString()}`}
        icon={Bitcoin}
        loading={loading}
        sparkline={btcSparkline}
      />
    </div>
  );
}

function NotStackingYet() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <NotStackingIllustration className="mb-6" />
      <h2 className="text-2xl font-bold mb-3 font-display">You're Not Stacking Yet</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Start earning BTC rewards by stacking your STX. Use our simulator to model potential returns before committing.
      </p>
      <Button asChild size="lg" className="gap-2 glow-primary">
        <Link to="/simulator">
          <Calculator className="h-4 w-4" /> Simulate Your First Stack <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </motion.div>
  );
}

function NotConnectedState() {
  const { connect } = useWallet();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <NotConnectedIllustration className="mb-6" />
      <h2 className="text-2xl font-bold mb-3 font-display">Connect Your Wallet</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Connect your Stacks wallet to view your stacking analytics, rewards, and positions.
      </p>
      <Button size="lg" onClick={() => connect()} className="gap-2 glow-primary">
        <Wallet className="h-4 w-4" /> Connect Wallet
      </Button>
    </div>
  );
}

export default function DashboardPage() {
  const { isConnected } = useWallet();
  const isMobile = useIsMobile();
  const tryAutoStart = useTourAutoStart(isConnected);
  const networkStats = useNetworkStats();
  const stats = useStackingStats(isConnected);
  const yieldHistory = useYieldHistory(isConnected);
  const position = useStackingPosition(isConnected);
  const cycle = useCycleProgress(isConnected);
  const activity = useRecentActivity(isConnected);
  const [timeRange, setTimeRange] = useState("all");
  const [chartMetric, setChartMetric] = useState<"apy" | "btcReward" | "usdValue">("apy");
  const loading = !isConnected ? false : stats.isLoading;

  const filteredYieldData = useMemo(() => {
    const data = yieldHistory.data;
    if (!data) return [];
    const sliceMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
    const count = sliceMap[timeRange];
    return count ? data.slice(-count) : data;
  }, [yieldHistory.data, timeRange]);

  const metricConfig = {
    apy: { unit: "%", name: "Your APY", format: (v: number) => `${v.toFixed(1)}%` },
    btcReward: { unit: " BTC", name: "BTC Earned", format: (v: number) => `${v.toFixed(4)} BTC` },
    usdValue: { unit: "", name: "USD Value", format: (v: number) => `$${v.toLocaleString()}` },
  };

  if (!isConnected) {
    return <AppLayout><NotConnectedState /></AppLayout>;
  }

  const isNotStacking = !loading && stats.data && stats.data.currentlyStacked === 0;

  if (stats.isError) {
    return (
      <AppLayout>
        <div className="container py-8">
          <ErrorState message="Failed to load stacking data." onRetry={() => stats.refetch()} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageTransition>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <PageHeading title="Dashboard" description="Your stacking overview and performance" />
        {/* Auto-start tour for first-time users */}
        <span ref={(el) => { if (el) tryAutoStart(); }} className="hidden" />

        {/* Metric Cards */}
        <DashboardMetrics loading={loading} stats={stats.data} />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Yield Chart */}
          <Card data-tour="yield-chart" className="glass-card lg:col-span-2">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">Yield Performance</CardTitle>
                <ToggleGroup type="single" value={chartMetric} onValueChange={(v) => v && setChartMetric(v as typeof chartMetric)} size="sm" className="bg-muted/50 rounded-md p-0.5">
                  <ToggleGroupItem value="apy" className="text-xs h-6 px-2.5 rounded-sm data-[state=on]:bg-background data-[state=on]:shadow-sm">APY</ToggleGroupItem>
                  <ToggleGroupItem value="btcReward" className="text-xs h-6 px-2.5 rounded-sm data-[state=on]:bg-background data-[state=on]:shadow-sm">BTC</ToggleGroupItem>
                  <ToggleGroupItem value="usdValue" className="text-xs h-6 px-2.5 rounded-sm data-[state=on]:bg-background data-[state=on]:shadow-sm">USD</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="flex flex-wrap gap-1">
                {["7d", "30d", "90d", "all"].map((r) => (
                  <Button
                    key={r}
                    variant={timeRange === r ? "default" : "ghost"}
                    size="sm"
                    className="text-xs h-7 px-3"
                    onClick={() => setTimeRange(r)}
                  >
                    {r.toUpperCase()}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {yieldHistory.isLoading ? (
                <ShimmerSkeleton className="h-64 w-full" />
              ) : (
                <>
                <AnimatePresence mode="wait">
                <motion.div
                  key={`${chartMetric}-${timeRange}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  role="img"
                  aria-label={`Yield performance chart showing ${metricConfig[chartMetric].name} over time`}
                >
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={filteredYieldData} margin={{ right: 60 }}>
                    <defs>
                      <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v: string) => {
                      if (timeRange === "7d" || timeRange === "30d") return v.slice(5);
                      return v.slice(0, 7);
                    }} interval={timeRange === "7d" ? 0 : timeRange === "30d" ? 4 : "preserveStartEnd"} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} unit={metricConfig[chartMetric].unit} />
                    <Tooltip
                      cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        fontSize: 13,
                        color: "hsl(var(--popover-foreground))",
                      }}
                      formatter={(value: number) => [metricConfig[chartMetric].format(value), metricConfig[chartMetric].name]}
                    />
                    <Area type="monotone" dataKey={chartMetric} stroke="hsl(var(--primary))" fill="url(#metricGrad)" strokeWidth={2} activeDot={{ r: 5, strokeWidth: 2 }} name={metricConfig[chartMetric].name} />
                    {chartMetric === "apy" && !isNotStacking && (
                      <Line type="monotone" dataKey="networkApy" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="6 4" dot={false} activeDot={false} name="Network Avg" />
                    )}
                    {chartMetric === "apy" && isNotStacking && (
                      <ReferenceLine
                        y={networkStats.data?.averageAPY ?? 9.2}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="6 4"
                        strokeWidth={1.5}
                        label={{ value: `Avg ${networkStats.data?.averageAPY ?? 9.2}%`, position: "insideTopRight", fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
                </motion.div>
                </AnimatePresence>
                {/* Network context stats */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    <span>Network Avg APY:</span>
                    <span className="font-mono font-medium text-foreground">{networkStats.data?.averageAPY ?? "—"}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>Total Locked:</span>
                    <span className="font-mono font-medium text-foreground">
                      {networkStats.data ? `${(networkStats.data.totalStacked / 1_000_000_000).toFixed(2)}B STX` : "—"}
                    </span>
                  </div>
                </div>
                {chartMetric === "apy" && !isNotStacking && (
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-4 h-0.5 bg-primary rounded-full inline-block" />
                      <span>Your APY</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-4 h-0.5 border-t-2 border-dashed border-muted-foreground inline-block" />
                      <span>Network Avg</span>
                    </div>
                  </div>
                )}
                {yieldHistory.data && (
                  <div className="sr-only">
                    APY data: {yieldHistory.data.map((d: any) => `${d.date}: ${d.apy}%`).join(', ')}
                  </div>
                )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Cycle Progress */}
          <div className="space-y-6">
            <Card data-tour="cycle-progress" className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Cycle Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cycle.isLoading ? (
                  <ShimmerSkeleton className="h-32 w-full" />
                ) : (
                  <div className="text-center space-y-4">
                    <div className="relative mx-auto w-28 h-28">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                        <circle
                          cx="50" cy="50" r="42" fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${((cycle.data?.blocksElapsed ?? 0) / (cycle.data?.totalBlocks ?? 1)) * 264} 264`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold font-mono">{cycle.data?.currentCycle}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{cycle.data?.phase}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cycle.data?.blocksElapsed.toLocaleString()} / {cycle.data?.totalBlocks.toLocaleString()} blocks • {cycle.data?.eta}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stacking Position or CTA */}
            {isNotStacking ? (
              <NotStackingYet />
            ) : (
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Stacking Position</CardTitle>
                </CardHeader>
                <CardContent>
                  {position.isLoading ? (
                    <ShimmerSkeleton className="h-24 w-full" />
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/10">{position.data?.status}</Badge>
                        <span className="text-xs text-muted-foreground">{position.data?.poolName}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Locked: </span>
                        <span className="font-mono font-medium">{position.data?.amountStacked.toLocaleString()} STX</span>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Cycle {position.data?.startCycle} → {position.data?.endCycle}</span>
                          <span>{position.data?.cyclesCompleted}/{position.data?.lockPeriod}</span>
                        </div>
                        <Progress value={((position.data?.cyclesCompleted ?? 0) / (position.data?.lockPeriod ?? 1)) * 100} className="h-2" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Reward Projection */}
        {!isNotStacking && position.data && stats.data && (
          <RewardProjection
            amountStacked={position.data.amountStacked}
            cyclesRemaining={position.data.cyclesRemaining}
            startCycle={position.data.startCycle + position.data.cyclesCompleted}
            apy={stats.data.currentAPY}
          />
        )}

        {!isNotStacking && /* Recent Activity */
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.isLoading ? (
              <ShimmerSkeleton className="h-40 w-full" />
            ) : isMobile ? (
              <div className="divide-y divide-border/30">
                {activity.data?.map((a) => (
                  <div key={a.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant="outline" className={`text-xs ${a.type === "reward" ? "border-accent/30 text-accent" : "border-primary/30 text-primary"}`}>
                        {a.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{a.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-medium">{a.amount}</span>
                      <span className="font-mono text-xs text-muted-foreground">Cycle #{a.cycle}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs text-right">Cycle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activity.data?.map((a) => (
                    <TableRow key={a.id} className="border-border/30">
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${a.type === "reward" ? "border-accent/30 text-accent" : "border-primary/30 text-primary"}`}>
                          {a.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{a.amount}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{a.date}</TableCell>
                      <TableCell className="text-right font-mono text-sm">#{a.cycle}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>}

        {!isNotStacking && <StackingTimeline />}
      </div>
      </PageTransition>
    </AppLayout>
  );
}
