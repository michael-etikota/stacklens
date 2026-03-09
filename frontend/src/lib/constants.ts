// StackLens Constants & Configuration

export const NETWORK_CONFIG = {
  testnet: {
    label: 'Testnet',
    apiUrl: 'https://api.testnet.hiro.so',
    explorerUrl: 'https://explorer.hiro.so/?chain=testnet',
    backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
    contracts: {
      deployer: 'ST3VT4WYWYHS64PVJ6DBAHJ2RP14V9SCMZ73ZK4N5',
      rewardSimulator: 'ST3VT4WYWYHS64PVJ6DBAHJ2RP14V9SCMZ73ZK4N5.reward-simulator',
      stackingAnalytics: 'ST3VT4WYWYHS64PVJ6DBAHJ2RP14V9SCMZ73ZK4N5.stacking-analytics',
    },
    cycleLength: 1050,
    preparePhaseLength: 50,
  },
  mainnet: {
    label: 'Mainnet',
    apiUrl: 'https://api.hiro.so',
    explorerUrl: 'https://explorer.hiro.so',
    backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
    contracts: {
      deployer: '',
      rewardSimulator: '',
      stackingAnalytics: '',
    },
    cycleLength: 2100,
    preparePhaseLength: 100,
  },
} as const;

export type NetworkId = keyof typeof NETWORK_CONFIG;

// Stacking constants
export const STACKING = {
  MIN_LOCK_CYCLES: 1,
  MAX_LOCK_CYCLES: 12,
  CYCLES_PER_YEAR: 26,
  MICRO_STX_PER_STX: 1_000_000,
  SATS_PER_BTC: 100_000_000,
} as const;
