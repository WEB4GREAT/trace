import type { ChainConfig } from './types'

export const CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    shortName: 'ETH',
    family: 'evm',
    symbol: 'ETH',
    explorer: 'https://etherscan.io',
    provider: 'blockscout',
    api: 'https://eth.blockscout.com/api/v2',
    live: true,
  },

  base: {
    id: 'base',
    name: 'Base',
    shortName: 'BASE',
    family: 'evm',
    symbol: 'ETH',
    explorer: 'https://basescan.org',
    provider: 'blockscout',
    api: 'https://base.blockscout.com/api/v2',
    live: true,
  },

  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum',
    shortName: 'ARB',
    family: 'evm',
    symbol: 'ETH',
    explorer: 'https://arbiscan.io',
    provider: 'blockscout',
    api: 'https://arbitrum.blockscout.com/api/v2',
    live: true,
  },

  optimism: {
    id: 'optimism',
    name: 'Optimism',
    shortName: 'OP',
    family: 'evm',
    symbol: 'ETH',
    explorer: 'https://optimistic.etherscan.io',
    provider: 'blockscout',
    api: 'https://optimism.blockscout.com/api/v2',
    live: true,
  },

  polygon: {
    id: 'polygon',
    name: 'Polygon',
    shortName: 'POL',
    family: 'evm',
    symbol: 'POL',
    explorer: 'https://polygonscan.com',
    provider: 'blockscout',
    api: 'https://polygon.blockscout.com/api/v2',
    live: true,
  },

  bnb: {
    id: 'bnb',
    name: 'BNB Chain',
    shortName: 'BNB',
    family: 'evm',
    symbol: 'BNB',
    explorer: 'https://bscscan.com',
    provider: 'native',
    rpc: 'https://bsc-dataseed.bnbchain.org',
    live: false,
  },

  avalanche: {
    id: 'avalanche',
    name: 'Avalanche',
    shortName: 'AVAX',
    family: 'evm',
    symbol: 'AVAX',
    explorer: 'https://snowtrace.io',
    provider: 'native',
    rpc: 'https://api.avax.network/ext/bc/C/rpc',
    live: false,
  },

  solana: {
    id: 'solana',
    name: 'Solana',
    shortName: 'SOL',
    family: 'solana',
    symbol: 'SOL',
    explorer: 'https://explorer.solana.com',
    provider: 'native',
    live: false,
  },

  tron: {
    id: 'tron',
    name: 'TRON',
    shortName: 'TRX',
    family: 'tron',
    symbol: 'TRX',
    explorer: 'https://tronscan.org',
    provider: 'native',
    live: false,
  },

  sui: {
    id: 'sui',
    name: 'Sui',
    shortName: 'SUI',
    family: 'sui',
    symbol: 'SUI',
    explorer: 'https://suiexplorer.com',
    provider: 'native',
    live: false,
  },

  aptos: {
    id: 'aptos',
    name: 'Aptos',
    shortName: 'APT',
    family: 'aptos',
    symbol: 'APT',
    explorer: 'https://explorer.aptoslabs.com',
    provider: 'native',
    live: false,
  },

  ton: {
    id: 'ton',
    name: 'TON',
    shortName: 'TON',
    family: 'ton',
    symbol: 'TON',
    explorer: 'https://tonviewer.com',
    provider: 'native',
    live: false,
  },
}

export function getChain(id: string) {
  return CHAINS[id.toLowerCase()]
}

export function listChains() {
  return Object.values(CHAINS)
}
