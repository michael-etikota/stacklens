import { useState, useCallback, useEffect } from "react";
import { Users, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { mockPools, mockStackingStats } from "@/data/mock-data";
import { useWallet } from "@/contexts/WalletContext";
import { addWeeks, format } from "date-fns";

const presets = [10_000, 50_000, 100_000, 250_000];
const STX_PRICE = mockStackingStats.stxUsdPrice;
const SOLO_MIN = 100_000;

interface SimulatorInputPanelProps {
  stxAmount: number;
  setStxAmount: (v: number) => void;
  lockCycles: number;
  setLockCycles: (v: number) => void;
  isPool: boolean;
  setIsPool: (v: boolean) => void;
  selectedPool: string;
  setSelectedPool: (v: string) => void;
  onReset: () => void;
}

export function SimulatorInputPanel({
  stxAmount, setStxAmount,
  lockCycles, setLockCycles,
  isPool, setIsPool,
  selectedPool, setSelectedPool,
  onReset,
}: SimulatorInputPanelProps) {
  const { isConnected } = useWallet();
  const [inputValue, setInputValue] = useState(stxAmount.toLocaleString());
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    setInputValue(stxAmount.toLocaleString());
  }, [stxAmount]);

  const handleInputChange = useCallback((raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, "");
    const num = Number(cleaned);
    if (cleaned === "") {
      setInputValue("");
      return;
    }
    const clamped = Math.min(Math.max(num, 1000), 500_000);
    setInputValue(clamped.toLocaleString());
    setStxAmount(clamped);
  }, [setStxAmount]);

  const handleSlider = useCallback((v: number) => {
    setStxAmount(v);
    setInputValue(v.toLocaleString());
  }, [setStxAmount]);

  const handlePreset = useCallback((p: number) => {
    setStxAmount(p);
    setInputValue(p.toLocaleString());
  }, [setStxAmount]);

  const handleMax = useCallback(() => {
    const bal = mockStackingStats.stxBalance;
    const clamped = Math.min(bal, 500_000);
    setStxAmount(clamped);
    setInputValue(clamped.toLocaleString());
  }, [setStxAmount]);

  const usdValue = stxAmount * STX_PRICE;
  const unlockDate = format(addWeeks(new Date(), lockCycles * 2), "MMM yyyy");
  const belowSoloMin = !isPool && stxAmount < SOLO_MIN;

  return (
    <>
      <Card className="glass-card h-fit">
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* STX Amount */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">STX Amount</label>
              <span className="text-xs text-muted-foreground">
                ≈ ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
              </span>
            </div>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Input
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onBlur={() => setInputValue(stxAmount.toLocaleString())}
                  className="font-mono pr-12 bg-muted/30 border-border/50"
                  aria-label="STX amount"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                  STX
                </span>
              </div>
              <Button
                variant="outline"
                size="default"
                onClick={handleMax}
                className="text-xs gap-1"
                title={`Set to wallet balance (${mockStackingStats.stxBalance.toLocaleString()} STX)`}
              >
                <Wallet className="h-3 w-3" /> Max
              </Button>
            </div>
            <div className="relative">
              <Slider
                value={[stxAmount]}
                onValueChange={([v]) => handleSlider(v)}
                min={1000}
                max={500_000}
                step={1000}
                className="mb-3"
              />
              <div className="absolute top-[9px] left-0 right-0 pointer-events-none" aria-hidden="true">
                {presets.map((p) => (
                  <div
                    key={p}
                    className="absolute w-0.5 h-2 bg-muted-foreground/30 rounded-full"
                    style={{ left: `${((p - 1000) / (500_000 - 1000)) * 100}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {presets.map((p) => (
                <Button
                  key={p}
                  variant={stxAmount === p ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7 font-mono"
                  onClick={() => handlePreset(p)}
                >
                  {(p / 1000)}k
                </Button>
              ))}
            </div>
            {belowSoloMin && (
              <p className="text-xs text-warning mt-2 flex items-center gap-1">
                ⚠ Solo stacking requires ~100,000 STX minimum
              </p>
            )}
          </div>

          {/* Lock Period */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Lock Period</label>
              <span className="font-mono text-sm text-primary">{lockCycles} cycles</span>
            </div>
            <Slider
              value={[lockCycles]}
              onValueChange={([v]) => setLockCycles(v)}
              min={1}
              max={12}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 cycle (~2 wks)</span>
              <span>12 cycles</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Unlocks ~{unlockDate}
            </p>
          </div>

          {/* Solo vs Pool */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Pool Stacking</div>
                <div className="text-xs text-muted-foreground">{isPool ? "Delegated" : "Solo mode"}</div>
              </div>
            </div>
            <Switch checked={isPool} onCheckedChange={setIsPool} />
          </div>

          {/* Pool Selector */}
          <AnimatePresence initial={false}>
            {isPool && (
              <motion.div
                key="pool-selector"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Pool</label>
                  <Select value={selectedPool} onValueChange={setSelectedPool}>
                    <SelectTrigger className="bg-muted/30 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPools.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — {p.fee}% fee
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 gap-1.5"
              disabled={!isConnected}
              title={!isConnected ? "Connect wallet first" : "Start stacking"}
            >
              Start Stacking
            </Button>
            <Button variant="outline" onClick={() => setResetOpen(true)}>
              Reset
            </Button>
          </div>
          {!isConnected && (
            <p className="text-xs text-muted-foreground text-center -mt-2">
              Connect wallet to start stacking
            </p>
          )}
        </CardContent>
      </Card>

      {/* Reset confirmation */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Simulator</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all inputs to their default values. Any unsaved configuration will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onReset(); setResetOpen(false); }}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
