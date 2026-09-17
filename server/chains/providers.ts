import type { ChainConfig } from './types'
import type { TransactionProvider } from './provider'
import { blockscoutProvider } from './blockscout'

export function getTransactionProvider(
  chain: ChainConfig,
): TransactionProvider {
  switch (chain.provider) {
    case 'blockscout':
      return blockscoutProvider

    default:
      throw new Error(
        `No free indexed transaction provider configured for ${chain.name}`,
      )
  }
}
