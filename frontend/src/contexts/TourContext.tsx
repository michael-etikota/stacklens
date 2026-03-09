import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { tourSteps } from "@/components/tour/tour-steps";

interface TourContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  next: () => void;
  prev: () => void;
  skip: () => void;
  startTour: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

const STORAGE_KEY = "stacklens-tour-completed";

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const next = useCallback(() => {
    if (currentStep >= tourSteps.length - 1) {
      completeTour();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, completeTour]);

  const prev = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const skip = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  return (
    <TourContext.Provider
      value={{ isActive, currentStep, totalSteps: tourSteps.length, next, prev, skip, startTour }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

export function useTourAutoStart(walletConnected: boolean) {
  const { isActive, startTour } = useTour();
  // Call once on dashboard mount — only if wallet is connected so tour targets exist
  const tryAutoStart = useCallback(() => {
    if (!isActive && walletConnected && localStorage.getItem(STORAGE_KEY) !== "true") {
      // Small delay to let DOM render
      setTimeout(startTour, 600);
    }
  }, [isActive, walletConnected, startTour]);
  return tryAutoStart;
}
