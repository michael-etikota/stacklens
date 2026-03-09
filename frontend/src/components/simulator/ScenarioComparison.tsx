import { Trophy, Download, Copy } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateRewards, mockPools } from "@/data/mock-data";
import { toast } from "sonner";
import type { SavedScenario } from "./SavedScenariosDrawer";

interface ScenarioComparisonProps {
  scenarioA: SavedScenario;
  scenarioB: SavedScenario;
}

export function ScenarioComparison({ scenarioA, scenarioB }: ScenarioComparisonProps) {
  const poolA = mockPools.find((p) => p.id === scenarioA.selectedPool);
  const poolB = mockPools.find((p) => p.id === scenarioB.selectedPool);

  const resultA = calculateRewards(
    scenarioA.stxAmount, scenarioA.lockCycles,
    scenarioA.isPool ? "pool" : "solo",
    scenarioA.isPool ? poolA?.fee : undefined
  );
  const resultB = calculateRewards(
    scenarioB.stxAmount, scenarioB.lockCycles,
    scenarioB.isPool ? "pool" : "solo",
    scenarioB.isPool ? poolB?.fee : undefined
  );

  const labelA = `${scenarioA.stxAmount.toLocaleString()} STX · ${scenarioA.isPool ? poolA?.name || "Pool" : "Solo"}`;
  const labelB = `${scenarioB.stxAmount.toLocaleString()} STX · ${scenarioB.isPool ? poolB?.name || "Pool" : "Solo"}`;

  const rows = [
    { metric: "STX Amount", a: scenarioA.stxAmount.toLocaleString(), b: scenarioB.stxAmount.toLocaleString(), winnerFn: () => scenarioA.stxAmount > scenarioB.stxAmount ? "a" : scenarioA.stxAmount < scenarioB.stxAmount ? "b" : "tie" },
    { metric: "Lock Cycles", a: String(scenarioA.lockCycles), b: String(scenarioB.lockCycles), winnerFn: () => "tie" as const },
    { metric: "Mode", a: scenarioA.isPool ? poolA?.name || "Pool" : "Solo", b: scenarioB.isPool ? poolB?.name || "Pool" : "Solo", winnerFn: () => "tie" as const },
    { metric: "APY", a: `${resultA.apy.toFixed(1)}%`, b: `${resultB.apy.toFixed(1)}%`, winnerFn: () => resultA.apy > resultB.apy ? "a" : resultA.apy < resultB.apy ? "b" : "tie" },
    { metric: "BTC Rewards", a: resultA.totalBtc.toFixed(6), b: resultB.totalBtc.toFixed(6), winnerFn: () => resultA.totalBtc > resultB.totalBtc ? "a" : resultA.totalBtc < resultB.totalBtc ? "b" : "tie" },
    { metric: "USD Value", a: `$${resultA.totalUsd.toFixed(0)}`, b: `$${resultB.totalUsd.toFixed(0)}`, winnerFn: () => resultA.totalUsd > resultB.totalUsd ? "a" : resultA.totalUsd < resultB.totalUsd ? "b" : "tie" },
  ];

  const maxCycles = Math.max(resultA.projections.length, resultB.projections.length);
  const chartData = Array.from({ length: maxCycles }, (_, i) => ({
    cycle: `C${i + 1}`,
    scenarioA: resultA.projections[i]?.cumulativeBtc ?? null,
    scenarioB: resultB.projections[i]?.cumulativeBtc ?? null,
  }));

  const downloadCsv = () => {
    try {
      const header = "Metric,Scenario A,Scenario B,Winner";
      const csvRows = rows.map((r) => {
        const w = r.winnerFn();
        return `${r.metric},"${r.a}","${r.b}",${w === "tie" ? "-" : w.toUpperCase()}`;
      });
      const csv = [header, ...csvRows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stacklens-comparison.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch {
      toast.error("Failed to generate CSV");
    }
  };

  const copySummary = async () => {
    try {
      const lines = rows.map((r) => {
        const w = r.winnerFn();
        return `${r.metric}: A=${r.a} | B=${r.b}${w !== "tie" ? ` → Winner: ${w.toUpperCase()}` : ""}`;
      });
      const summary = `StackLens Comparison\nA: ${labelA}\nB: ${labelB}\n\n${lines.join("\n")}`;
      await navigator.clipboard.writeText(summary);
      toast.success("Summary copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Export actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={downloadCsv} className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={copySummary} className="gap-1.5">
          <Copy className="h-3.5 w-3.5" /> Copy
        </Button>
      </div>

      <Card className="border-border/50 bg-muted/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            Side-by-Side Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs px-2 py-2">Metric</TableHead>
                  <TableHead className="text-xs px-2 py-2">A</TableHead>
                  <TableHead className="text-xs px-2 py-2">B</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const winner = row.winnerFn();
                  return (
                    <TableRow key={row.metric} className="border-border/30">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap px-2 py-2">{row.metric}</TableCell>
                      <TableCell className={`font-mono text-xs px-2 py-2 ${winner === "a" ? "text-accent font-semibold" : ""}`}>
                        {row.a} {winner === "a" && "★"}
                      </TableCell>
                      <TableCell className={`font-mono text-xs px-2 py-2 ${winner === "b" ? "text-primary font-semibold" : ""}`}>
                        {row.b} {winner === "b" && "★"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-muted/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Projection Overlay</CardTitle>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-accent inline-block" /> A: {labelA}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary inline-block" /> B: {labelB}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="compA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="compB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="cycle" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 12, color: "hsl(var(--popover-foreground))" }} />
              <Area type="monotone" dataKey="scenarioA" name="Scenario A" stroke="hsl(25, 95%, 53%)" fill="url(#compA)" strokeWidth={2} connectNulls activeDot={{ r: 5, strokeWidth: 2 }} />
              <Area type="monotone" dataKey="scenarioB" name="Scenario B" stroke="hsl(var(--primary))" fill="url(#compB)" strokeWidth={2} connectNulls activeDot={{ r: 5, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
