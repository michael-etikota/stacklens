import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Calculator, Save, Share2, Layers, Download, Copy } from "lucide-react";
import { PageHeading } from "@/components/PageHeading";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculateRewards, mockPools } from "@/data/mock-data";
import { toast } from "sonner";
import { SimulatorInputPanel } from "@/components/simulator/SimulatorInputPanel";
import { HeroRewardDisplay } from "@/components/simulator/HeroRewardDisplay";
import { SavedScenariosDrawer, type SavedScenario } from "@/components/simulator/SavedScenariosDrawer";
import { OverlaySelector } from "@/components/simulator/OverlaySelector";
import { BreakevenAnalysis } from "@/components/simulator/BreakevenAnalysis";

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const OVERLAY_COLORS = [
  { stroke: "hsl(var(--primary))", id: "overlayGrad1" },
  { stroke: "hsl(142, 71%, 45%)", id: "overlayGrad2" },
  { stroke: "hsl(217, 91%, 60%)", id: "overlayGrad3" },
];

export default function SimulatorPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [stxAmount, setStxAmount] = useState(() => Number(searchParams.get("amount")) || 50_000);
  const [lockCycles, setLockCycles] = useState(() => Number(searchParams.get("cycles")) || 6);
  const [isPool, setIsPool] = useState(() => searchParams.get("mode") === "pool");
  const [selectedPool, setSelectedPool] = useState(() => searchParams.get("pool") || mockPools[0].id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [overlayScenarios, setOverlayScenarios] = useState<SavedScenario[]>([]);

  const loadScenario = (s: SavedScenario) => {
    setStxAmount(s.stxAmount);
    setLockCycles(s.lockCycles);
    setIsPool(s.isPool);
    setSelectedPool(s.selectedPool);
  };

  useEffect(() => {
    const params: Record<string, string> = {
      amount: String(stxAmount),
      cycles: String(lockCycles),
      mode: isPool ? "pool" : "solo",
    };
    if (isPool) params.pool = selectedPool;
    setSearchParams(params, { replace: true });
  }, [stxAmount, lockCycles, isPool, selectedPool, setSearchParams]);

  const pool = mockPools.find((p) => p.id === selectedPool) ?? mockPools[0];

  const soloResult = useMemo(() => calculateRewards(stxAmount, lockCycles, "solo"), [stxAmount, lockCycles]);
  const poolResult = useMemo(() => calculateRewards(stxAmount, lockCycles, "pool", pool.fee), [stxAmount, lockCycles, pool.fee]);
  const activeResult = isPool ? poolResult : soloResult;

  // Compute overlay projections
  const overlayResults = useMemo(() => {
    return overlayScenarios.map((s) => {
      const p = mockPools.find((pool) => pool.id === s.selectedPool) ?? mockPools[0];
      const result = calculateRewards(s.stxAmount, s.lockCycles, s.isPool ? "pool" : "solo", s.isPool ? p.fee : 0);
      const label = `${s.stxAmount.toLocaleString()} STX · ${s.isPool ? "Pool" : "Solo"} · ${s.lockCycles}c`;
      return { result, label };
    });
  }, [overlayScenarios]);

  // Merge chart data: use the longest projection length
  const chartData = useMemo(() => {
    const maxLen = Math.max(activeResult.projections.length, ...overlayResults.map((o) => o.result.projections.length));
    return Array.from({ length: maxLen }, (_, i) => {
      const base: Record<string, number> = {
        cycle: i + 1,
        cumulativeBtc: activeResult.projections[i]?.cumulativeBtc ?? 0,
        cumulativeUsd: activeResult.projections[i]?.cumulativeUsd ?? 0,
      };
      overlayResults.forEach((o, idx) => {
        base[`overlay${idx}`] = o.result.projections[i]?.cumulativeBtc ?? 0;
      });
      return base;
    });
  }, [activeResult, overlayResults]);

  const handleReset = () => {
    setStxAmount(50_000);
    setLockCycles(6);
    setIsPool(false);
    setSelectedPool(mockPools[0].id);
  };

  const saveScenario = () => {
    if (stxAmount <= 0) {
      toast.error("Invalid amount", { description: "STX amount must be greater than 0" });
      return;
    }
    const scenarios = JSON.parse(localStorage.getItem("stacklens-scenarios") || "[]");
    scenarios.push({ stxAmount, lockCycles, isPool, selectedPool, date: new Date().toISOString() });
    localStorage.setItem("stacklens-scenarios", JSON.stringify(scenarios));
    toast.success("Scenario saved", { description: `${stxAmount.toLocaleString()} STX × ${lockCycles} cycles` });
  };

  const shareUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const downloadProjectionCsv = () => {
    try {
      const header = "Cycle,BTC (cumulative),USD (cumulative)";
      const rows = activeResult.projections.map((p) => `${p.cycle},${p.cumulativeBtc.toFixed(6)},${p.cumulativeUsd.toFixed(2)}`);
      const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stacklens-projection.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch { toast.error("Failed to generate CSV"); }
  };

  const copyProjectionSummary = async () => {
    try {
      const lines = activeResult.projections.map((p) => `Cycle ${p.cycle}: ${p.cumulativeBtc.toFixed(6)} BTC ($${p.cumulativeUsd.toFixed(0)})`);
      const summary = `StackLens Projection\n${stxAmount.toLocaleString()} STX · ${lockCycles} cycles · ${isPool ? "Pool" : "Solo"} · ${activeResult.apy.toFixed(1)}% APY\n\n${lines.join("\n")}`;
      await navigator.clipboard.writeText(summary);
      toast.success("Summary copied to clipboard");
    } catch { toast.error("Failed to copy"); }
  };

  return (
    <AppLayout>
      <PageTransition>
        <div className="container py-8 space-y-6">
          <motion.div {...fadeUp}>
            <PageHeading
              title="Reward Simulator"
              description="Model your potential stacking returns"
              icon={<Calculator className="h-6 w-6 text-primary" />}
              actions={
                <>
                  <Button variant="outline" size="sm" onClick={saveScenario} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)} className="gap-1.5">
                    <Layers className="h-3.5 w-3.5" /> Saved
                  </Button>
                  <Button variant="outline" size="sm" onClick={shareUrl} className="gap-1.5">
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </Button>
                </>
              }
            />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <SimulatorInputPanel
              stxAmount={stxAmount}
              setStxAmount={setStxAmount}
              lockCycles={lockCycles}
              setLockCycles={setLockCycles}
              isPool={isPool}
              setIsPool={setIsPool}
              selectedPool={selectedPool}
              setSelectedPool={setSelectedPool}
              onReset={handleReset}
            />

            {/* Results Panel */}
            <div className="space-y-6">
              <HeroRewardDisplay
                totalBtc={activeResult.totalBtc}
                totalUsd={activeResult.totalUsd}
                apy={activeResult.apy}
                btcPerCycle={activeResult.btcPerCycle}
              />

              {/* Projection Chart */}
              <Card className="glass-card">
                <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Reward Projection</CardTitle>
                  <div className="flex gap-1.5">
                    <OverlaySelector selected={overlayScenarios} onSelectionChange={setOverlayScenarios} />
                    <Button variant="outline" size="sm" onClick={downloadProjectionCsv} className="gap-1.5 h-7 px-2 text-xs">
                      <Download className="h-3 w-3" /> CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyProjectionSummary} className="gap-1.5 h-7 px-2 text-xs">
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div role="img" aria-label="Reward projection chart showing cumulative BTC rewards per cycle">
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
                          </linearGradient>
                          {overlayResults.map((_, idx) => (
                            <linearGradient key={idx} id={OVERLAY_COLORS[idx].id} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={OVERLAY_COLORS[idx].stroke} stopOpacity={0.15} />
                              <stop offset="95%" stopColor={OVERLAY_COLORS[idx].stroke} stopOpacity={0} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="cycle" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload;
                            const perCycleBtc = d.cumulativeBtc / d.cycle;
                            return (
                              <div className="rounded-lg border border-border bg-popover p-3 shadow-xl text-popover-foreground space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Cycle {d.cycle}</p>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="h-2 w-2 rounded-full shrink-0 bg-accent" />
                                  <span className="text-lg font-bold font-mono text-accent">{d.cumulativeBtc.toFixed(6)}</span>
                                  <span className="text-xs text-muted-foreground">BTC</span>
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">${d.cumulativeUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} · Current</p>
                                {overlayResults.map((o, idx) => {
                                  const val = d[`overlay${idx}`];
                                  if (val == null) return null;
                                  return (
                                    <div key={idx} className="flex items-baseline gap-1.5">
                                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: OVERLAY_COLORS[idx].stroke }} />
                                      <span className="text-sm font-bold font-mono">{val.toFixed(6)}</span>
                                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">{o.label}</span>
                                    </div>
                                  );
                                })}
                                <div className="border-t border-border pt-1.5 text-xs text-muted-foreground">
                                  +{perCycleBtc.toFixed(6)} BTC this cycle
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Area type="monotone" dataKey="cumulativeBtc" name="Current" stroke="hsl(25, 95%, 53%)" fill="url(#projGrad)" strokeWidth={2} activeDot={{ r: 5, strokeWidth: 2 }} />
                        {overlayResults.map((o, idx) => (
                          <Area
                            key={idx}
                            type="monotone"
                            dataKey={`overlay${idx}`}
                            name={o.label}
                            stroke={OVERLAY_COLORS[idx].stroke}
                            fill={`url(#${OVERLAY_COLORS[idx].id})`}
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                            activeDot={{ r: 4, strokeWidth: 1.5 }}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend for overlays */}
                  {overlayResults.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Current</span>
                      {overlayResults.map((o, idx) => (
                        <span key={idx} className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: OVERLAY_COLORS[idx].stroke }} />
                          {o.label}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="sr-only">
                    Projection data: {activeResult.projections.map(p => `Cycle ${p.cycle}: ${p.cumulativeBtc.toFixed(6)} BTC ($${p.cumulativeUsd.toFixed(0)})`).join('. ')}
                  </div>
                </CardContent>
              </Card>

              {/* Comparison Table */}
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Solo vs Pool Comparison</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead className="text-xs px-2 py-2 whitespace-nowrap">Metric</TableHead>
                          <TableHead className="text-xs px-2 py-2 whitespace-nowrap">Solo</TableHead>
                          <TableHead className="text-xs px-2 py-2 whitespace-nowrap">Pool ({pool.name})</TableHead>
                          <TableHead className="text-xs px-2 py-2 text-right whitespace-nowrap">Winner</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { metric: "APY", solo: `${soloResult.apy.toFixed(1)}%`, pool: `${poolResult.apy.toFixed(1)}%`, winner: soloResult.apy > poolResult.apy ? "solo" : "pool" },
                          { metric: "Total BTC", solo: soloResult.totalBtc.toFixed(6), pool: poolResult.totalBtc.toFixed(6), winner: soloResult.totalBtc > poolResult.totalBtc ? "solo" : "pool" },
                          { metric: "USD Value", solo: `$${soloResult.totalUsd.toFixed(0)}`, pool: `$${poolResult.totalUsd.toFixed(0)}`, winner: soloResult.totalUsd > poolResult.totalUsd ? "solo" : "pool" },
                          { metric: "Min STX", solo: "~100,000", pool: `${pool.minAmount.toLocaleString()}`, winner: "pool" },
                          { metric: "Technical Setup", solo: "Required", pool: "None", winner: "pool" },
                        ].map((row) => (
                          <TableRow key={row.metric} className="border-border/30">
                            <TableCell className="text-sm text-muted-foreground px-2 py-2 whitespace-nowrap">{row.metric}</TableCell>
                            <TableCell className="font-mono text-sm px-2 py-2 whitespace-nowrap">{row.solo}</TableCell>
                            <TableCell className="font-mono text-sm px-2 py-2 whitespace-nowrap">{row.pool}</TableCell>
                            <TableCell className="text-right px-2 py-2 whitespace-nowrap">
                              <Badge variant="outline" className={`text-xs ${row.winner === "solo" ? "border-primary/30 text-primary" : "border-accent/30 text-accent"}`}>
                                {row.winner === "solo" ? "Solo" : "Pool"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              {/* Breakeven Analysis */}
              <BreakevenAnalysis stxAmount={stxAmount} activeResult={activeResult} />
            </div>
          </div>
        </div>
      </PageTransition>

      <SavedScenariosDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onLoad={loadScenario}
        currentConfig={{ stxAmount, lockCycles, isPool, selectedPool }}
      />
    </AppLayout>
  );
}
