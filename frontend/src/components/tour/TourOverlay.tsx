import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTour } from "@/contexts/TourContext";
import { tourSteps } from "./tour-steps";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;
const TOOLTIP_W_DESKTOP = 320;
const TOOLTIP_GAP = 12;

function getTargetRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function computeTooltipPos(rect: Rect, placement: string) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isMobile = vw < 768;
  const tooltipW = isMobile ? Math.min(300, vw - 24) : TOOLTIP_W_DESKTOP;
  const TOOLTIP_H = 180;

  // On mobile, force "top" placement when target is near the bottom (e.g. bottom nav)
  let effectivePlacement = placement;
  if (isMobile && (rect.top + rect.height) > vh * 0.75) {
    effectivePlacement = "top";
  }

  let top = 0;
  let left = 0;

  switch (effectivePlacement) {
    case "bottom":
      top = rect.top + rect.height + TOOLTIP_GAP;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
    case "top":
      top = rect.top - TOOLTIP_GAP - TOOLTIP_H;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
    case "right":
      top = rect.top + rect.height / 2 - 80;
      left = rect.left + rect.width + TOOLTIP_GAP;
      break;
    case "left":
      top = rect.top + rect.height / 2 - 80;
      left = rect.left - tooltipW - TOOLTIP_GAP;
      break;
  }

  const bottomReserve = isMobile ? 70 : 0;
  left = clamp(left, 12, vw - tooltipW - 12);
  top = clamp(top, 12, vh - 200 - bottomReserve);

  return { top, left, width: tooltipW };
}

// Haptic feedback helper
const triggerHaptic = () => {
  if (navigator.vibrate) navigator.vibrate(10);
};

export function TourOverlay() {
  const { isActive, currentStep, totalSteps, next, prev, skip } = useTour();
  const [rect, setRect] = useState<Rect | null>(null);
  const rafRef = useRef(0);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Wrap navigation with haptic feedback
  const handleNext = () => { triggerHaptic(); next(); };
  const handlePrev = () => { triggerHaptic(); prev(); };

  const updateRect = useCallback(() => {
    if (!isActive) return;
    const step = tourSteps[currentStep];
    if (!step) return;
    const r = getTargetRect(step.targetSelector);
    if (!r) {
      if (retryCountRef.current < 5) {
        retryCountRef.current++;
        retryTimerRef.current = setTimeout(updateRect, 300);
        return;
      }
      // Retries exhausted — auto-skip
      next();
      return;
    }
    setRect(r);
  }, [isActive, currentStep, next]);

  useEffect(() => {
    if (!isActive) return;
    retryCountRef.current = 0;
    clearTimeout(retryTimerRef.current);
    updateRect();

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateRect);
    };

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(retryTimerRef.current);
    };
  }, [isActive, currentStep, updateRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, next, prev, skip]);

  if (!isActive) return null;

  const step = tourSteps[currentStep];
  if (!step) return null;

  const tooltipPos = rect ? computeTooltipPos(rect, step.placement) : { top: window.innerHeight / 2 - 80, left: window.innerWidth / 2 - TOOLTIP_W_DESKTOP / 2, width: TOOLTIP_W_DESKTOP };

  return (
    <div className="fixed inset-0 z-[9999]" aria-live="polite" role="dialog" aria-label="Onboarding tour">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 transition-opacity duration-300" onClick={skip} />

      {/* Spotlight */}
      <AnimatePresence mode="wait">
        {rect && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed rounded-xl pointer-events-none"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
              zIndex: 9999,
            }}
          />
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="fixed z-[10000] rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl p-5"
          style={{ top: tooltipPos.top, left: tooltipPos.left, width: tooltipPos.width }}
        >
          {/* Close */}
          <button
            onClick={skip}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="pr-6">
            <div className="text-xs font-medium text-primary mb-1">
              Step {currentStep + 1} of {totalSteps}
            </div>
            <h3 className="text-base font-semibold mb-1.5">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-4 mb-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <motion.div
                key={i}
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: i === currentStep ? 1.1 : 1,
                  opacity: 1,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`h-1.5 rounded-full ${
                  i === currentStep
                    ? "w-4 bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                    : i < currentStep
                    ? "w-1.5 bg-primary/40"
                    : "w-1.5 bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={skip} className="text-xs text-muted-foreground">
              Skip tour
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrev} className="text-xs gap-1">
                  <ChevronLeft className="h-3 w-3" /> Back
                </Button>
              )}
              <Button size="sm" onClick={handleNext} className="text-xs gap-1">
                {currentStep === totalSteps - 1 ? "Finish" : "Next"} <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
