import { useState, useMemo } from "react";
import { Info, TrendingUp, Trophy, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface BreakevenAnalysisProps {
  stxAmount: number;
  activeResult: {
    btcPerCycle: number;
    projections: { cycle: number; cumulativeBtc: number; cumulativeUsd: number }[];
    apy: number;
  };
  stxUsdPrice?: number;
  btcUsdPrice?: number;
}

const PRESETS = [
  { label: "Savings (4%)", apy: 4 },
  { label: "DeFi Lending (5%)", apy: 5 },
];

const CYCLES_PER_YEAR = 26;

export function BreakevenAnalysis({
  stxAmount,
  activeResult,
  stxUsdPrice = 1.82,
  btcUsdPrice = 62350,
}: BreakevenAnalysisProps) {
  const [altAPY, setAltAPY] = useState(5);
  const [customMode, setCustomMode] = useState(false);

  const analysis = useMemo(() => {
    const altYieldPerCycle = (stxAmount * stxUsdPrice * (altAPY / 100)) / CYCLES_PER_YEAR;
    const stackingYieldPerCycle = activeResult.btcPerCycle * btcUsdPrice;

    const rows = activeResult.projections.map((p, i) => {
      const stackingCum = p.cumulativeBtc * btcUsdPrice;
      const altCum = altYieldPerCycle * (i + 1);
      return {
        cycle: p.cycle,
        stacking: stackingCum,
        alternative: altCum,
        diff: stackingCum - altCum,
      };
    });

    const breakevenCycle = rows.findIndex((r) => r.stacking >= r.alternative && r.alternative > 0);
    const alwaysWins = stackingYieldPerCycle >= altYieldPerCycle;

    return { rows, breakevenCycle: breakevenCycle === -1 ? null : breakevenCycle + 1, alwaysWins, altYieldPerCycle, stackingYieldPerCycle };
  }, [stxAmount, stxUsdPrice, altAPY, btcUsdPrice, activeResult]);

  const selectPreset = (apy: number) => {
    setAltAPY(apy);
    setCustomMode(false);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Breakeven Analysis</CardTitle>
          <UiTooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px]">
              Compares stacking rewards against alternative yield options to find when stacking becomes more profitable.
            </TooltipContent>
          </UiTooltip>
        </div>
        {analysis.breakevenCycle !== null ? (
          <Badge variant="outline" className="border-success/30 text-success gap-1">
            <Trophy className="h-3 w-3" /> Cycle {analysis.breakevenCycle}
          </Badge>
        ) : analysis.alwaysWins ? (
          <Badge variant="outline" className="border-success/30 text-success gap-1">
            <TrendingUp className="h-3 w-3" /> Always wins
          </Badge>
        ) : (
          <Badge variant="outline" className="border-warning/30 text-warning gap-1">
            <AlertTriangle className="h-3 w-3" /> Alt. yield higher
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.apy}
              variant={!customMode && altAPY === p.apy ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => selectPreset(p.apy)}
            >
              {p.label}
            </Button>
          ))}
          <Button
            variant={customMode ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setCustomMode(true)}
          >
            Custom
          </Button>
          {customMode && (
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={altAPY}
                onChange={(e) => setAltAPY(Math.max(0, Math.min(100, Number(e.target.value))))}
                className="w-20 h-7 text-xs"
              />
              <span className="text-xs text-muted-foreground">% APY</span>
            </div>
          )}
        </div>

        {/* Result summary */}
        <div className="text-sm text-muted-foreground">
          {analysis.breakevenCycle !== null ? (
            <p>Stacking overtakes {altAPY}% alternative yield at <span className="font-semibold text-foreground">cycle {analysis.breakevenCycle}</span>.</p>
          ) : analysis.alwaysWins ? (
            <p>Stacking yields <span className="font-semibold text-success">${analysis.stackingYieldPerCycle.toFixed(0)}/cycle</span> vs <span className="text-muted-foreground">${analysis.altYieldPerCycle.toFixed(0)}/cycle</span> — stacking always wins.</p>
          ) : (
            <p>Alternative yield at {altAPY}% earns <span className="font-semibold text-warning">${analysis.altYieldPerCycle.toFixed(0)}/cycle</span> vs stacking's <span className="text-muted-foreground">${analysis.stackingYieldPerCycle.toFixed(0)}/cycle</span>.</p>
          )}
        </div>

        {/* Chart */}
        <div role="img" aria-label="Breakeven comparison chart">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analysis.rows} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="cycle" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`} />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-border bg-popover p-2.5 shadow-xl text-popover-foreground space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Cycle {d.cycle}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-accent" />
                        <span className="text-sm font-mono font-semibold">${d.stacking.toFixed(0)}</span>
                        <span className="text-xs text-muted-foreground">Stacking</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                        <span className="text-sm font-mono font-semibold">${d.alternative.toFixed(0)}</span>
                        <span className="text-xs text-muted-foreground">Alt. ({altAPY}%)</span>
                      </div>
                      <p className={`text-xs font-medium ${d.diff >= 0 ? "text-success" : "text-warning"}`}>
                        {d.diff >= 0 ? "+" : ""}{d.diff.toFixed(0)} USD
                      </p>
                    </div>
                  );
                }}
              />
              {analysis.breakevenCycle !== null && (
                <ReferenceLine x={analysis.breakevenCycle} stroke="hsl(var(--success))" strokeDasharray="4 4" strokeWidth={1.5} />
              )}
              <Bar dataKey="stacking" name="Stacking" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="alternative" name={`Alt. (${altAPY}%)`} fill="hsl(var(--muted-foreground))" radius={[3, 3, 0, 0]} maxBarSize={20} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-xs px-2 py-1.5 whitespace-nowrap">Cycle</TableHead>
                <TableHead className="text-xs px-2 py-1.5 whitespace-nowrap">Stacking</TableHead>
                <TableHead className="text-xs px-2 py-1.5 whitespace-nowrap">Alt. ({altAPY}%)</TableHead>
                <TableHead className="text-xs px-2 py-1.5 text-right whitespace-nowrap">Diff</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.rows.map((row) => {
                const isCrossover = analysis.breakevenCycle === row.cycle;
                return (
                  <TableRow
                    key={row.cycle}
                    className={`border-border/30 ${isCrossover ? "bg-success/10" : ""}`}
                  >
                    <TableCell className="text-xs font-mono px-2 py-1.5">
                      {row.cycle}
                      {isCrossover && <span className="ml-1 text-success">★</span>}
                    </TableCell>
                    <TableCell className="text-xs font-mono px-2 py-1.5">${row.stacking.toFixed(0)}</TableCell>
                    <TableCell className="text-xs font-mono px-2 py-1.5">${row.alternative.toFixed(0)}</TableCell>
                    <TableCell className={`text-xs font-mono px-2 py-1.5 text-right ${row.diff >= 0 ? "text-success" : "text-warning"}`}>
                      {row.diff >= 0 ? "+" : ""}{row.diff.toFixed(0)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
