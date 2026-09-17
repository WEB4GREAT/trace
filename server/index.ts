import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import { getChain, listChains } from './chains/registry'
import { traceEvm } from './services/trace'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.disable('x-powered-by')

app.set('trust proxy', 1)

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
)

app.use(cors())

app.use(
  express.json({
    limit: '10kb',
  }),
)

const traceLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many trace requests. Try again shortly.',
  },
})

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'TRACE',
    version: '2',
  })
})

app.get('/api/chains', (_req, res) => {
  res.json({
    chains: listChains(),
  })
})

app.get(
  '/api/trace/:chain/:address',
  traceLimiter,
  async (req, res) => {
    const chainId = req.params.chain.toLowerCase()
    const address = req.params.address
    const chain = getChain(chainId)

    if (!chain) {
      return res.status(404).json({
        error: `Unknown network: ${chainId}`,
      })
    }

    if (!chain.live) {
      return res.status(501).json({
        error: `${chain.name} is being connected to TRACE.`,
        chain: chain.id,
        explorer: chain.explorer,
      })
    }

    if (chain.family !== 'evm') {
      return res.status(501).json({
        error: `${chain.name} adapter is not available yet.`,
      })
    }

    try {
      const result = await traceEvm(chain, address)
      return res.json(result)
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'AbortError'
      ) {
        return res.status(504).json({
          error: `${chain.name} data source timed out.`,
        })
      }

      console.error(
        `[TRACE] ${chain.name}:`,
        error,
      )

      return res.status(502).json({
        error: `${chain.name} data source is currently unavailable.`,
      })
    }
  },
)

app.use(express.static(path.resolve('dist')))

app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api/')
  ) {
    return res.sendFile(
      path.resolve('dist/index.html'),
    )
  }

  next()
})

app.use((_req, res) => {
  res.status(404).json({
    error: 'Not found',
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `TRACE V2 API running on http://localhost:${PORT}`,
  )
})
