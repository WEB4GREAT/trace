import type { ChainConfig } from './types'

export type ProviderTransaction = {
  hash?: string
  from?: {
    hash?: string
    is_contract?: boolean
    name?: string | null
  } | null
  to?: {
    hash?: string
    is_contract?: boolean
    name?: string | null
  } | null
  value?: string | null
  status?: string | null
  result?: string | null
  block_number?: number | null
  timestamp?: string | null
  gas_used?: string | null
}

export type TransactionProvider = {
  getTransactions(
    chain: ChainConfig,
    address: string,
  ): Promise<ProviderTransaction[]>
}
