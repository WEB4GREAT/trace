# TRACE

**Public wallet → visual transaction map.**

TRACE turns public blockchain activity into a visual map of wallets, contracts, transactions, and relationships.

## TRACE V2

Multi-chain wallet tracing across:

**Ethereum • Base • Arbitrum • Optimism • Polygon**

### Features

- Trace any public EVM address
- View transaction history
- Discover wallet counterparties
- Identify contract interactions
- Visualize transaction relationships
- View recent on-chain activity
- No wallet connection or private keys

## Stack

React • TypeScript • Vite • React Flow • Node.js • Express • Netlify

## Architecture

TRACE uses a chain/provider architecture, making it possible to add more networks and data providers without rebuilding the core system.

## API

`GET /api/health`

`GET /api/chains`

`GET /api/trace/:chain/:address`

## Versions

**V1** — Base wallet tracing

**V2** — Multi-chain tracing + security hardening + serverless deployment

**V3** — Planned public developer API, API keys, rate limits, analytics, and integrations

## Live

https://traceonchain.netlify.app/

## Repository

https://github.com/WEB4GREAT/trace

---

Built by **WEB4GREAT**.
