// StackLens Mock Data Layer
// All data is realistic but fake — ready to swap for real API calls

export const MOCK_WALLET_ADDRESS = "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7";

export const mockStackingStats = {
  stxBalance: 125_430,
  currentlyStacked: 100_000,
  currentAPY: 9.8,
  apyChange: 0.4,
  cumulativeBtcRewards: 0.0847,
  btcUsdPrice: 62_350,
  stxUsdPrice: 1.82,
};

export const mockNetworkStats = {
  totalStacked: 1_420_000_000,
  averageAPY: 9.2,
  btcDistributed: 1_247.5,
  activeStackers: 12_840,
  currentCycle: 92,
  nextCycleBlocks: 420,
};

// Generate ~180 daily entries (Sep 2025 → Mar 2026) for time-range filtering
function generateDailyYieldHistory() {
  const entries: { date: string; apy: number; btcReward: number; networkApy: number; usdValue: number }[] = [];
  const start = new Date("2025-09-01");
  const end = new Date("2026-03-08");
  let apy = 8.2;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // Gentle random walk for APY
    apy += (Math.random() - 0.48) * 0.15;
    apy = Math.max(7.5, Math.min(10.5, apy));
    const btcReward = (apy / 100) * 100_000 * 1.82 / 62_350 / 365;
    const usdValue = btcReward * 62_350;
    const networkApy = 9.2 + (Math.random() - 0.5) * 0.2;
    entries.push({
      date: d.toISOString().slice(0, 10),
      apy: Math.round(apy * 10) / 10,
      btcReward: Math.round(btcReward * 10000) / 10000,
      networkApy: Math.round(networkApy * 10) / 10,
      usdValue: Math.round(usdValue * 100) / 100,
    });
  }
  return entries;
}

export const mockYieldHistory = generateDailyYieldHistory();

export const mockStackingPosition = {
  status: "active" as const,
  amountStacked: 100_000,
  lockPeriod: 6,
  cyclesCompleted: 3,
  cyclesRemaining: 3,
  startCycle: 89,
  endCycle: 95,
  unlockBurnHeight: 892_400,
  currentBurnHeight: 886_200,
  poolName: "FastPool",
};

export const mockCycleProgress = {
  currentCycle: 92,
  phase: "reward" as const,
  blocksElapsed: 1_400,
  totalBlocks: 2_100,
  eta: "~4 days 12 hours",
};

export const mockRecentActivity = [
  { id: "1", type: "reward" as const, amount: "0.0089 BTC", date: "2026-02-28", cycle: 91 },
  { id: "2", type: "reward" as const, amount: "0.0082 BTC", date: "2026-01-28", cycle: 90 },
  { id: "3", type: "stack" as const, amount: "100,000 STX", date: "2025-12-15", cycle: 89 },
  { id: "4", type: "reward" as const, amount: "0.0074 BTC", date: "2025-12-01", cycle: 88 },
  { id: "5", type: "reward" as const, amount: "0.0078 BTC", date: "2025-11-01", cycle: 87 },
];

export interface Pool {
  id: string;
  name: string;
  address: string;
  fee: number;
  apy: number;
  totalStacked: number;
  stackers: number;
  minAmount: number;
  status: "active" | "full" | "closing";
  verified: boolean;
  description: string;
  payoutSchedule: string;
  website: string;
  twitter?: string;
  performanceHistory: number[];
}

export const mockPools: Pool[] = [
  {
    id: "fastpool", name: "FastPool",
    address: "SP1FP0P3V1C5Q4A6ZKG8Y0Z0SXQMJ0D6Q9JNEAS1",
    fee: 5, apy: 9.6, totalStacked: 42_000_000, stackers: 2_100, minAmount: 100,
    status: "active", verified: true,
    description: "High-performance stacking pool with automatic reward distribution and 99.9% uptime.",
    payoutSchedule: "Every cycle (~2 weeks)", website: "https://fastpool.io", twitter: "https://x.com/fastpool",
    performanceHistory: [8.9, 9.1, 9.3, 9.2, 9.5, 9.6],
  },
  {
    id: "planbetter", name: "PlanBetter",
    address: "SP2K0P3V1C5Q4A6ZKG8Y0Z0SXQMJ0D6Q9JNEAS2",
    fee: 4.5, apy: 9.4, totalStacked: 38_500_000, stackers: 1_850, minAmount: 200,
    status: "active", verified: true,
    description: "Community-driven pool focused on transparency and competitive fees.",
    payoutSchedule: "Every cycle (~2 weeks)", website: "https://planbetter.fi",
    performanceHistory: [8.7, 8.9, 9.0, 9.1, 9.3, 9.4],
  },
  {
    id: "friedger", name: "Friedger Pool",
    address: "SP3K0P3V1C5Q4A6ZKG8Y0Z0SXQMJ0D6Q9JNEAS3",
    fee: 3, apy: 9.1, totalStacked: 28_000_000, stackers: 980, minAmount: 500,
    status: "active", verified: true,
    description: "One of the original Stacks stacking pools, run by core ecosystem contributor Friedger.",
    payoutSchedule: "Every cycle (~2 weeks)", website: "https://pool.friedger.de",
    performanceHistory: [8.5, 8.6, 8.8, 8.9, 9.0, 9.1],
  },
  {
    id: "xverse", name: "Xverse Pool",
    address: "SP4K0P3V1C5Q4A6ZKG8Y0Z0SXQMJ0D6Q9JNEAS4",
    fee: 5, apy: 9.5, totalStacked: 55_000_000, stackers: 3_200, minAmount: 100,
    status: "active", verified: true,
    description: "Backed by the Xverse wallet team with seamless in-app delegation.",
    payoutSchedule: "Every cycle (~2 weeks)", website: "https://xverse.app",
    performanceHistory: [9.0, 9.1, 9.3, 9.2, 9.4, 9.5],
  },
  {
    id: "stacked", name: "Stacked Labs",
    address: "SP5K0P3V1C5Q4A6ZKG8Y0Z0SXQMJ0D6Q9JNEAS5",
    fee: 6, apy: 9.2, totalStacked: 22_000_000, stackers: 720, minAmount: 50,
    status: "active", verified: false,
    description: "Low minimum pool designed for smaller stackers entering the ecosystem.",
    payoutSchedule: "Every cycle (~2 weeks)", website: "https://stackedlabs.io",
    performanceHistory: [8.4, 8.6, 8.9, 9.0, 9.1, 9.2],
  },
  {
    id: "megapool", name: "MegaPool",
    address: "SP6K0P3V1C5Q4A6ZKG8Y0Z0SXQMJ0D6Q9JNEAS6",
    fee: 4, apy: 9.3, totalStacked: 68_000_000, stackers: 4_100, minAmount: 100,
    status: "full", verified: true,
    description: "The largest stacking pool by TVL. Currently at capacity — join the waitlist.",
    payoutSchedule: "Every cycle (~2 weeks)", website: "https://megapool.stx",
    performanceHistory: [9.0, 9.1, 9.2, 9.3, 9.3, 9.3],
  },
  {
    id: "stacksbridge", name: "StacksBridge Pool",
    address: "SP7K0P3V1C5Q4A6ZKG8Y0Z0SXQMJ0D6Q9JNEAS7",
    fee: 5.5, apy: 8.8, totalStacked: 15_000_000, stackers: 450, minAmount: 250,
    status: "closing", verified: false,
    description: "Winding down operations. Delegators should migrate before cycle 95.",
    payoutSchedule: "Every cycle (~2 weeks)", website: "https://stacksbridge.xyz",
    performanceHistory: [9.0, 8.9, 8.8, 8.7, 8.8, 8.8],
  },
  {
    id: "stackingdao", name: "StackingDAO",
    address: "SP8K0P3V1C5Q4A6ZKG8Y0Z0SXQMJ0D6Q9JNEAS8",
    fee: 3.5, apy: 9.7, totalStacked: 82_000_000, stackers: 5_600, minAmount: 100,
    status: "active", verified: true,
    description: "Liquid stacking protocol with stSTX token. Highest APY through DeFi composability.",
    payoutSchedule: "Continuous (liquid)", website: "https://stackingdao.com", twitter: "https://x.com/stackingdao",
    performanceHistory: [9.2, 9.3, 9.4, 9.5, 9.6, 9.7],
  },
];

export interface Transaction {
  id: string;
  type: "reward" | "stack" | "unstack" | "delegate";
  amount: string;
  currency: "STX" | "BTC";
  date: string;
  cycle: number;
  txId: string;
  status: "confirmed" | "pending";
  usdValue: number;
}

export const mockTransactionHistory: Transaction[] = [
  { id: "t1", type: "reward", amount: "0.0089", currency: "BTC", date: "2026-02-28", cycle: 91, txId: "0xabc123def456789...1a2b", status: "confirmed", usdValue: 554.92 },
  { id: "t2", type: "reward", amount: "0.0082", currency: "BTC", date: "2026-01-28", cycle: 90, txId: "0xdef456abc789012...3c4d", status: "confirmed", usdValue: 511.27 },
  { id: "t3", type: "stack", amount: "100,000", currency: "STX", date: "2025-12-15", cycle: 89, txId: "0x789012abc345def...5e6f", status: "confirmed", usdValue: 182000 },
  { id: "t4", type: "reward", amount: "0.0074", currency: "BTC", date: "2025-12-01", cycle: 88, txId: "0x012345def678abc...7g8h", status: "confirmed", usdValue: 461.39 },
  { id: "t5", type: "reward", amount: "0.0078", currency: "BTC", date: "2025-11-01", cycle: 87, txId: "0x345678abc901def...9i0j", status: "confirmed", usdValue: 486.33 },
  { id: "t6", type: "delegate", amount: "100,000", currency: "STX", date: "2025-12-14", cycle: 89, txId: "0x678901def234abc...1k2l", status: "confirmed", usdValue: 182000 },
  { id: "t7", type: "reward", amount: "0.0065", currency: "BTC", date: "2025-10-01", cycle: 86, txId: "0x901234abc567def...3m4n", status: "confirmed", usdValue: 405.28 },
  { id: "t8", type: "reward", amount: "0.0071", currency: "BTC", date: "2025-09-01", cycle: 85, txId: "0x234567def890abc...5o6p", status: "confirmed", usdValue: 442.69 },
  { id: "t9", type: "unstack", amount: "50,000", currency: "STX", date: "2025-08-15", cycle: 84, txId: "0x567890abc123def...7q8r", status: "confirmed", usdValue: 91000 },
  { id: "t10", type: "stack", amount: "50,000", currency: "STX", date: "2025-06-01", cycle: 79, txId: "0x890123def456abc...9s0t", status: "confirmed", usdValue: 91000 },
  { id: "t11", type: "reward", amount: "0.0058", currency: "BTC", date: "2025-08-01", cycle: 83, txId: "0xaaa111bbb222ccc...1u2v", status: "confirmed", usdValue: 361.63 },
  { id: "t12", type: "reward", amount: "0.0062", currency: "BTC", date: "2025-07-01", cycle: 82, txId: "0xbbb222ccc333ddd...3w4x", status: "confirmed", usdValue: 386.57 },
  { id: "t13", type: "delegate", amount: "50,000", currency: "STX", date: "2025-05-31", cycle: 79, txId: "0xccc333ddd444eee...5y6z", status: "confirmed", usdValue: 91000 },
  { id: "t14", type: "reward", amount: "0.0055", currency: "BTC", date: "2025-06-01", cycle: 81, txId: "0xddd444eee555fff...7a8b", status: "confirmed", usdValue: 342.93 },
  { id: "t15", type: "reward", amount: "0.0052", currency: "BTC", date: "2025-05-01", cycle: 80, txId: "0xeee555fff666ggg...9c0d", status: "confirmed", usdValue: 324.22 },
  { id: "t16", type: "stack", amount: "25,000", currency: "STX", date: "2025-03-15", cycle: 76, txId: "0xfff666ggg777hhh...1e2f", status: "confirmed", usdValue: 45500 },
  { id: "t17", type: "reward", amount: "0.0048", currency: "BTC", date: "2025-04-01", cycle: 79, txId: "0xggg777hhh888iii...3g4h", status: "confirmed", usdValue: 299.28 },
  { id: "t18", type: "reward", amount: "0.0044", currency: "BTC", date: "2025-03-01", cycle: 78, txId: "0xhhh888iii999jjj...5i6j", status: "confirmed", usdValue: 274.34 },
  { id: "t19", type: "reward", amount: "0.0091", currency: "BTC", date: "2026-03-02", cycle: 92, txId: "0xiii999jjj000kkk...7k8l", status: "pending", usdValue: 567.39 },
  { id: "t20", type: "reward", amount: "0.0040", currency: "BTC", date: "2025-02-01", cycle: 77, txId: "0xjjj000kkk111lll...9m0n", status: "confirmed", usdValue: 249.40 },
];

// Simulator calculation (mock)
export function calculateRewards(
  stxAmount: number,
  lockCycles: number,
  mode: "solo" | "pool",
  poolFee: number = 5,
) {
  const baseAPY = mode === "solo" ? 10.2 : 9.6;
  const effectiveAPY = mode === "pool" ? baseAPY * (1 - poolFee / 100) : baseAPY;
  const annualBtcReward = (stxAmount * 1.82 * effectiveAPY) / 100 / 62_350;
  const cycleReward = annualBtcReward / 26;
  const totalBtcReward = cycleReward * lockCycles;
  const totalUsdReward = totalBtcReward * 62_350;

  return {
    apy: effectiveAPY,
    btcPerCycle: cycleReward,
    totalBtc: totalBtcReward,
    totalUsd: totalUsdReward,
    projections: Array.from({ length: lockCycles }, (_, i) => ({
      cycle: i + 1,
      cumulativeBtc: cycleReward * (i + 1),
      cumulativeUsd: cycleReward * (i + 1) * 62_350,
    })),
  };
}
