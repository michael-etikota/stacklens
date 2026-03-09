import { Bitcoin, TrendingUp, AlertTriangle } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";
import { Card, CardContent } from "@/components/ui/card";

interface HeroRewardDisplayProps {
  totalBtc: number;
  totalUsd: number;
  apy: number;
  btcPerCycle: number;
}

export function HeroRewardDisplay({ totalBtc, totalUsd, apy, btcPerCycle }: HeroRewardDisplayProps) {
  const animatedBtc = useCountUp(totalBtc, 1200, 6);
  const animatedUsd = useCountUp(totalUsd, 1200, 0);
  const animatedApy = useCountUp(apy, 1200, 1);
  const animatedPerCycle = useCountUp(btcPerCycle, 1200, 6);

  const optimistic = totalBtc * 1.15;
  const pessimistic = totalBtc * 0.85;

  return (
    <div className="space-y-4">
      {/* Hero BTC Reward */}
      <Card className="glass-card glow-accent overflow-hidden">
        <CardContent className="p-8 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
          <div className="relative">
            <Bitcoin className="h-8 w-8 text-accent mx-auto mb-3" />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Estimated BTC Rewards
            </p>
            <div
              className="text-3xl sm:text-4xl md:text-5xl font-bold font-mono bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, hsl(25 95% 53%), hsl(38 92% 50%))",
              }}
            >
              {animatedBtc.toFixed(6)}
            </div>
            <div className="text-lg font-semibold text-accent mt-1">
              ≈ ${animatedUsd.toLocaleString()} USD
            </div>

            {/* Confidence range */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Range: {pessimistic.toFixed(6)}
              </span>
              <span>— {optimistic.toFixed(6)} BTC</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="glass-card" role="region" aria-label="Effective APY">
          <CardContent className="p-5 text-center">
            <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1.5" />
            <div className="text-2xl font-bold font-mono">{animatedApy.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Effective APY</div>
          </CardContent>
        </Card>
        <Card className="glass-card" role="region" aria-label="BTC per Cycle">
          <CardContent className="p-5 text-center">
            <Bitcoin className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
            <div className="text-2xl font-bold font-mono">{animatedPerCycle.toFixed(6)}</div>
            <div className="text-xs text-muted-foreground">BTC / Cycle</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
