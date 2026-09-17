import type { ChainConfig } from './types'
import type {
  ProviderTransaction,
  TransactionProvider,
} from './provider'

export const blockscoutProvider: TransactionProvider = {
  async getTransactions(
    chain: ChainConfig,
    address: string,
  ): Promise<ProviderTransaction[]> {
    if (!chain.api) {
      throw new Error(
        `No Blockscout API configured for ${chain.name}`,
      )
    }

    const controller = new AbortController()

    const timeout = setTimeout(() => {
      controller.abort()
    }, 8_000)

    try {
      const response = await fetch(
        `${chain.api}/addresses/${address}/transactions`,
        {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        },
      )

      if (!response.ok) {
        throw new Error(
          `Blockscout ${chain.name} returned HTTP ${response.status}`,
        )
      }

      const data = await response.json()

      return Array.isArray(data.items)
        ? (data.items.slice(0, 60) as ProviderTransaction[])
        : []
    } finally {
      clearTimeout(timeout)
    }
  },
}
