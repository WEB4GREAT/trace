import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowUpRight,
  FiCheck,
  FiCopy,
  FiExternalLink,
  FiSearch,
} from 'react-icons/fi'

type Chain = {
  id: string
  name: string
  family: string
  symbol: string
  explorer: string
}

type TraceTransaction = {
  hash?: string
  from?: unknown
  to?: unknown
  value?: string | null
  status?: string | null
  result?: string | null
  block_number?: number | null
  timestamp?: string | null
  gas_used?: string | null
}

type Counterparty = {
  address?: string
  count?: number
  isContract?: boolean
  name?: string | null
}

type TraceResult = {
  chain?: string
  chainId?: string
  symbol?: string
  explorer?: string
  address: string
  transactions: TraceTransaction[]
  transactionCount: number
  connections: number
  counterparties: Counterparty[]
}

function normalizeAddress(value: unknown): string {
  if (typeof value === 'string') return value

  if (value && typeof value === 'object') {
    const item = value as { address?: unknown; hash?: unknown }

    if (typeof item.address === 'string') return item.address
    if (typeof item.hash === 'string') return item.hash
  }

  return ''
}

function shortAddress(value: unknown): string {
  const address = normalizeAddress(value)

  if (!address) return '—'
  if (address.length <= 14) return address

  return `${address.slice(0, 6)}…${address.slice(-6)}`
}

function ethValue(value: unknown, symbol = 'ETH'): string {
  if (typeof value !== 'string' || !value) return `0 ${symbol}`

  try {
    const amount = Number(value) / 1e18

    if (!Number.isFinite(amount)) return `0 ${symbol}`

    return `${amount.toFixed(amount >= 1 ? 4 : 6)} ${symbol}`
  } catch {
    return `0 ${symbol}`
  }
}

function formatDate(value?: string | null): string {
  if (!value) return 'Unknown'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Unknown'

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Logo() {
  return (
    <div className="brand-mark" aria-label="TRACE">
      <span className="brand-dot" />
      <span>TRACE</span>
    </div>
  )
}

function SearchIcon() {
  return <FiSearch className="search-icon" />
}

function ArrowUpRight() {
  return <FiArrowUpRight />
}

function CopyIcon() {
  return <FiCopy />
}

function NetworkMap({
  address,
  counterparties,
}: {
  address: string
  counterparties: Counterparty[]
}) {
  const nodes = counterparties.slice(0, 8)

  return (
    <div className="network-map">
      <div className="network-grid" />

      <div className="network-lines">
        {nodes.map((_, index) => {
          const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2
          const x = 50 + Math.cos(angle) * 31
          const y = 50 + Math.sin(angle) * 31

          return (
            <div
              className="network-line"
              key={`${index}-${x}-${y}`}
              style={{
                left: '50%',
                top: '50%',
                width: `${Math.sqrt(
                  Math.pow(x - 50, 2) + Math.pow(y - 50, 2),
                )}%`,
                transform: `rotate(${Math.atan2(y - 50, x - 50)}rad)`,
              }}
            />
          )
        })}
      </div>

      <div className="center-node">
        <div className="center-pulse" />
        <div className="center-node-inner">
          <span>WALLET</span>
          <strong>{shortAddress(address)}</strong>
        </div>
      </div>

      {nodes.map((item, index) => {
        const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2
        const x = 50 + Math.cos(angle) * 31
        const y = 50 + Math.sin(angle) * 31

        return (
          <div
            className="counterparty-node"
            key={`${item.address}-${index}`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
          >
            <div className="counterparty-orb" />
            <div className="counterparty-card">
              <span>{item.name || (item.isContract ? 'CONTRACT' : 'WALLET')}</span>
              <strong>{shortAddress(item.address)}</strong>
              <small>{item.count || 0} TX</small>
            </div>
          </div>
        )
      })}

      {!nodes.length && (
        <div className="empty-map">
          <span>NO CONNECTIONS</span>
          <strong>No transaction relationships found.</strong>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [address, setAddress] = useState('')
  const [chains, setChains] = useState<Chain[]>([])
  const [selectedChain, setSelectedChain] = useState('base')
  const [result, setResult] = useState<TraceResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [selected, setSelected] = useState<TraceTransaction | null>(null)

  useEffect(() => {
    async function loadChains() {
      try {
        const response = await fetch('/api/chains')

        if (!response.ok) throw new Error('Unable to load networks')

        const data = await response.json()

        if (Array.isArray(data.chains) && data.chains.length) {
          setChains(data.chains)
        }
      } catch {
        setChains([
          {
            id: 'base',
            name: 'Base',
            family: 'evm',
            symbol: 'ETH',
            explorer: 'https://base.blockscout.com',
          },
        ])
      }
    }

    loadChains()
  }, [])

  const activeChain = useMemo(() => {
    return (
      chains.find((item) => item.id === selectedChain) ||
      chains.find((item) => item.id === result?.chainId) ||
      null
    )
  }, [chains, selectedChain, result?.chainId])

  const chainName =
    result?.chain || activeChain?.name || 'Base'

  const symbol =
    result?.symbol || activeChain?.symbol || 'ETH'

  const explorer =
    result?.explorer ||
    activeChain?.explorer ||
    'https://base.blockscout.com'

  async function traceWallet() {
    const value = address.trim()

    if (!value || loading) return

    setLoading(true)
    setError('')
    setResult(null)
    setSelected(null)

    try {
      const response = await fetch(
        `/api/trace/${selectedChain}/${encodeURIComponent(value)}`,
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to trace wallet')
      }

      setResult(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'TRACE API is currently unavailable',
      )
    } finally {
      setLoading(false)
    }
  }

  async function copyAddress() {
    if (!result?.address) return

    try {
      await navigator.clipboard.writeText(result.address)
      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1600)
    } catch {
      setCopied(false)
    }
  }

  const transactions = result?.transactions || []
  const counterparties = result?.counterparties || []

  return (
    <div className="app-shell">
      <header className="topbar">
        <Logo />

        <div className="topbar-right">
          <div className="network-pill">
            <span className="status-dot" />
            <span>{chainName.toUpperCase()}</span>
          </div>

          <div className="version-label">V2</div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span />
              ON-CHAIN INTELLIGENCE
            </div>

            <h1>
              See the
              <br />
              <span>trail.</span>
            </h1>

            <p className="hero-description">
              Turn a public wallet into a living map of its on-chain
              relationships, counterparties and activity.
            </p>
          </div>

          <div className="search-panel">
            <div className="search-label">
              <span>PUBLIC WALLET</span>
              <span>SELECT NETWORK</span>
            </div>

            <div className="search-row">
              <SearchIcon />

              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') traceWallet()
                }}
                placeholder="Paste a public wallet address..."
                spellCheck={false}
              />

              <select
                value={selectedChain}
                onChange={(event) => {
                  setSelectedChain(event.target.value)
                  setResult(null)
                  setError('')
                }}
                aria-label="Select blockchain network"
              >
                {chains.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              <button
                className="trace-button"
                onClick={traceWallet}
                disabled={!address.trim() || loading}
              >
                {loading ? 'TRACING' : 'TRACE'}
                <ArrowUpRight />
              </button>
            </div>
          </div>

          <div className="hero-footer">
            <span>NO WALLET CONNECTION</span>
            <span>PUBLIC DATA ONLY</span>
            <span>READ-ONLY INTELLIGENCE</span>
          </div>
        </section>

        {error && (
          <section className="error-panel">
            <div>
              <span>TRACE ERROR</span>
              <strong>{error}</strong>
            </div>

            <button onClick={traceWallet}>RETRY</button>
          </section>
        )}

        {result && (
          <section className="results">
            <div className="results-header">
              <div>
                <div className="section-kicker">
                  <span />
                  {chainName.toUpperCase()} TRACE
                </div>

                <h2>Wallet intelligence</h2>

                <div className="address-row">
                  <span>{shortAddress(result.address)}</span>

                  <button onClick={copyAddress} aria-label="Copy address">
                    {copied ? <FiCheck /> : <CopyIcon />}
                  </button>

                  <a
                    href={`${explorer}/address/${result.address}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open address in explorer"
                  >
                    <FiExternalLink />
                  </a>
                </div>
              </div>

              <div className="result-stats">
                <div>
                  <span>TRANSACTIONS</span>
                  <strong>{result.transactionCount}</strong>
                </div>

                <div>
                  <span>CONNECTIONS</span>
                  <strong>{result.connections}</strong>
                </div>
              </div>
            </div>

            <div className="trace-grid">
              <div className="map-panel">
                <div className="panel-heading">
                  <div>
                    <span>NETWORK MAP</span>
                    <strong>RELATIONSHIPS</strong>
                  </div>

                  <div className="live-indicator">
                    <span />
                    LIVE
                  </div>
                </div>

                <NetworkMap
                  address={result.address}
                  counterparties={counterparties}
                />
              </div>

              <div className="activity-panel">
                <div className="panel-heading">
                  <div>
                    <span>RECENT ACTIVITY</span>
                    <strong>{symbol}</strong>
                  </div>

                  <span className="activity-count">
                    {transactions.length} EVENTS
                  </span>
                </div>

                <div className="transaction-list">
                  {transactions.length ? (
                    transactions.slice(0, 12).map((tx, index) => (
                      <button
                        className={`transaction-row ${
                          selected === tx ? 'is-selected' : ''
                        }`}
                        key={`${tx.hash || 'tx'}-${index}`}
                        onClick={() => setSelected(tx)}
                      >
                        <div className="tx-index">
                          {String(index + 1).padStart(2, '0')}
                        </div>

                        <div className="tx-main">
                          <strong>
                            {shortAddress(tx.from)} → {shortAddress(tx.to)}
                          </strong>

                          <span>
                            {formatDate(tx.timestamp)}
                            {tx.status ? ` · ${tx.status}` : ''}
                          </span>
                        </div>

                        <div className="tx-value">
                          {ethValue(tx.value, symbol)}
                        </div>

                        <FiArrowUpRight />
                      </button>
                    ))
                  ) : (
                    <div className="empty-state">
                      <span>NO ACTIVITY</span>
                      <strong>No transactions found on this network.</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selected && (
              <div className="transaction-detail">
                <div>
                  <span>SELECTED TRANSACTION</span>
                  <strong>{shortAddress(selected.hash)}</strong>
                </div>

                {selected.hash && (
                  <a
                    href={`${explorer}/tx/${selected.hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    VIEW ON EXPLORER
                    <FiExternalLink />
                  </a>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      <footer>
        <Logo />

        <span>TRACE / V2</span>

        <span>
          PUBLIC WALLET INTELLIGENCE
          <span className="footer-dot">·</span>
          MULTI-CHAIN
        </span>
      </footer>
    </div>
  )
}
