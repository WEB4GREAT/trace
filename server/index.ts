import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

const app = express()
const PORT = 3001

app.disable('x-powered-by')

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10kb' }))

const traceLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many trace requests. Try again shortly.',
  },
})

const BASE_API = 'https://base.blockscout.com/api/v2'

type BlockscoutTransaction = {
  hash?: string
  from?: { hash?: string; is_contract?: boolean; name?: string | null } | null
  to?: { hash?: string; is_contract?: boolean; name?: string | null } | null
  value?: string | null
  status?: string | null
  result?: string | null
  block_number?: number | null
  timestamp?: string | null
  gas_used?: string | null
}

function validAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'online' })
})

app.get('/api/trace/base/:address', traceLimiter, async (req, res) => {
  const address = req.params.address

  if (!validAddress(address)) {
    return res.status(400).json({
      error: 'Invalid Base address',
    })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const response = await fetch(
      `${BASE_API}/addresses/${address}/transactions`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      },
    )

    if (!response.ok) {
      return res.status(502).json({
        error: 'Blockchain data source unavailable',
      })
    }

    const data = await response.json()
    const transactions: BlockscoutTransaction[] = Array.isArray(data.items)
      ? data.items.slice(0, 50)
      : []

    const counterparties = new Map<
      string,
      {
        address: string
        isContract: boolean
        name: string | null
        count: number
        value: string
      }
    >()

    for (const tx of transactions) {
      const from = tx.from?.hash?.toLowerCase()
      const to = tx.to?.hash?.toLowerCase()

      if (!from || !to) continue

      const counterparty =
        from === address.toLowerCase() ? tx.to : tx.from

      if (!counterparty?.hash) continue

      const key = counterparty.hash.toLowerCase()
      const existing = counterparties.get(key)

      if (existing) {
        existing.count += 1
      } else {
        counterparties.set(key, {
          address: counterparty.hash,
          isContract: Boolean(counterparty.is_contract),
          name: counterparty.name ?? null,
          count: 1,
          value: tx.value ?? '0',
        })
      }
    }

    const recentTransactions = transactions
      .slice(0, 12)
      .map((tx) => ({
        hash: tx.hash,
        from: tx.from?.hash ?? null,
        to: tx.to?.hash ?? null,
        value: tx.value ?? '0',
        status: tx.status ?? tx.result ?? null,
        block: tx.block_number ?? null,
        timestamp: tx.timestamp ?? null,
        gasUsed: tx.gas_used ?? null,
      }))

    return res.json({
      chain: 'BASE',
      address,
      transactions: recentTransactions,
      transactionCount: transactions.length,
      connections: counterparties.size,
      counterparties: Array.from(counterparties.values()),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(504).json({
        error: 'Blockchain data source timed out',
      })
    }

    return res.status(502).json({
      error: 'Failed to fetch blockchain data',
    })
  } finally {
    clearTimeout(timeout)
  }
})

app.use((_req, res) => {
  res.status(404).json({
    error: 'Not found',
  })
})

app.listen(PORT, () => {
  console.log(`TRACE API running on http://localhost:${PORT}`)
})
