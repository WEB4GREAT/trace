import { fetchEvmTransactions } from '../chains/evm'
import type {
  ChainConfig,
  TraceCounterparty,
  TraceResult,
} from '../chains/types'

function validEvmAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export async function traceEvm(
  chain: ChainConfig,
  address: string,
): Promise<TraceResult> {
  if (!validEvmAddress(address)) {
    throw new Error(`Invalid ${chain.name} address`)
  }

  const data = await fetchEvmTransactions(chain, address)
  const transactions = data.items

  const counterparties = new Map<string, TraceCounterparty>()

  for (const tx of transactions) {
    const from = tx.from?.hash?.toLowerCase()
    const to = tx.to?.hash?.toLowerCase()

    if (!from || !to) continue

    const counterparty =
      from === address.toLowerCase()
        ? tx.to
        : tx.from

    if (!counterparty?.hash) continue

    const key = counterparty.hash.toLowerCase()
    const existing = counterparties.get(key)

    if (existing) {
      existing.count += 1
      continue
    }

    counterparties.set(key, {
      address: counterparty.hash,
      isContract: Boolean(counterparty.is_contract),
      name: counterparty.name ?? null,
      count: 1,
      value: tx.value ?? '0',
    })
  }

  return {
    chain: chain.name,
    chainId: chain.id,
    family: chain.family,
    symbol: chain.symbol,
    explorer: chain.explorer,
    address,
    transactions: transactions.slice(0, 20).map((tx) => ({
      hash: tx.hash ?? null,
      from: tx.from?.hash ?? null,
      to: tx.to?.hash ?? null,
      value: tx.value ?? '0',
      status: tx.status ?? tx.result ?? null,
      block: tx.block_number ?? null,
      timestamp: tx.timestamp ?? null,
      gasUsed: tx.gas_used ?? null,
    })),
    transactionCount: transactions.length,
    connections: counterparties.size,
    counterparties: Array.from(counterparties.values()).slice(0, 30),
  }
}
