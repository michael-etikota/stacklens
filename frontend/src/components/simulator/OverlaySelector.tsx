import { useState, useEffect } from "react";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import type { SavedScenario } from "./SavedScenariosDrawer";

const OVERLAY_COLORS = [
  { label: "Purple", dot: "bg-primary" },
  { label: "Green", dot: "bg-emerald-500" },
  { label: "Blue", dot: "bg-blue-500" },
];

interface OverlaySelectorProps {
  selected: SavedScenario[];
  onSelectionChange: (scenarios: SavedScenario[]) => void;
}

export function OverlaySelector({ selected, onSelectionChange }: OverlaySelectorProps) {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (popoverOpen) {
      const raw = localStorage.getItem("stacklens-scenarios");
      if (raw) {
        try { setScenarios(JSON.parse(raw)); } catch { /* ignore */ }
      } else {
        setScenarios([]);
      }
    }
  }, [popoverOpen]);

  const isSelected = (s: SavedScenario) =>
    selected.some((sel) => sel.date === s.date);

  const toggle = (s: SavedScenario) => {
    if (isSelected(s)) {
      onSelectionChange(selected.filter((sel) => sel.date !== s.date));
    } else if (selected.length < 3) {
      onSelectionChange([...selected, s]);
    }
  };

  const formatLabel = (s: SavedScenario) =>
    `${s.stxAmount.toLocaleString()} STX · ${s.isPool ? "Pool" : "Solo"} · ${s.lockCycles}c`;

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={selected.length > 0 ? "secondary" : "outline"}
          size="sm"
          className="gap-1.5 h-7 px-2 text-xs"
        >
          <Layers className="h-3 w-3" />
          Compare{selected.length > 0 && ` (${selected.length})`}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3 space-y-2">
        {scenarios.length === 0 ? (
          <p className="text-xs text-muted-foreground">No saved scenarios yet. Use the Save button to create one.</p>
        ) : (
        <>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Overlay saved scenarios (max 3)
        </p>
        {scenarios.map((s, i) => {
          const checked = isSelected(s);
          const colorIdx = checked ? selected.findIndex((sel) => sel.date === s.date) : -1;
          return (
            <label
              key={s.date + i}
              className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/50 rounded-md p-1.5 -mx-1.5 transition-colors"
            >
              <Checkbox
                checked={checked}
                disabled={!checked && selected.length >= 3}
                onCheckedChange={() => toggle(s)}
              />
              {checked && colorIdx >= 0 && (
                <span className={`h-2 w-2 rounded-full shrink-0 ${OVERLAY_COLORS[colorIdx].dot}`} />
              )}
              <span className="truncate">{formatLabel(s)}</span>
            </label>
          );
        })}
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-7 mt-1"
            onClick={() => onSelectionChange([])}
          >
            Clear all
          </Button>
        )}
        </>
        )}
      </PopoverContent>
    </Popover>
  );
}
