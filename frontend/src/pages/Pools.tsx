import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend } from "recharts";
import { PageHeading } from "@/components/PageHeading";
import { ErrorState } from "@/components/ErrorState";
import { Search, SlidersHorizontal, CheckCircle, Users, BarChart3, ArrowUpDown, X, GitCompareArrows } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePools } from "@/hooks/use-stacking-data";
import type { Pool } from "@/data/mock-data";
import { PageTransition } from "@/components/PageTransition";
import { Link } from "react-router-dom";

type SortKey = "apy" | "fee" | "totalStacked" | "stackers";

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function PoolSparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 48;
  const h = 16;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const trending = data[data.length - 1] >= data[0];
  const change = (data[data.length - 1] - data[0]).toFixed(1);
  const label = `${trending ? "+" : ""}${change}% over ${data.length} cycles`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <svg width={w} height={h} aria-hidden="true" className="opacity-70 cursor-help">
          <polyline points={points} fill="none" stroke={trending ? "hsl(var(--success))" : "hsl(var(--destructive))"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </TooltipTrigger>
      <TooltipContent>
        <span className={trending ? "text-success" : "text-destructive"}>APY trend: {label}</span>
      </TooltipContent>
    </Tooltip>
  );
}

function PoolCardSkeleton() {
  return (
    <Card className="glass-card">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export default function PoolsPage() {
  const { data: pools, isLoading, isError, refetch } = usePools();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("apy");
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!pools) return [];
    return pools
      .filter((p) => {
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "fee") return a.fee - b.fee;
        return (b as any)[sortBy] - (a as any)[sortBy];
      });
  }, [pools, search, statusFilter, sortBy]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const comparePools = pools?.filter((p) => compareIds.has(p.id)) ?? [];

  if (isError) {
    return (
      <AppLayout>
        <div className="container py-8">
          <ErrorState message="Failed to load stacking pools." onRetry={() => refetch()} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageTransition>
        <div className="container py-8 space-y-6">
          <motion.div {...fadeUp}>
            <PageHeading title="Stacking Pools" description="Compare delegation pools and find your best match" />
          </motion.div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search pools..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="closing">Closing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apy">APY</SelectItem>
                <SelectItem value="fee">Fee (Low)</SelectItem>
                <SelectItem value="totalStacked">TVL</SelectItem>
                <SelectItem value="stackers">Delegators</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pool Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <PoolCardSkeleton key={i} />)}
            </div>
          ) : (
            <motion.div
              className="grid md:grid-cols-2 xl:grid-cols-3 gap-4"
              initial="initial"
              animate="animate"
              variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
            >
              {filtered.map((pool) => (
                <motion.div key={pool.id} variants={fadeUp}>
                  <Card className="glass-card hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={compareIds.has(pool.id)}
                            onCheckedChange={() => toggleCompare(pool.id)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <h3 className="font-semibold text-base">{pool.name}</h3>
                          {pool.verified && <CheckCircle className="h-3.5 w-3.5 text-success" />}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            pool.status === "active" ? "border-success/30 text-success" :
                            pool.status === "full" ? "border-warning/30 text-warning" :
                            "border-destructive/30 text-destructive"
                          }`}
                        >
                          {pool.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-2.5 rounded-lg bg-muted/50">
                          <div className="text-xs text-muted-foreground">APY</div>
                          <div className="text-sm font-bold font-mono text-accent">{pool.apy}%</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/50">
                          <div className="text-xs text-muted-foreground">Fee</div>
                          <div className="text-sm font-bold font-mono">{pool.fee}%</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/50">
                          <div className="text-xs text-muted-foreground">Min</div>
                          <div className="text-sm font-mono">{pool.minAmount.toLocaleString()} STX</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-muted/50">
                          <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Stackers</div>
                          <div className="text-sm font-mono">{pool.stackers.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> TVL</span>
                        <span className="flex items-center gap-2">
                          <PoolSparkline data={pool.performanceHistory} />
                          <span className="font-mono">${(pool.totalStacked * 1.82 / 1e6).toFixed(1)}M</span>
                        </span>
                      </div>

                      <Link to={`/pools/${pool.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                        >
                          View Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Floating Compare Bar */}
          <AnimatePresence>
            {compareIds.size >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50"
                >
                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card/90 backdrop-blur-xl border border-primary/30 shadow-2xl glow-primary">
                  <GitCompareArrows className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{compareIds.size} pools selected</span>
                  <Button size="sm" onClick={() => setCompareOpen(true)} className="gap-1">
                    Compare
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCompareIds(new Set())}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compare Modal */}
          <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
            <DialogContent className="sm:max-w-2xl glass-card border-border/50">
              <DialogHeader>
                <DialogTitle>Pool Comparison</DialogTitle>
              </DialogHeader>
              {comparePools.length >= 2 && (() => {
                const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--info, 221 83% 53%))"];
                const maxApy = Math.max(...comparePools.map(p => p.apy));
                const maxFee = Math.max(...comparePools.map(p => p.fee));
                const maxTvl = Math.max(...comparePools.map(p => p.totalStacked));
                const maxStackers = Math.max(...comparePools.map(p => p.stackers));
                const radarData = [
                  { metric: "APY", ...Object.fromEntries(comparePools.map(p => [p.id, (p.apy / maxApy) * 100])) },
                  { metric: "Low Fee", ...Object.fromEntries(comparePools.map(p => [p.id, (1 - p.fee / (maxFee || 1)) * 100])) },
                  { metric: "TVL", ...Object.fromEntries(comparePools.map(p => [p.id, (p.totalStacked / maxTvl) * 100])) },
                  { metric: "Delegators", ...Object.fromEntries(comparePools.map(p => [p.id, (p.stackers / maxStackers) * 100])) },
                ];
                return (
                  <motion.div className="mb-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}>
                    <ResponsiveContainer key={comparePools.map(p => p.id).join('-')} width="100%" height={250}>
                      <RadarChart data={radarData} outerRadius="75%">
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        {comparePools.map((p, i) => (
                          <Radar key={p.id} name={p.name} dataKey={p.id} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} isAnimationActive animationDuration={600} animationEasing="ease-out" />
                        ))}
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </motion.div>
                );
              })()}
              <div className="overflow-x-auto -mx-2 px-2">
                <Table className="min-w-[500px]">
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="text-xs">Pool</TableHead>
                      <TableHead className="text-xs text-right">APY</TableHead>
                      <TableHead className="text-xs text-right">Fee</TableHead>
                      <TableHead className="text-xs text-right">Min</TableHead>
                      <TableHead className="text-xs text-right">TVL</TableHead>
                      <TableHead className="text-xs text-right">Stackers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparePools.map((p) => {
                      const bestApy = Math.max(...comparePools.map((x) => x.apy));
                      const bestFee = Math.min(...comparePools.map((x) => x.fee));
                      return (
                        <TableRow key={p.id} className="border-border/30">
                          <TableCell className="font-medium flex items-center gap-1.5">
                            {p.name}
                            {p.verified && <CheckCircle className="h-3 w-3 text-success" />}
                          </TableCell>
                          <TableCell className={`text-right font-mono ${p.apy === bestApy ? "text-success font-bold" : ""}`}>{p.apy}%</TableCell>
                          <TableCell className={`text-right font-mono ${p.fee === bestFee ? "text-success font-bold" : ""}`}>{p.fee}%</TableCell>
                          <TableCell className="text-right font-mono">{p.minAmount.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono">${(p.totalStacked * 1.82 / 1e6).toFixed(1)}M</TableCell>
                          <TableCell className="text-right font-mono">{p.stackers.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </PageTransition>

      
    </AppLayout>
  );
}
