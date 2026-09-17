export type ChainConfig = {
  id: string
  name: string
  family: 'evm'
  symbol: string
  explorer: string
  api: string
}

export const CHAINS: Record<string, ChainConfig> = {
  base: {
    id: 'base',
    name: 'Base',
    family: 'evm',
    symbol: 'ETH',
    explorer: 'https://base.blockscout.com',
    api: 'https://base.blockscout.com/api/v2',
  },

  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    family: 'evm',
    symbol: 'ETH',
    explorer: 'https://eth.blockscout.com',
    api: 'https://eth.blockscout.com/api/v2',
  },

  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum',
    family: 'evm',
    symbol: 'ETH',
    explorer: 'https://arbitrum.blockscout.com',
    api: 'https://arbitrum.blockscout.com/api/v2',
  },

  optimism: {
    id: 'optimism',
    name: 'Optimism',
    family: 'evm',
    symbol: 'ETH',
    explorer: 'https://optimism.blockscout.com',
    api: 'https://optimism.blockscout.com/api/v2',
  },

  polygon: {
    id: 'polygon',
    name: 'Polygon',
    family: 'evm',
    symbol: 'POL',
    explorer: 'https://polygon.blockscout.com',
    api: 'https://polygon.blockscout.com/api/v2',
  },

}

export function getChain(id: string) {
  return CHAINS[id.toLowerCase()]
}

export function listChains() {
  return Object.values(CHAINS)
}
