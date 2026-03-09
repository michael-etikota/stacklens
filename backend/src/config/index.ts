// StackLens API Configuration

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001'),
  host: process.env.HOST || '0.0.0.0',
  
  // Network
  network: (process.env.STACKS_NETWORK || 'testnet') as 'mainnet' | 'testnet',
  
  // API URLs
  apiUrls: {
    mainnet: 'https://api.hiro.so',
    testnet: 'https://api.testnet.hiro.so',
  },
  
  // Cache TTL (seconds)
  cache: {
    poxInfo: 60,          // 1 minute
    accountInfo: 30,       // 30 seconds
    stackingRewards: 300,  // 5 minutes
    historicalData: 3600,  // 1 hour
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 60000,       // 1 minute
    maxRequests: 100,
  },
  
  // Stacking constants
  stacking: {
    cyclesPerYear: 26,     // ~26 two-week cycles per year
    rewardCycleLength: {
      mainnet: 2100,
      testnet: 1050,
    },
    preparePhaseLength: {
      mainnet: 100,
      testnet: 50,
    },
    minLockCycles: 1,
    maxLockCycles: 12,
  },
  
  // Deployed StackLens contracts
  contracts: {
    deployer: 'ST3VT4WYWYHS64PVJ6DBAHJ2RP14V9SCMZ73ZK4N5',
    rewardSimulator: {
      testnet: 'ST3VT4WYWYHS64PVJ6DBAHJ2RP14V9SCMZ73ZK4N5.reward-simulator',
      mainnet: '', // To be deployed
    },
    stackingAnalytics: {
      testnet: 'ST3VT4WYWYHS64PVJ6DBAHJ2RP14V9SCMZ73ZK4N5.stacking-analytics',
      mainnet: '', // To be deployed
    },
  },
  
  // Known delegation pools (can be fetched from contract or configured)
  knownPools: [
    {
      address: 'SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox4-pools',
      name: 'Friedger Pool',
      feeBps: 500,  // 5%
    },
    {
      address: 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.stacking-pool-pox-4-v1',
      name: 'Fast Pool',
      feeBps: 400,  // 4%
    },
  ],
} as const;

export function getContractAddress(contractName: 'rewardSimulator' | 'stackingAnalytics'): string {
  return config.contracts[contractName][config.network];
}

export function getApiUrl(): string {
  return config.apiUrls[config.network];
}

export function getRewardCycleLength(): number {
  return config.stacking.rewardCycleLength[config.network];
}

export function getPreparePhaseLength(): number {
  return config.stacking.preparePhaseLength[config.network];
}
