export type ChainFamily =
  | 'evm'
  | 'solana'
  | 'tron'
  | 'sui'
  | 'aptos'
  | 'ton'

export type ChainConfig = {
  id: string
  name: string
  shortName: string
  family: ChainFamily
  symbol: string
  explorer: string
  provider: 'blockscout' | 'etherscan' | 'native'
  api?: string
  live: boolean
}

export type TraceTransaction = {
  hash: string | null
  from: string | null
  to: string | null
  value: string
  status: string | null
  block: number | null
  timestamp: string | null
  gasUsed: string | null
}

export type TraceCounterparty = {
  address: string
  isContract: boolean
  name: string | null
  count: number
  value: string
}

export type TraceResult = {
  chain: string
  chainId: string
  family: ChainFamily
  symbol: string
  explorer: string
  address: string
  transactions: TraceTransaction[]
  transactionCount: number
  connections: number
  counterparties: TraceCounterparty[]
}
