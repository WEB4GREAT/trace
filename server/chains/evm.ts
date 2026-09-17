import type { ChainConfig } from './types'
import { getTransactionProvider } from './providers'

export async function fetchEvmTransactions(
  chain: ChainConfig,
  address: string,
) {
  const provider = getTransactionProvider(chain)

  const items = await provider.getTransactions(
    chain,
    address,
  )

  return {
    items,
  }
}
