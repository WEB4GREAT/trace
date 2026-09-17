import type { ChainConfig } from './types'

type BlockscoutTransaction = {
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

export async function fetchEvmTransactions(
  chain: ChainConfig,
  address: string,
) {
  if (!chain.api) {
    throw new Error(`No EVM provider configured for ${chain.name}`)
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
      throw new Error(`Provider returned ${response.status}`)
    }

    const data = await response.json()

    return {
      items: Array.isArray(data.items)
        ? (data.items.slice(0, 60) as BlockscoutTransaction[])
        : [],
    }
  } finally {
    clearTimeout(timeout)
  }
}
