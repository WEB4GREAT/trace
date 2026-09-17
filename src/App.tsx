import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FiArrowUpRight,
  FiCheck,
  FiCopy,
  FiExternalLink,
  FiHash,
  FiSearch,
  FiShare2,
} from 'react-icons/fi'
import './App.css'

type Chain = {
  id: string
  name: string
  symbol: string
  explorer: string
}

type Counterparty = {
  address?: string
  name?: string
  count?: number
}

type Transaction = {
  hash?: string
  timestamp?: string
  from?: string
  to?: string
  value?: string | number
}

type TraceData = {
  chain: string
  address: string
  transactionCount?: number
  counterparties?: Counterparty[]
  contracts?: number
  transactions?: Transaction[]
}

const CHAINS: Chain[] = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', explorer: 'https://etherscan.io' },
  { id: 'base', name: 'Base', symbol: 'BASE', explorer: 'https://basescan.org' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', explorer: 'https://arbiscan.io' },
  { id: 'optimism', name: 'Optimism', symbol: 'OP', explorer: 'https://optimistic.etherscan.io' },
  { id: 'polygon', name: 'Polygon', symbol: 'POL', explorer: 'https://polygonscan.com' },
  { id: 'bnb', name: 'BNB Chain', symbol: 'BNB', explorer: 'https://bscscan.com' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', explorer: 'https://snowtrace.io' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', explorer: 'https://explorer.solana.com' },
  { id: 'tron', name: 'TRON', symbol: 'TRX', explorer: 'https://tronscan.org' },
  { id: 'sui', name: 'Sui', symbol: 'SUI', explorer: 'https://suiexplorer.com' },
  { id: 'aptos', name: 'Aptos', symbol: 'APT', explorer: 'https://explorer.aptoslabs.com' },
  { id: 'ton', name: 'TON', symbol: 'TON', explorer: 'https://tonviewer.com' },
]

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')

function shortAddress(value: unknown) {
  if (typeof value === 'string') {
    if (value.length <= 18) return value
    return `${value.slice(0, 8)}…${value.slice(-6)}`
  }

  if (value && typeof value === 'object') {
    const item = value as Record<string, unknown>
    const address = item.address ?? item.hash

    if (typeof address === 'string') {
      return address.length <= 18
        ? address
        : `${address.slice(0, 8)}…${address.slice(-6)}`
    }
  }

  return 'Unknown'
}

function formatDate(value?: string) {
  if (!value) return 'Unknown'
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function TraceMark({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={`trace-mark ${small ? 'trace-mark-small' : ''}`}
      viewBox="0 0 30 30"
      aria-hidden="true"
    >
      <path d="M7 8H23" />
      <path d="M15 8V22" />
      <path d="M15 22L23 15" />
      <circle cx="7" cy="8" r="2" />
      <circle cx="23" cy="8" r="2" />
      <circle cx="15" cy="22" r="2" />
    </svg>
  )
}

function App() {
  const [selectedChain, setSelectedChain] = useState<Chain>(CHAINS[0])
  const [address, setAddress] = useState('')
  const [data, setData] = useState<TraceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [chainOpen, setChainOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [chainMenuPosition, setChainMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 285,
  })

  const pickerRef = useRef<HTMLDivElement>(null)
  const chainTriggerRef = useRef<HTMLButtonElement>(null)
  const chainMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        pickerRef.current &&
        !pickerRef.current.contains(target) &&
        chainMenuRef.current &&
        !chainMenuRef.current.contains(target)
      ) {
        setChainOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  useEffect(() => {
    if (!chainOpen) return

    const updatePosition = () => {
      const trigger = chainTriggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const menuWidth = Math.min(285, window.innerWidth - 28)
      const menuHeight = Math.min(390, window.innerHeight - 32)

      let left = rect.left
      let top = rect.bottom + 8

      if (left + menuWidth > window.innerWidth - 14) {
        left = window.innerWidth - menuWidth - 14
      }

      if (left < 14) {
        left = 14
      }

      if (top + menuHeight > window.innerHeight - 16) {
        top = rect.top - menuHeight - 8
      }

      if (top < 16) {
        top = 16
      }

      setChainMenuPosition({
        top,
        left,
        width: menuWidth,
      })
    }

    updatePosition()

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [chainOpen])

  const normalizedAddress = address.trim()

  const canTrace = normalizedAddress.length > 0 && !loading

  const selectedChainLabel = useMemo(
    () => selectedChain.name,
    [selectedChain],
  )

  async function traceWallet() {
    if (!normalizedAddress) return

    setLoading(true)
    setError('')
    setData(null)

    try {
      const response = await fetch(
        `${API_BASE}/api/trace/${selectedChain.id}/${encodeURIComponent(
          normalizedAddress,
        )}`,
      )

      if (!response.ok) {
        throw new Error(`TRACE request failed with ${response.status}`)
      }

      const result = (await response.json()) as TraceData

      setData(result)
    } catch {
      setError(
        'TRACE could not retrieve this address right now. Check the network and address, then try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function copyAddress() {
    if (!data?.address) return

    try {
      await navigator.clipboard.writeText(data.address)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  function shareTrace() {
    if (!data) return

    const url = window.location.href

    if (navigator.share) {
      navigator
        .share({
          title: 'TRACE',
          text: `TRACE — ${shortAddress(data.address)}`,
          url,
        })
        .catch(() => undefined)

      return
    }

    navigator.clipboard?.writeText(url)
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a className="brand" href="/" aria-label="TRACE home">
          <TraceMark small />
          <span>TRACE</span>
        </a>

        <div className="topbar-right">
          <span className="version">V2</span>
          <span className="status-dot" />
          <span className="status-text">ON-CHAIN INTELLIGENCE</span>
        </div>
      </header>

      <main>
        {!data ? (
          <section className="hero">
            <div className="hero-kicker">
              <span className="kicker-line" />
              PUBLIC WALLET → TRANSACTION MAP
            </div>

            <div className="hero-heading">
              <h1>
                See where
                <br />
                an address <em>moves.</em>
              </h1>

              <div className="hero-mark">
                <TraceMark />
                <span>TRACE / 02</span>
              </div>
            </div>

            <p className="hero-copy">
              Paste any public address. TRACE maps its activity,
              counterparties, contracts and transaction history across
              supported networks.
            </p>

            <div className="trace-command">
              <div className="chain-picker" ref={pickerRef}>
                <button
                  className="chain-trigger"
                  ref={chainTriggerRef}
                  type="button"
                  onClick={() => setChainOpen((open) => !open)}
                  aria-expanded={chainOpen}
                >
                  <span className="chain-dot" />
                  <span className="chain-trigger-name">
                    {selectedChainLabel}
                  </span>
                  <span className="chain-trigger-symbol">
                    {selectedChain.symbol}
                  </span>
                  <span className={`chain-caret ${chainOpen ? 'open' : ''}`}>
                    ↓
                  </span>
                </button>

                {chainOpen &&
                  createPortal(
                    <div
                      ref={chainMenuRef}
                      className="chain-menu"
                      style={{
                        top: chainMenuPosition.top,
                        left: chainMenuPosition.left,
                        width: chainMenuPosition.width,
                      }}
                    >
                      <div className="chain-menu-head">
                        <span>NETWORK</span>
                        <span>{CHAINS.length} AVAILABLE</span>
                      </div>

                      <div className="chain-menu-list">
                        {CHAINS.map((chain) => (
                          <button
                            className={`chain-option ${
                              selectedChain.id === chain.id ? 'selected' : ''
                            }`}
                            type="button"
                            key={chain.id}
                            onClick={() => {
                              setSelectedChain(chain)
                              setChainOpen(false)
                            }}
                          >
                            <span className="chain-option-left">
                              <span className="chain-option-dot" />
                              <span>{chain.name}</span>
                            </span>

                            <span className="chain-option-symbol">
                              {chain.symbol}
                            </span>

                            {selectedChain.id === chain.id && (
                              <FiCheck className="chain-check" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>,
                    document.body,
                  )}
              </div>

              <div className="address-field">
                <FiSearch />
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') traceWallet()
                  }}
                  placeholder="Paste a public wallet address"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>

              <button
                className="trace-action"
                type="button"
                onClick={traceWallet}
                disabled={!canTrace}
              >
                {loading ? 'MAPPING' : 'TRACE'}
                {!loading && <FiArrowUpRight />}
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="hero-foot">
              <div className="supported">
                <span>SUPPORTED NETWORKS</span>
                <div className="network-dots">
                  {CHAINS.slice(0, 6).map((chain) => (
                    <span
                      key={chain.id}
                      title={chain.name}
                      className="network-mini"
                    />
                  ))}
                  <span className="more-networks">+6</span>
                </div>
              </div>

              <div className="privacy-note">
                PUBLIC DATA ONLY
              </div>
            </div>
          </section>
        ) : (
          <section className="results">
            <div className="results-top">
              <div>
                <div className="result-kicker">
                  <span className="kicker-line" />
                  TRACE RESULT
                </div>

                <h1>
                  {selectedChain.name}
                  <span>/</span>
                  {shortAddress(data.address)}
                </h1>
              </div>

              <div className="result-actions">
                <button type="button" onClick={copyAddress}>
                  {copied ? <FiCheck /> : <FiCopy />}
                  {copied ? 'COPIED' : 'COPY'}
                </button>

                <button type="button" onClick={shareTrace}>
                  <FiShare2 />
                  SHARE
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setData(null)
                    setError('')
                  }}
                >
                  NEW TRACE
                </button>
              </div>
            </div>

            <div className="identity-strip">
              <div className="identity-main">
                <div className="identity-mark">
                  <TraceMark />
                </div>

                <div>
                  <span className="identity-label">PUBLIC ADDRESS</span>
                  <strong>{shortAddress(data.address)}</strong>
                </div>
              </div>

              <a
                className="explorer-link"
                href={`${selectedChain.explorer}/address/${data.address}`}
                target="_blank"
                rel="noreferrer"
              >
                VIEW ON EXPLORER
                <FiExternalLink />
              </a>
            </div>

            <div className="stats-row">
              <div className="stat">
                <span>TRANSACTIONS</span>
                <strong>{data.transactionCount ?? 0}</strong>
              </div>

              <div className="stat">
                <span>COUNTERPARTIES</span>
                <strong>{data.counterparties?.length ?? 0}</strong>
              </div>

              <div className="stat">
                <span>CONTRACTS</span>
                <strong>{data.contracts ?? 0}</strong>
              </div>

              <div className="stat-chain">
                <span>NETWORK</span>
                <strong>
                  <i />
                  {selectedChain.name}
                </strong>
              </div>
            </div>

            <div className="map-section">
              <div className="section-heading">
                <div>
                  <span>01 / RELATIONSHIP MAP</span>
                  <h2>Who this address interacts with.</h2>
                </div>

                <span className="map-caption">PUBLIC ACTIVITY</span>
              </div>

              <div className="network-map">
                <div className="map-grid" />

                <div className="map-line line-a" />
                <div className="map-line line-b" />
                <div className="map-line line-c" />
                <div className="map-line line-d" />

                <div className="center-node">
                  <div className="center-ring">
                    <TraceMark />
                  </div>
                  <span>YOU</span>
                </div>

                {(data.counterparties ?? []).slice(0, 6).map((item, index) => {
                  const positions = [
                    'node-one',
                    'node-two',
                    'node-three',
                    'node-four',
                    'node-five',
                    'node-six',
                  ]

                  return (
                    <div
                      className={`counterparty-node ${positions[index]}`}
                      key={`${item.address ?? item.name ?? index}-${index}`}
                    >
                      <span className="node-dot" />
                      <div>
                        <strong>
                          {item.name || shortAddress(item.address)}
                        </strong>
                        <span>{item.count ?? 1} interactions</span>
                      </div>
                    </div>
                  )
                })}

                <div className="map-signal">
                  <span />
                  LIVE TRACE
                </div>
              </div>
            </div>

            <div className="activity-section">
              <div className="section-heading">
                <div>
                  <span>02 / ACTIVITY</span>
                  <h2>Recent transactions.</h2>
                </div>

                <FiHash />
              </div>

              <div className="activity-list">
                {(data.transactions ?? []).slice(0, 8).map((tx, index) => (
                  <div className="transaction-row" key={tx.hash ?? index}>
                    <div className="tx-index">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <div className="tx-flow">
                      <span>{shortAddress(tx.from)}</span>
                      <span className="tx-arrow">→</span>
                      <span>{shortAddress(tx.to)}</span>
                    </div>

                    <div className="tx-time">
                      {formatDate(tx.timestamp)}
                    </div>

                    <a
                      className="tx-link"
                      href={`${selectedChain.explorer}/tx/${tx.hash ?? ''}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FiExternalLink />
                    </a>
                  </div>
                ))}

                {(!data.transactions || data.transactions.length === 0) && (
                  <div className="empty-activity">
                    No recent transactions returned for this address.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <TraceMark small />
          <span>TRACE</span>
        </div>

        <div className="footer-center">
          Built by <strong>WEB4GREAT</strong>
        </div>

        <div className="footer-links">
          <a
            href="https://x.com/WEB4GREAT"
            target="_blank"
            rel="noreferrer"
          >
            X <FiArrowUpRight />
          </a>

          <a
            href="https://github.com/WEB4GREAT/trace"
            target="_blank"
            rel="noreferrer"
          >
            GITHUB <FiArrowUpRight />
          </a>

          <span>V2</span>
        </div>
      </footer>
    </div>
  )
}

export default App
