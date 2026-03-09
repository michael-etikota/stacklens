// StackLens API - Type Definitions

export interface PoxInfo {
  contract_id: string;
  pox_activation_threshold_ustx: number;
  first_burnchain_block_height: number;
  current_burnchain_block_height: number;
  prepare_phase_block_length: number;
  reward_phase_block_length: number;
  reward_slots: number;
  rejection_fraction: number;
  total_liquid_supply_ustx: number;
  current_cycle: {
    id: number;
    min_threshold_ustx: number;
    stacked_ustx: number;
    is_pox_active: boolean;
  };
  next_cycle: {
    id: number;
    min_threshold_ustx: number;
    min_increment_ustx: number;
    stacked_ustx: number;
    prepare_phase_start_block_height: number;
    blocks_until_prepare_phase: number;
    reward_phase_start_block_height: number;
    blocks_until_reward_phase: number;
    ustx_until_pox_rejection: number;
  };
  reward_cycle_id: number;
  reward_cycle_length: number;
  rejection_votes_left_required: number;
  next_reward_cycle_in: number;
}

export interface AccountInfo {
  balance: string;
  locked: string;
  unlock_height: number;
  nonce: number;
}

export interface StackingReward {
  canonical: boolean;
  burn_block_hash: string;
  burn_block_height: number;
  burn_amount: string;
  reward_recipient: string;
  reward_amount: string;
  reward_index: number;
}

export interface RewardCycle {
  id: number;
  startBlockHeight: number;
  endBlockHeight: number;
  phase: 'reward' | 'prepare';
  blocksRemaining: number;
  progress: number;
}

export interface StackingStats {
  currentCycle: RewardCycle;
  totalStacked: bigint;
  stackingThreshold: bigint;
  liquidSupply: bigint;
  stackingRatio: number;
  avgYieldBps: number;
  estimatedApy: number;
}

export interface RewardSimulation {
  stxAmount: bigint;
  lockCycles: number;
  estimatedBtcSats: bigint;
  estimatedBtc: number;
  yieldBps: number;
  annualizedYieldBps: number;
  userShareBps: number;
}

export interface PoolInfo {
  address: string;
  name: string;
  feeBps: number;
  minDelegation: bigint;
  totalDelegated: bigint;
  delegatorCount: number;
  isActive: boolean;
  performance?: {
    avgYieldBps: number;
    totalBtcEarned: bigint;
  };
}

export interface DelegationComparison {
  meetsSoloThreshold: boolean;
  stackingThreshold: bigint;
  soloEstimate?: RewardSimulation;
  poolEstimates: Array<{
    pool: PoolInfo;
    netBtcSats: bigint;
    feePaid: bigint;
  }>;
  recommendation: 'solo' | 'pool';
  recommendedPool?: PoolInfo;
}

export interface HistoricalYield {
  cycle: number;
  totalStacked: bigint;
  totalBtcRewards: bigint;
  avgYieldBps: number;
  numStackers: number;
  snapshotBlock: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
