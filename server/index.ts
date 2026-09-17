import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import { getChain, listChains } from './chains/registry'
import { fetchEvmTransactions } from './chains/evm'

const app = express()
const PORT = Number(process.env.PORT) || 3001

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

function validAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'TRACE',
  })
})

app.get('/api/chains', (_req, res) => {
  res.json({
    chains: listChains(),
  })
})

app.get('/api/trace/:chain/:address', traceLimiter, async (req, res) => {
  const chainId = req.params.chain.toLowerCase()
  const address = req.params.address
  const chain = getChain(chainId)

  if (!chain) {
    return res.status(404).json({
      error: `Unsupported chain: ${chainId}`,
    })
  }

  if (chain.family !== 'evm') {
    return res.status(501).json({
      error: `${chain.name} adapter is not available yet`,
    })
  }

  if (!validAddress(address)) {
    return res.status(400).json({
      error: `Invalid ${chain.name} address`,
    })
  }

  try {
    const data = await fetchEvmTransactions(chain, address)
    const transactions = data.items

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
      chain: chain.name.toUpperCase(),
      chainId: chain.id,
      symbol: chain.symbol,
      explorer: chain.explorer,
      address,
      transactions: recentTransactions,
      transactionCount: transactions.length,
      connections: counterparties.size,
      counterparties: Array.from(counterparties.values()),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(504).json({
        error: `${chain.name} blockchain data source timed out`,
      })
    }

    console.error(`[TRACE] ${chain.name} error:`, error)

    return res.status(502).json({
      error: `${chain.name} blockchain data source unavailable`,
    })
  }
})

app.use(express.static(path.resolve('dist')))

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    return res.sendFile(path.resolve('dist/index.html'))
  }

  next()
})

app.use((_req, res) => {
  res.status(404).json({
    error: 'Not found',
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TRACE API running on http://localhost:${PORT}`)
})
