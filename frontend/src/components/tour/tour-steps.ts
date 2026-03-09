export interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  placement: "top" | "bottom" | "left" | "right";
}

export const tourSteps: TourStep[] = [
  {
    targetSelector: '[data-tour="metrics"]',
    title: "Dashboard Metrics",
    description:
      "Track your STX balance, stacking status, APY, and BTC rewards at a glance.",
    placement: "bottom",
  },
  {
    targetSelector: '[data-tour="yield-chart"]',
    title: "Yield Performance",
    description:
      "Monitor your historical yield performance and compare against network averages.",
    placement: "top",
  },
  {
    targetSelector: '[data-tour="cycle-progress"]',
    title: "Cycle Progress",
    description:
      "See where we are in the current stacking cycle and when your next rewards are due.",
    placement: "left",
  },
  {
    targetSelector: '[data-tour="nav-simulator"]',
    title: "Reward Simulator",
    description:
      "Model potential returns before committing your STX to stacking.",
    placement: "right",
  },
  {
    targetSelector: '[data-tour="nav-pools"]',
    title: "Pool Explorer",
    description:
      "Compare delegation pools to find the best fit for your stacking strategy.",
    placement: "right",
  },
];
