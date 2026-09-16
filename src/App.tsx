import { useMemo, useState } from 'react'
import './App.css'

type TraceTransaction = {
  hash?: string
  from?: unknown
  to?: unknown
  value?: unknown
  timestamp?: string
  status?: string
  method?: string
  block?: number | string
}

type Counterparty = {
  address?: unknown
  hash?: unknown
  name?: string
  type?: string
  count?: number
  transactionCount?: number
  value?: unknown
}

type TraceResult = {
  chain: string
  address: string
  transactions: TraceTransaction[]
  transactionCount: number
  connections: number
  counterparties: Counterparty[]
}

function normalizeAddress(value: unknown): string {
  if (typeof value === 'string') return value

  if (value && typeof value === 'object') {
    const object = value as {
      address?: unknown
      hash?: unknown
    }

    if (typeof object.address === 'string') return object.address
    if (typeof object.hash === 'string') return object.hash
  }

  return String(value ?? '')
}

function shortAddress(value: unknown, left = 6, right = 4) {
  const text = normalizeAddress(value)

  if (!text) return 'Unknown'

  if (text.length <= left + right + 1) return text

  return `${text.slice(0, left)}…${text.slice(-right)}`
}

function ethValue(value: unknown) {
  const raw = normalizeAddress(value)

  if (!raw || raw === '0') return '0 ETH'

  try {
    const number = Number(raw)

    if (!Number.isFinite(number)) return '—'

    if (number === 0) return '0 ETH'

    if (number < 0.0001) {
      return `${number.toFixed(6)} ETH`
    }

    return `${number.toFixed(4)} ETH`
  } catch {
    return '—'
  }
}

function formatDate(value?: string) {
  if (!value) return 'Unknown time'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Unknown time'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function Logo() {
  return (
    <div className="brand-mark" aria-label="TRACE">
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 8H23"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M15 8V22"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="7" cy="8" r="2.5" fill="currentColor" />
        <circle cx="23" cy="8" r="2.5" fill="currentColor" />
        <circle cx="15" cy="22" r="2.5" fill="currentColor" />
        <path
          d="M15 22L23 15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity=".45"
        />
      </svg>
    </div>
  )
}

function ArrowUpRight() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 15L15 5M7 5H15V13" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="7" y="7" width="9" height="9" rx="2" />
      <path d="M13 7V5.5A2.5 2.5 0 0010.5 3H5.5A2.5 2.5 0 003 5.5v5A2.5 2.5 0 005.5 13H7" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16L21 21" />
    </svg>
  )
}

function NetworkMap({
  wallet,
  counterparties,
  onSelect,
}: {
  wallet: string
  counterparties: Counterparty[]
  onSelect: (item: Counterparty) => void
}) {
  const nodes = counterparties.slice(0, 12)

  return (
    <div className="network-stage">
      <div className="network-grid" />

      <div className="network-orbit orbit-one" />
      <div className="network-orbit orbit-two" />
      <div className="network-orbit orbit-three" />

      <div className="network-center">
        <div className="center-pulse" />
        <div className="center-node">
          <span>YOU</span>
          <strong>{shortAddress(wallet, 4, 3)}</strong>
        </div>
      </div>

      <svg
        className="network-lines"
        viewBox="0 0 1000 560"
        preserveAspectRatio="none"
      >
        {nodes.map((_, index) => {
          const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2
          const radiusX = 360
          const radiusY = 190
          const x = 500 + Math.cos(angle) * radiusX
          const y = 280 + Math.sin(angle) * radiusY

          return (
            <g key={`line-${index}`}>
              <line
                x1="500"
                y1="280"
                x2={x}
                y2={y}
                className="network-line"
              />
              <circle
                cx={x}
                cy={y}
                r="3"
                className="line-particle"
              />
            </g>
          )
        })}
      </svg>

      {nodes.map((item, index) => {
        const angle =
          (index / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2

        const left = 50 + Math.cos(angle) * 36
        const top = 50 + Math.sin(angle) * 34

        const address = normalizeAddress(item)

        return (
          <button
            className="counterparty-node"
            key={`${address}-${index}`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: `${index * 90}ms`,
            }}
            onClick={() => onSelect(item)}
          >
            <span className="node-ring">
              <span className="node-dot" />
            </span>
            <span className="node-info">
              <b>{shortAddress(address, 5, 3)}</b>
              <small>
                {item.transactionCount ??
                  item.count ??
                  1}
                {' '}
                tx
              </small>
            </span>
          </button>
        )
      })}

      <div className="network-caption">
        <span className="live-dot" />
        LIVE RELATIONSHIP MAP
      </div>

      <div className="network-scale">
        <span>01</span>
        <i />
        <span>12</span>
      </div>
    </div>
  )
}

export default function App() {
  const [address, setAddress] = useState('')
  const [result, setResult] = useState<TraceResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Counterparty | null>(null)
  const [copied, setCopied] = useState(false)

  async function traceWallet() {
    const value = address.trim()

    if (!value) return

    setLoading(true)
    setError('')
    setSelected(null)

    try {
      const response = await fetch(
        `/api/trace/base/${encodeURIComponent(value)}`,
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to trace wallet')
      }

      setResult(data)
    } catch (err) {
      setResult(null)
      setError(
        err instanceof Error
          ? err.message
          : 'TRACE could not reach the intelligence API.',
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

      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const recentTransactions = useMemo(
    () => result?.transactions?.slice(0, 8) ?? [],
    [result],
  )

  const chain = result?.chain?.toUpperCase() || 'BASE'

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <Logo />
          <div>
            <div className="brand-name">TRACE</div>
            <div className="brand-sub">ON-CHAIN INTELLIGENCE</div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="system-status">
            <span />
            SYSTEM ONLINE
          </div>

          <div className="chain-pill">
            <span className="base-icon" />
            BASE
          </div>
        </div>
      </header>

      {!result && !loading && !error && (
        <section className="hero">
          <div className="hero-index">TRACE / 001</div>

          <div className="hero-copy">
            <p className="eyebrow">PUBLIC WALLET INTELLIGENCE</p>

            <h1>
              Follow the
              <span> trail.</span>
            </h1>

            <p className="hero-description">
              Turn a public wallet into a living map of its on-chain
              relationships, counterparties and activity.
            </p>
          </div>

          <div className="search-panel">
            <div className="search-label">
              <span>WALLET ADDRESS</span>
              <span>BASE NETWORK</span>
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

              <button
                className="trace-button"
                onClick={traceWallet}
                disabled={!address.trim()}
              >
                TRACE
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
      )}

      {loading && (
        <section className="loading-view">
          <div className="loading-mark">
            <Logo />
          </div>

          <div>
            <p className="eyebrow">TRACE ENGINE</p>
            <h2>Mapping the trail.</h2>
            <p>Reading public on-chain relationships...</p>
          </div>

          <div className="loading-bar">
            <span />
          </div>
        </section>
      )}

      {error && !loading && (
        <section className="error-view">
          <div className="error-number">ERR / 01</div>
          <h2>Trace interrupted.</h2>
          <p>{error}</p>

          <button
            className="secondary-button"
            onClick={() => {
              setError('')
              setResult(null)
            }}
          >
            TRY AGAIN
          </button>
        </section>
      )}

      {result && !loading && !error && (
        <section className="workspace">
          <div className="result-header">
            <div>
              <div className="result-kicker">
                TRACE COMPLETE
                <span />
                {chain}
              </div>

              <h1>{shortAddress(result.address, 10, 8)}</h1>

              <div className="address-line">
                {result.address}

                <button
                  className="icon-button"
                  onClick={copyAddress}
                  title="Copy address"
                >
                  <CopyIcon />
                </button>

                {copied && <span className="copied">COPIED</span>}
              </div>
            </div>

            <div className="result-actions">
              <a
                href={`https://base.blockscout.com/address/${result.address}`}
                target="_blank"
                rel="noreferrer"
                className="secondary-button"
              >
                EXPLORER
                <ArrowUpRight />
              </a>

              <button
                className="secondary-button"
                onClick={() => {
                  setResult(null)
                  setSelected(null)
                  setAddress('')
                }}
              >
                NEW TRACE
              </button>
            </div>
          </div>

          <div className="stats-strip">
            <div className="stat">
              <span>TRANSACTIONS</span>
              <strong>{result.transactionCount}</strong>
            </div>

            <div className="stat">
              <span>CONNECTIONS</span>
              <strong>{result.connections}</strong>
            </div>

            <div className="stat">
              <span>COUNTERPARTIES</span>
              <strong>{result.counterparties.length}</strong>
            </div>

            <div className="stat stat-live">
              <span>NETWORK</span>
              <strong>
                <i />
                {chain}
              </strong>
            </div>
          </div>

          <div className="main-grid">
            <section className="map-section">
              <div className="section-heading">
                <div>
                  <span className="section-number">01</span>
                  <div>
                    <p>RELATIONSHIP GRAPH</p>
                    <h2>Wallet topology</h2>
                  </div>
                </div>

                <span className="section-meta">
                  {result.counterparties.length} nodes detected
                </span>
              </div>

              <NetworkMap
                wallet={result.address}
                counterparties={result.counterparties}
                onSelect={setSelected}
              />
            </section>

            <aside className="intel-panel">
              <div className="section-heading compact">
                <div>
                  <span className="section-number">02</span>
                  <div>
                    <p>SELECTED NODE</p>
                    <h2>
                      {selected
                        ? shortAddress(selected, 8, 6)
                        : 'Network signal'}
                    </h2>
                  </div>
                </div>
              </div>

              {selected ? (
                <div className="selected-node">
                  <div className="signal-orb">
                    <span />
                  </div>

                  <span className="selected-label">COUNTERPARTY</span>

                  <h3>{shortAddress(selected, 12, 8)}</h3>

                  <p>{normalizeAddress(selected)}</p>

                  <div className="selected-data">
                    <div>
                      <span>INTERACTIONS</span>
                      <strong>
                        {selected.transactionCount ?? selected.count ?? '—'}
                      </strong>
                    </div>

                    <div>
                      <span>TYPE</span>
                      <strong>
                        {selected.type?.toUpperCase() || 'ADDRESS'}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="intel-empty">
                  <div className="empty-cross">
                    <span />
                    <i />
                  </div>

                  <h3>Explore the graph</h3>
                  <p>
                    Select a connected wallet to inspect its relationship
                    signal.
                  </p>
                </div>
              )}

              <div className="intel-footer">
                <span>TRACE SIGNAL</span>
                <strong>
                  <i />
                  ACTIVE
                </strong>
              </div>
            </aside>
          </div>

          <section className="activity-section">
            <div className="section-heading">
              <div>
                <span className="section-number">03</span>
                <div>
                  <p>RECENT ACTIVITY</p>
                  <h2>Transaction trail</h2>
                </div>
              </div>

              <span className="section-meta">LATEST 08</span>
            </div>

            <div className="activity-table">
              <div className="activity-head">
                <span>TRANSACTION</span>
                <span>COUNTERPARTY</span>
                <span>VALUE</span>
                <span>TIME</span>
                <span>STATUS</span>
              </div>

              {recentTransactions.map((tx, index) => {
                const to = normalizeAddress(tx.to)
                const from = normalizeAddress(tx.from)
                const counterparty =
                  from.toLowerCase() === result.address.toLowerCase()
                    ? to
                    : from

                return (
                  <a
                    key={`${tx.hash || index}`}
                    href={
                      tx.hash
                        ? `https://base.blockscout.com/tx/${tx.hash}`
                        : '#'
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="activity-row"
                  >
                    <span className="tx-hash">
                      <i>{String(index + 1).padStart(2, '0')}</i>
                      {shortAddress(tx.hash || 'unknown', 7, 5)}
                    </span>

                    <span>{shortAddress(counterparty, 8, 5)}</span>

                    <span className="tx-value">{ethValue(tx.value)}</span>

                    <span>{formatDate(tx.timestamp)}</span>

                    <span className="status-badge">
                      <i />
                      {tx.status?.toUpperCase() || 'CONFIRMED'}
                    </span>
                  </a>
                )
              })}
            </div>
          </section>
        </section>
      )}

      <footer className="footer">
        <div>
          <Logo />
          <span>TRACE</span>
        </div>

        <p>PUBLIC WALLET → VISUAL TRANSACTION MAP</p>

        <span>V1 / BASE</span>
      </footer>
    </main>
  )
}
