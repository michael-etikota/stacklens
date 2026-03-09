import { useState, useEffect } from "react";
import { Trash2, Upload, Clock, Layers, GitCompareArrows, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { calculateRewards, mockPools } from "@/data/mock-data";
import { formatDistanceToNow } from "date-fns";
import { ScenarioComparison } from "./ScenarioComparison";

export interface SavedScenario {
  stxAmount: number;
  lockCycles: number;
  isPool: boolean;
  selectedPool: string;
  date: string;
}

interface SavedScenariosDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (scenario: SavedScenario) => void;
  currentConfig: Omit<SavedScenario, "date">;
}

export function SavedScenariosDrawer({
  open,
  onOpenChange,
  onLoad,
  currentConfig,
}: SavedScenariosDrawerProps) {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  const refresh = () =>
    setScenarios(JSON.parse(localStorage.getItem("stacklens-scenarios") || "[]"));

  useEffect(() => {
    if (open) {
      refresh();
      setCompareMode(false);
      setSelected([]);
    }
  }, [open]);

  const handleDelete = (index: number) => {
    const updated = scenarios.filter((_, i) => i !== index);
    localStorage.setItem("stacklens-scenarios", JSON.stringify(updated));
    setScenarios(updated);
    setSelected((prev) => prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)));
  };

  const handleLoad = (s: SavedScenario) => {
    onLoad(s);
    onOpenChange(false);
  };

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= 2) return prev;
      return [...prev, index];
    });
  };

  const isDifferent = (s: SavedScenario) =>
    s.stxAmount !== currentConfig.stxAmount ||
    s.lockCycles !== currentConfig.lockCycles ||
    s.isPool !== currentConfig.isPool ||
    (s.isPool && s.selectedPool !== currentConfig.selectedPool);

  const showComparison = compareMode && selected.length === 2;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Saved Scenarios
          </SheetTitle>
          <SheetDescription>
            {compareMode ? "Select 2 scenarios to compare" : "Load a previously saved simulation configuration"}
          </SheetDescription>
        </SheetHeader>

        {scenarios.length >= 2 && (
          <div className="mt-4 flex gap-2">
            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => { setCompareMode(!compareMode); setSelected([]); }}
            >
              {compareMode ? <X className="h-3 w-3" /> : <GitCompareArrows className="h-3.5 w-3.5" />}
              {compareMode ? "Cancel" : "Compare"}
            </Button>
            {compareMode && selected.length === 2 && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                2 selected — scroll down
              </Badge>
            )}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {scenarios.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-muted-foreground"
              >
                <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No saved scenarios yet</p>
                <p className="text-xs mt-1">Use the Save button to store simulation configs</p>
              </motion.div>
            )}

            {scenarios.map((s, i) => {
              const pool = mockPools.find((p) => p.id === s.selectedPool);
              const result = calculateRewards(
                s.stxAmount, s.lockCycles,
                s.isPool ? "pool" : "solo",
                s.isPool ? pool?.fee : undefined
              );
              const different = isDifferent(s);
              const isSelected = selected.includes(i);

              return (
                <motion.div
                  key={`${s.date}-${i}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-lg border p-4 space-y-3 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border/50 bg-muted/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {compareMode && (
                        <Checkbox
                          checked={isSelected}
                          disabled={!isSelected && selected.length >= 2}
                          onCheckedChange={() => toggleSelect(i)}
                          className="mt-0.5"
                        />
                      )}
                      <div>
                        <div className="font-mono text-sm font-semibold">
                          {s.stxAmount.toLocaleString()} STX
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(s.date), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {compareMode && isSelected && (
                        <Badge variant="default" className="text-xs">
                          {selected.indexOf(i) === 0 ? "A" : "B"}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {s.lockCycles} cycles
                      </Badge>
                      <Badge variant={s.isPool ? "default" : "secondary"} className="text-xs">
                        {s.isPool ? pool?.name || "Pool" : "Solo"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Est. <span className="font-mono text-accent">{result.totalBtc.toFixed(6)}</span> BTC
                    </span>
                    <span>APY {result.apy.toFixed(1)}%</span>
                  </div>

                  {!compareMode && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5 text-xs"
                        onClick={() => handleLoad(s)}
                      >
                        <Upload className="h-3 w-3" />
                        {different ? "Load" : "Current"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <ScenarioComparison
                scenarioA={scenarios[selected[0]]}
                scenarioB={scenarios[selected[1]]}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
