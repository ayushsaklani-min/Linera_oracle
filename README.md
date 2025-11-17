# SynapseNet

> Real-time multi-oracle price intelligence streaming into Linera smart contracts with a production-ready React dashboard, Docker workflow, and cloud deployment presets.

[![Linera](https://img.shields.io/badge/Linera-v0.15.5-blue)](https://linera.dev)
[![Rust](https://img.shields.io/badge/Rust-1.86.0-orange)](https://www.rust-lang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB)](https://react.dev/)

---

## 🚀 Executive Summary

SynapseNet is a real-time oracle aggregation network purpose-built for Linera. It continuously ingests price feeds from multiple sources (Chainlink, Pyth, CoinGecko), computes a trust-weighted aggregate, and streams the final truth set to:

- A Linera microchain smart contract (WASM)
- A real-time WebSocket broadcast
- A React analytics dashboard
- REST + GraphQL interfaces for external clients

It delivers exchange-grade data with sub-second visibility, candle generation, historical on-chain persistence, and cloud-ready deployment.

**One command** launches everything:

```bash
docker compose up
```

---

## 🧩 Why SynapseNet?

Modern decentralized apps need fast, trust-minimized, multi-source intelligence. Typical hackathon stacks fail because:

- ❌ Single-oracle systems become a single point of failure  
- ❌ Slow blockchain queries produce stale data  
- ❌ No unified dashboard to monitor oracle health and latency  
- ❌ Infrastructure rarely feels production-ready  

**SynapseNet fixes all of it** with aggregation, analytics, observability, and automation.

**Key Benefits:**
- **Production realism** – Aggregates Chainlink, Pyth, and CoinGecko feeds every 2s, calculates reputation-weighted prices, and stores them on Linera
- **Full visibility** – GraphQL, REST, WebSocket, and React UI surfaces (latency, aggregates, candle history, reputation scoring)
- **Turn-key ops** – Single `docker compose up` spins a Linera localnet, deploys WASM contracts, starts backend + frontend with health checks
- **Cloud-friendly** – `vercel.json` (frontend) and `render.yaml` (backend) keep CI/CD trivial; no manual folders or ad-hoc commands
- **Auditable Rust** – Contracts built with Linera Views, async-graphql services, and ergonomic error handling

---

## 🏛️ System Architecture

```
         ┌──────────────────────────────┐
         │   External Oracle Sources    │
         │ Chainlink │ Pyth │ CoinGecko │
         └──────────────┬───────────────┘
                        ▼
            ┌──────────────────────────────┐
            │   SynapseNet Backend (Node)  │
            │  - Price polling (2s)        │
            │  - Median/TWAP/VWAP          │
            │  - Reputation weighting      │
            │  - WS broadcaster (8090)     │
            │  - GraphQL writer to Linera  │
            └──────────────┬───────────────┘
                           ▼
          ┌──────────────────────────────────┐
          │   Linera Smart Contract (WASM)   │
          │ - MapView<token → snapshots>     │
          │ - RegisterView<latest tick>      │
          │ - GraphQL queries & mutations    │
          └──────────────┬───────────────┘
                         ▼
     ┌───────────────────────────────────────────┐
     │     SynapseNet Dashboard (React + WS)     │
     │ - Live ticker                              │
     │ - Latency + oracle breakdown               │
     │ - Candle history                           │
     │ - Analytics views                          │
     └───────────────────────────────────────────┘
```

**Data Lifecycle:**
1. Fetch prices + latency metrics from three oracles
2. Aggregate (median, TWAP, VWAP, reputation weighting) + candle generation
3. Persist to Linera via GraphQL mutation and broadcast via WebSocket
4. Frontend + external clients stream live data and query historical state

---

## 🌟 Key Features

### 🔮 Multi-Oracle Aggregation
- Chainlink, Pyth, CoinGecko inputs
- Normalization, filtering, validation
- Median, TWAP, VWAP, reputation-weighted scoring

### ⛓️ On-Chain Persistence (Linera)
- WASM contract stores complete snapshots
- `MapView<String, PriceSnapshot>` for history
- `RegisterView<Option<PriceSnapshot>>` caches the latest tick
- GraphQL operations: `latestPrice`, `price(token)`, `allPrices`

### 📡 Real-Time Streaming
- WebSocket pushes live updates every 2 seconds
- Includes latency metrics and oracle-level breakdown
- Frontend auto-reconnect + connection status banners

### 📊 Production Dashboard
- React 18 + Vite + Tailwind + Framer Motion
- Recharts for candles, TWAP, VWAP overlays
- Analytics panels: live ticker, oracle health, REST/GraphQL explorer

### 📦 One-Command Infrastructure
```bash
docker compose up --force-recreate
```
Boots Linera localnet + faucet, publishes bytecode, creates the app, starts backend orchestrator, and launches the dashboard.

### ☁️ Cloud-Ready Templates
- Frontend → **Vercel** (`vercel.json`)
- Backend → **Render** (`render.yaml`)
- Health checks, env vars, project roots pre-configured

---

## 🧱 Monorepo Structure

```
backend-v2/      Oracle ingestion, REST, WS, Linera writer
frontend-v2/     Vite React dashboard (analytics + WS)
price-oracle/    Linera contract + service + views
services/        Linera service helpers
scripts/         WASM artifact automation
Dockerfile       Buildathon-optimized container
compose.yaml     End-to-end environment (5173/8080/9001/13001)
run.bash         Automated localnet deployment
```

---

## ⚙️ Quickstart

### Fastest Path
```bash
docker compose up
```
Visit `http://localhost:5173`.

### Manual Workflow (advanced)
```bash
# Contracts
cd price-oracle
cargo build --release --target wasm32-unknown-unknown
linera publish-bytecode target/.../price_oracle_{contract,service}.wasm
linera create-application <BYTECODE_ID>

# Backend
cd backend-v2
npm install
LINERA_RPC=https://<validator> LINERA_CHAIN=<id> LINERA_ORACLE_APP=<id> npm start

# Frontend
cd frontend-v2
npm install
npm run dev -- --host
```

---

## 📋 Prerequisites

### Required Software

1. **Rust** (1.86.0 or later)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   ```

2. **Linera CLI** (v0.15.5)
   ```bash
   cargo install --locked linera-service@0.15.5
   ```

3. **Node.js** (v18 or later)
   ```bash
   # Download from https://nodejs.org/
   # Or use nvm:
   nvm install 18
   ```

4. **Docker** (optional, for containerized deployment)
   ```bash
   # Download from https://www.docker.com/
   ```

### System Requirements

- **OS**: Linux, macOS, or Windows (WSL recommended for Windows)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 2GB free space
- **Network**: Internet connection for oracle access

---

## 💾 Backend API Surface

### REST
- `GET /health` – System status + stats
- `POST /config/linera` – Hot-swap chain & app IDs
- `GET /api/v1/price/:token` – Aggregated output
- `GET /api/v1/candles/:token?interval=1m&limit=100` – OHLCV feed
- `GET /api/v1/stats` – Update counters + latency

### WebSocket
- `price_update` payload every 2 seconds
- Includes aggregates, oracle breakdown, candles, latency

**Message Format:**
```json
{
  "type": "price_update",
  "data": {
    "token": "ETH",
    "price": 3161.66,
    "aggregated_price": 3021.45,
    "median": 3020.87,
    "twap": 3018.22,
    "vwap": 3022.14,
    "oracle_breakdown": [...],
    "timestamp": 1700000000000
  },
  "latency": 250
}
```

---

## 📚 Smart Contract (Linera WASM)

```rust
MapView<String, PriceSnapshot>         // historical storage
RegisterView<Option<PriceSnapshot>>    // cached latest price
```

**GraphQL Surface:**
- `latestPrice` – Get most recent price
- `price(token: String!)` – Get price for specific token
- `allPrices` – Retrieve all stored prices

**PriceSnapshot Structure:**
```json
{
  "token": "ETH",
  "aggregated_price": 3021.45,
  "median": 3020.87,
  "twap": 3018.22,
  "vwap": 3022.14,
  "oracle_breakdown": [...],
  "timestamp": 1700000000000
}
```

**Build + Test:**
```bash
cd price-oracle
cargo fmt && cargo clippy
cargo test
cargo build --release --target wasm32-unknown-unknown
```

---

## 🎯 Primary Use Cases

- **DeFi protocols** (lending, collateral, liquidations)
- **Market-making bots** needing reliable fair prices
- **Analytics & monitoring** for oracle/latency health
- **On-chain trading engines** that require instantaneous quotes

---

## 🚀 Deployment Playbooks

### Vercel (frontend)
`vercel.json` already informs Vercel to treat `frontend-v2` as the project root.

```bash
npm install -g vercel
vercel login
vercel --prod
```

**Environment Variables:**
```
VITE_API_URL=https://synapsenet-backend.onrender.com
VITE_WS_URL=wss://synapsenet-backend.onrender.com
```

### Render (backend)
`render.yaml` describes a single Node web service rooted at `backend-v2`.

```bash
render blueprint deploy
```

**Key Settings:**
- `buildCommand: npm install`
- `startCommand: npm run start`
- `healthCheckPath: /health`
- Replace `https://your-linera-rpc-endpoint` with the validator you control
- Render assigns `$PORT`; our Express server already respects it

### Other Targets
- **Docker/Compose** (local judging) – already compliant with [Linera template](https://github.com/linera-io/buildathon-template.git)
- **Linera testnet/mainnet** – adjust `LINERA_RPC` + wallet data in `run.bash`

---

## 🔧 Environment Variables

| Component     | Variables                                      | Notes |
|---------------|------------------------------------------------|-------|
| `backend-v2`  | `PORT` (default 3001)                          | HTTP API port for Render |
|               | `WS_PORT` (default 8090)                       | WebSocket broadcast port |
|               | `LINERA_RPC`                                   | `https://.../chains/<id>/applications/<id>` base |
|               | `LINERA_CHAIN`, `LINERA_ORACLE_APP`            | Set via `/config/linera` API or env |
| `frontend-v2` | `VITE_API_URL`, `VITE_WS_URL`, `VITE_CHAIN_ID` | Optional overrides for hosted deployments |

Create a `.env` inside each package if you prefer file-based configuration; Vite automatically loads `VITE_*` variables.

---

## 🧪 Testing & Tooling

| Target        | Command                                             |
|---------------|-----------------------------------------------------|
| Contract unit tests | `cargo test -p price-oracle`                      |
| Backend lint/test  | `npm run lint && npm test` (scripts coming soon)   |
| Frontend typecheck | `npm run build` (Vite enforces TS via JSX tooling) |
| End-to-end smoke   | `bash test-local.sh`                              |

**CI/CD Tips:**
- Add `npm run lint` & `npm run build --prefix frontend-v2` to Vercel preview checks
- On Render, enable `Auto-Deploy` so every push redeploys after tests pass

---

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| Docker healthcheck failing | `docker compose up --build` |
| Linera writes failing | Verify chain/app IDs via `/health` |
| Vercel 404 | Ensure project root is defined via `vercel.json` |
| WebSocket blocked | Update host/provider port allowances |
| Backend can't write to Linera | Verify `LINERA_CHAIN`/`LINERA_ORACLE_APP` (from `run.bash` logs or `/health`) |
| Render health check red | Visit `/health` to read failure causes (Linera unreachable, oracle RPC issues) |

---

## 🗺️ Roadmap

- Additional oracle providers (Kaiko, Amberdata)
- Candle history on a dedicated microchain
- Pricing alert microservice
- Cross-chain aggregator mode
- User wallets + subscription flows

---

## 📄 License

MIT © 2025 SynapseNet contributors.

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `bash test-local.sh`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- **Rust**: Follow `rustfmt` formatting
- **JavaScript**: Use ES6+ features, 2-space indentation
- **React**: Functional components with hooks

### Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions/changes

---

## 🙏 Acknowledgments

- **Linera Protocol**: For the innovative blockchain platform
- **Chainlink**: For reliable oracle infrastructure
- **Pyth Network**: For real-time price feeds
- **CoinGecko**: For comprehensive market data
- **Open Source Community**: For the amazing tools and libraries

---


---

❤️ **Built for the Linera Buildathon** — high-performance, enterprise-ready oracle intelligence for microchains.
