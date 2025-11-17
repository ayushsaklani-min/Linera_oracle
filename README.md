# SynapseNet  
### Real-Time Multi-Oracle Intelligence for Linera Microchains

Chainlink • Pyth • CoinGecko → Aggregated • Weighted • Validated → Linera Smart Contracts  
Production-ready React dashboard, live WebSocket streaming, Docker workflows, cloud deployment presets.

---

## 🚀 Executive Summary

SynapseNet is a real-time oracle aggregation network purpose-built for Linera. It continuously ingests price feeds from multiple sources, computes a trust-weighted aggregate, and streams the final truth set to:

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

## 🧩 Why SynapseNet Exists

Modern decentralized apps need fast, trust-minimized, multi-source intelligence. Typical hackathon stacks fail because:

- ❌ Single-oracle systems become a single point of failure  
- ❌ Slow blockchain queries produce stale data  
- ❌ No unified dashboard to monitor oracle health and latency  
- ❌ Infrastructure rarely feels production-ready  

**SynapseNet fixes all of it** with aggregation, analytics, observability, and automation.

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
- Health checks, env vars, project roots pre-configured.

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

## 💾 Backend API Surface

### REST
- `GET /health` – System status + stats
- `POST /config/linera` – Hot-swap chain & app IDs
- `GET /api/v1/price/:token` – Aggregated output
- `GET /api/v1/candles/:token` – OHLCV feed
- `GET /api/v1/stats` – Update counters + latency

### WebSocket
- `price_update` payload every 2 seconds
- Includes aggregates, oracle breakdown, candles, latency

---

## 📚 Smart Contract (Linera WASM)

```rust
MapView<String, PriceSnapshot>         // historical storage
RegisterView<Option<PriceSnapshot>>    // cached latest price
```

GraphQL surface:
- `latestPrice`
- `price(token: String!)`
- `allPrices`

Snapshot:
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

---

## 🎯 Primary Use Cases

- **DeFi protocols** (lending, collateral, liquidations)
- **Market-making bots** needing reliable fair prices
- **Analytics & monitoring** for oracle/latency health
- **On-chain trading engines** that require instantaneous quotes

---

## 🧪 Testing Matrix

| Layer     | Command                          |
|-----------|----------------------------------|
| Contract  | `cargo test -p price-oracle`     |
| Backend   | `npm run lint && npm test` *(soon)* |
| Frontend  | `npm run build`                  |
| End-to-End| `bash test-local.sh`             |

---

## 🚀 Deployment Playbooks

### Frontend → Vercel
```bash
vercel --prod
```

### Backend → Render
```bash
render blueprint deploy
```

Both configs are already included at the repo root—no manual restructuring required.

---

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| Docker healthcheck failing | `docker compose up --build` |
| Linera writes failing | Verify chain/app IDs via `/health` |
| Vercel 404 | Ensure project root is defined via `vercel.json` |
| WebSocket blocked | Update host/provider port allowances |

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

❤️ **Built for the Linera Buildathon** — high-performance, enterprise-ready oracle intelligence for microchains.
# SynapseNet

> Real-time multi-oracle price intelligence streaming into Linera smart contracts with a production-ready React dashboard, Docker workflow, and cloud deployment presets.

[![Linera](https://img.shields.io/badge/Linera-v0.15.5-blue)](https://linera.dev)
[![Rust](https://img.shields.io/badge/Rust-1.86.0-orange)](https://www.rust-lang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB)](https://react.dev/)

---

## Why SynapseNet?

- **Production realism** – Aggregates Chainlink, Pyth, and CoinGecko feeds every 2 s, calculates reputation-weighted prices, and stores them on Linera.
- **Full visibility** – GraphQL, REST, WebSocket, and React UI surfaces (latency, aggregates, candle history, reputation scoring).
- **Turn-key ops** – Single `docker compose up` spins a Linera localnet, deploys WASM contracts, starts backend + frontend with health checks.
- **Cloud-friendly** – `vercel.json` (frontend) and `render.yaml` (backend) keep CI/CD trivial; no manual folders or ad-hoc commands.
- **Auditable Rust** – Contracts built with Linera Views, async-graphql services, and ergonomic error handling.

---

## Architecture at a Glance

```
┌───────────────┐     ┌────────────────────┐     ┌────────────────────────┐
│ Chainlink     │     │ SynapseNet Backend │     │ Linera Price Oracle    │
│ Pyth          │     │  - Express REST    │     │  - Contract + Service  │
│ CoinGecko     │──▶  │  - WebSocket 8090 │──▶  │  - MapView + Register  │
└───────────────┘     │  - Aggregation     │     │  - GraphQL mutations   │
                      │  - Linera writer   │     └─────────┬──────────────┘
                      └─────────┬──────────┘               │
                                │                          │
                                ▼                          ▼
                      ┌────────────────────┐      ┌────────────────────────┐
                      │ React Dashboard    │◀────▶│ External GraphQL/REST  │
                      │  - Vite + WS       │      │ Consumers               │
                      │  - Analytics views │      │                         │
                      └────────────────────┘      └────────────────────────┘
```

Data lifecycle:
1. Fetch prices + latency metrics from three oracles.
2. Aggregate (median, TWAP, VWAP, reputation weighting) + candle generation.
3. Persist to Linera via GraphQL mutation and broadcast via WebSocket.
4. Frontend + external clients stream live data and query historical state.

---

## Monorepo Layout

```
backend-v2/          Multi-oracle Node.js service (Express + ws)
frontend-v2/         React + Vite dashboard (Tailwind, Recharts, router)
price-oracle/        Linera contract, service, and state (Rust/WASM)
services/            Additional Linera service helpers
scripts/             Tooling (e.g., wasm artifact copier)
Dockerfile           Buildathon-compliant container definition
compose.yaml         Ports: 5173, 8080, 9001, 13001
run.bash             Spins Linera localnet + deploy + starts apps
vercel.json          Vercel config pointing at frontend-v2
render.yaml          Render blueprint for backend-v2
```

---

## Quickstart

### 1. Requirements
- Rust 1.86+, `wasm32-unknown-unknown` target
- Linera CLI `linera-service@0.15.5`
- Node.js 18+
- Docker Desktop (optional but easiest path)

### 2. One-command localnet

```bash
docker compose up --force-recreate
```

What happens:
1. Container installs Linera + Node toolchain.
2. Localnet + faucet launch (`linera net up --with-faucet`).
3. `price-oracle` contract/service build & publish → new application.
4. `backend-v2` boots (REST 3001, WS 8090) and auto-configures Linera IDs.
5. `frontend-v2` dev server exposes the dashboard on `http://localhost:5173`.

Stop with `Ctrl+C` or `docker compose down`.

### 3. Manual workflow (advanced)

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

## Environment Variables

| Component     | Variables                                      | Notes |
|---------------|------------------------------------------------|-------|
| `backend-v2`  | `PORT` (default 3001)                          | HTTP API port for Render |
|               | `WS_PORT` (default 8090)                       | WebSocket broadcast port |
|               | `LINERA_RPC`                                   | `https://.../chains/<id>/applications/<id>` base |
|               | `LINERA_CHAIN`, `LINERA_ORACLE_APP`            | Set via `/config/linera` API or env |
| `frontend-v2` | `VITE_API_URL`, `VITE_WS_URL`, `VITE_CHAIN_ID` | Optional overrides for hosted deployments |

Create a `.env` inside each package if you prefer file-based configuration; Vite automatically loads `VITE_*` variables.

---

## Deployment Playbooks

### Vercel (frontend)
`vercel.json` already informs Vercel to treat `frontend-v2` as the project root.

```bash
npm install -g vercel
vercel login
vercel --prod
```

Internals:
- `installCommand`: `npm install --prefix frontend-v2`
- `buildCommand`: `npm run build --prefix frontend-v2`
- `outputDirectory`: `frontend-v2/dist`

Optional environment variables (Project Settings → Environment Variables):
```
VITE_API_URL=https://synapsenet-backend.onrender.com
VITE_WS_URL=wss://synapsenet-backend.onrender.com
```

### Render (backend)
`render.yaml` describes a single Node web service rooted at `backend-v2`.

```bash
render blueprint deploy
```

Key settings in the blueprint:
- `buildCommand: npm install`
- `startCommand: npm run start`
- `healthCheckPath: /health`
- Replace `https://your-linera-rpc-endpoint` with the validator you control.
- Render assigns `$PORT`; our Express server already respects it.

### Other Targets
- **Docker/Compose** (local judging) – already compliant with [Linera template](https://github.com/linera-io/buildathon-template.git).
- **Linera testnet/mainnet** – adjust `LINERA_RPC` + wallet data in `run.bash`.

---

## Backend Surface

- `GET /health` – uptime + stats + current Linera binding.
- `POST /config/linera` – body `{ chain, oracleApp }`, hot swaps target.
- `GET /api/v1/price/:token` – aggregated price + oracle inputs.
- `GET /api/v1/candles/:token?interval=1m&limit=100` – OHLCV snapshots.
- `GET /api/v1/stats` – totals, fail counts, average latency.
- WebSocket `ws://<host>:WS_PORT` – `price_update` payloads with live candles.

---

## Contract / Service Highlights

- `PriceOracle` view:
  - `MapView<String, PriceSnapshot>` for historical storage.
  - `RegisterView<Option<PriceSnapshot>>` caches the latest tick.
- `PriceSnapshot`
  - Token, aggregated price, TWAP/VWAP/median, oracle breakdown, timestamp.
- GraphQL service resolvers:
  - `latestPrice`, `price(token: String!)`, `allPrices`.
- Access control & validation:
  - Guard rails around malformed payloads and missing tokens.

Build + test:

```bash
cd price-oracle
cargo fmt && cargo clippy
cargo test
cargo build --release --target wasm32-unknown-unknown
```

---

## Frontend Highlights

- Vite + React 18 + Tailwind + Framer Motion for fast iterations.
- Dashboard pages: live ticker, analytics, alerts, API docs, subscriptions.
- WebSocket reconnect logic with status banners.
- Recharts-based visualizations for TWAP/VWAP/candle overlays.
- Router layout with persistent navigation + theming.

Build locally:

```bash
cd frontend-v2
npm install
npm run build
npm run preview
```

---

## Testing & Tooling

| Target        | Command                                             |
|---------------|-----------------------------------------------------|
| Contract unit tests | `cargo test -p price-oracle`                      |
| Backend lint/test  | `npm run lint && npm test` (scripts coming soon)   |
| Frontend typecheck | `npm run build` (Vite enforces TS via JSX tooling) |
| End-to-end smoke   | `bash test-local.sh`                              |

CI/CD tips:
- Add `npm run lint` & `npm run build --prefix frontend-v2` to Vercel preview checks.
- On Render, enable `Auto-Deploy` so every push redeploys after tests pass.

---

## Troubleshooting

- **Docker healthcheck fails** – ensure `npm install` completes inside container; rerun with `docker compose up --build`.
- **Render health check red** – visit `/health` to read failure causes (Linera unreachable, oracle RPC issues).
- **Vercel 404** – check that project is linked at repo root; `vercel.json` must live at the same level as `package.json`.
- **Backend can’t write to Linera** – verify `LINERA_CHAIN`/`LINERA_ORACLE_APP` (from `run.bash` logs or `/health`).
- **WebSocket blocked** – expose port 8090 or set `WS_PORT` to match hosting provider constraints.

---

## Roadmap

- Expand oracle roster (Kaiko, Amberdata) with dynamic weighting.
- Persist candle history on-chain via secondary microchain.
- Add alerting microservice + push notifications.
- Bring-your-own Linera account onboarding flow in the UI.

---

## License

MIT © 2025 SynapseNet contributors.

---

Built for the Linera Buildathon with ❤️. Let’s connect:
- Issues & discussions: GitHub repository
- Email: hello@synapsenet.io
# SynapseNet

> Real-time multi-oracle price intelligence streaming into Linera smart contracts with a production-ready React dashboard, Docker workflow, and cloud deployment presets.

[![Linera](https://img.shields.io/badge/Linera-v0.15.5-blue)](https://linera.dev)
[![Rust](https://img.shields.io/badge/Rust-1.86.0-orange)](https://www.rust-lang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB)](https://react.dev/)

---

## Why SynapseNet?

- **Production realism** – Aggregates Chainlink, Pyth, and CoinGecko feeds every 2 s, calculates reputation-weighted prices, and stores them on Linera.
- **Full visibility** – GraphQL, REST, WebSocket, and React UI surfaces (latency, aggregates, candle history, reputation scoring).
- **Turn-key ops** – Single `docker compose up` spins a Linera localnet, deploys WASM contracts, starts backend + frontend with health checks.
- **Cloud-friendly** – `vercel.json` (frontend) and `render.yaml` (backend) keep CI/CD trivial; no manual folders or ad-hoc commands.
- **Auditable Rust** – Contracts built with Linera Views, async-graphql services, and ergonomic error handling.

---

## Architecture at a Glance

```
┌───────────────┐     ┌────────────────────┐     ┌────────────────────────┐
│ Chainlink     │     │ SynapseNet Backend │     │ Linera Price Oracle    │
│ Pyth          │     │  - Express REST    │     │  - Contract + Service  │
│ CoinGecko     │──▶  │  - WebSocket 8090 │──▶  │  - MapView + Register  │
└───────────────┘     │  - Aggregation     │     │  - GraphQL mutations   │
                      │  - Linera writer   │     └─────────┬──────────────┘
                      └─────────┬──────────┘               │
                                │                          │
                                ▼                          ▼
                      ┌────────────────────┐      ┌────────────────────────┐
                      │ React Dashboard    │◀────▶│ External GraphQL/REST  │
                      │  - Vite + WS       │      │ Consumers               │
                      │  - Analytics views │      │                         │
                      └────────────────────┘      └────────────────────────┘
```

Data lifecycle:
1. Fetch prices + latency metrics from three oracles.
2. Aggregate (median, TWAP, VWAP, reputation weighting) + candle generation.
3. Persist to Linera via GraphQL mutation and broadcast via WebSocket.
4. Frontend + external clients stream live data and query historical state.

---

## Monorepo Layout

```
backend-v2/          Multi-oracle Node.js service (Express + ws)
frontend-v2/         React + Vite dashboard (Tailwind, Recharts, router)
price-oracle/        Linera contract, service, and state (Rust/WASM)
services/            Additional Linera service helpers
scripts/             Tooling (e.g., wasm artifact copier)
Dockerfile           Buildathon-compliant container definition
compose.yaml         Ports: 5173, 8080, 9001, 13001
run.bash             Spins Linera localnet + deploy + starts apps
vercel.json          Vercel config pointing at frontend-v2
render.yaml          Render blueprint for backend-v2
```

---

## Quickstart

### 1. Requirements
- Rust 1.86+, `wasm32-unknown-unknown` target
- Linera CLI `linera-service@0.15.5`
- Node.js 18+
- Docker Desktop (optional but easiest path)

### 2. One-command localnet

```bash
docker compose up --force-recreate
```

What happens:
1. Container installs Linera + Node toolchain.
2. Localnet + faucet launch (`linera net up --with-faucet`).
3. `price-oracle` contract/service build & publish → new application.
4. `backend-v2` boots (REST 3001, WS 8090) and auto-configures Linera IDs.
5. `frontend-v2` dev server exposes the dashboard on `http://localhost:5173`.

Stop with `Ctrl+C` or `docker compose down`.

### 3. Manual workflow (advanced)

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

## Environment Variables

| Component     | Variables                                      | Notes |
|---------------|------------------------------------------------|-------|
| `backend-v2`  | `PORT` (default 3001)                          | HTTP API port for Render |
|               | `WS_PORT` (default 8090)                       | WebSocket broadcast port |
|               | `LINERA_RPC`                                   | `https://.../chains/<id>/applications/<id>` base |
|               | `LINERA_CHAIN`, `LINERA_ORACLE_APP`            | Set via `/config/linera` API or env |
| `frontend-v2` | `VITE_API_URL`, `VITE_WS_URL`, `VITE_CHAIN_ID` | Optional overrides for hosted deployments |

Create a `.env` inside each package if you prefer file-based configuration; Vite automatically loads `VITE_*` variables.

---

## Deployment Playbooks

### Vercel (frontend)
`vercel.json` already informs Vercel to treat `frontend-v2` as the project root.

```bash
npm install -g vercel
vercel login
vercel --prod
```

Internals:
- `installCommand`: `npm install --prefix frontend-v2`
- `buildCommand`: `npm run build --prefix frontend-v2`
- `outputDirectory`: `frontend-v2/dist`

Optional environment variables (Project Settings → Environment Variables):
```
VITE_API_URL=https://synapsenet-backend.onrender.com
VITE_WS_URL=wss://synapsenet-backend.onrender.com
```

### Render (backend)
`render.yaml` describes a single Node web service rooted at `backend-v2`.

```bash
render blueprint deploy
```

Key settings in the blueprint:
- `buildCommand: npm install`
- `startCommand: npm run start`
- `healthCheckPath: /health`
- Replace `https://your-linera-rpc-endpoint` with the validator you control.
- Render assigns `$PORT`; our Express server already respects it.

### Other Targets
- **Docker/Compose** (local judging) – already compliant with [Linera template](https://github.com/linera-io/buildathon-template.git).
- **Linera testnet/mainnet** – adjust `LINERA_RPC` + wallet data in `run.bash`.

---

## Backend Surface

- `GET /health` – uptime + stats + current Linera binding.
- `POST /config/linera` – body `{ chain, oracleApp }`, hot swaps target.
- `GET /api/v1/price/:token` – aggregated price + oracle inputs.
- `GET /api/v1/candles/:token?interval=1m&limit=100` – OHLCV snapshots.
- `GET /api/v1/stats` – totals, fail counts, average latency.
- WebSocket `ws://<host>:WS_PORT` – `price_update` payloads with live candles.

---

## Contract / Service Highlights

- `PriceOracle` view:
  - `MapView<String, PriceSnapshot>` for historical storage.
  - `RegisterView<Option<PriceSnapshot>>` caches the latest tick.
- `PriceSnapshot`
  - Token, aggregated price, TWAP/VWAP/median, oracle breakdown, timestamp.
- GraphQL service resolvers:
  - `latestPrice`, `price(token: String!)`, `allPrices`.
- Access control & validation:
  - Guard rails around malformed payloads and missing tokens.

Build + test:

```bash
cd price-oracle
cargo fmt && cargo clippy
cargo test
cargo build --release --target wasm32-unknown-unknown
```

---

## Frontend Highlights

- Vite + React 18 + Tailwind + Framer Motion for fast iterations.
- Dashboard pages: live ticker, analytics, alerts, API docs, subscriptions.
- WebSocket reconnect logic with status banners.
- Recharts-based visualizations for TWAP/VWAP/candle overlays.
- Router layout with persistent navigation + theming.

Build locally:

```bash
cd frontend-v2
npm install
npm run build
npm run preview
```

---

## Testing & Tooling

| Target        | Command                                             |
|---------------|-----------------------------------------------------|
| Contract unit tests | `cargo test -p price-oracle`                      |
| Backend lint/test  | `npm run lint && npm test` (scripts coming soon)   |
| Frontend typecheck | `npm run build` (Vite enforces TS via JSX tooling) |
| End-to-end smoke   | `bash test-local.sh`                              |

CI/CD tips:
- Add `npm run lint` & `npm run build --prefix frontend-v2` to Vercel preview checks.
- On Render, enable `Auto-Deploy` so every push redeploys after tests pass.

---

## Troubleshooting

- **Docker healthcheck fails** – ensure `npm install` completes inside container; rerun with `docker compose up --build`.
- **Render health check red** – visit `/health` to read failure causes (Linera unreachable, oracle RPC issues).
- **Vercel 404** – check that project is linked at repo root; `vercel.json` must live at the same level as `package.json`.
- **Backend can’t write to Linera** – verify `LINERA_CHAIN`/`LINERA_ORACLE_APP` (from `run.bash` logs or `/health`).
- **WebSocket blocked** – expose port 8090 or set `WS_PORT` to match hosting provider constraints.

---

## Roadmap

- Expand oracle roster (Kaiko, Amberdata) with dynamic weighting.
- Persist candle history on-chain via secondary microchain.
- Add alerting microservice + push notifications.
- Bring-your-own Linera account onboarding flow in the UI.

---

## License

MIT © 2025 SynapseNet contributors.

---

Built for the Linera Buildathon with ❤️. Let’s connect:
- Issues & discussions: GitHub repository
- Email: hello@synapsenet.io
# SynapseNet

> Real-time multi-oracle price intelligence streaming into Linera smart contracts with a production-ready React dashboard, Docker workflow, and cloud deployment presets.

[![Linera](https://img.shields.io/badge/Linera-v0.15.5-blue)](https://linera.dev)
[![Rust](https://img.shields.io/badge/Rust-1.86.0-orange)](https://www.rust-lang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB)](https://react.dev/)

---

## Why SynapseNet?

- **Production realism** – Aggregates Chainlink, Pyth, and CoinGecko feeds every 2 s, calculates reputation-weighted prices, and stores them on Linera.
- **Full visibility** – GraphQL, REST, WebSocket, and React UI surfaces (latency, aggregates, candle history, reputation scoring).
- **Turn-key ops** – Single `docker compose up` spins a Linera localnet, deploys WASM contracts, starts backend + frontend with health checks.
- **Cloud-friendly** – `vercel.json` (frontend) and `render.yaml` (backend) keep CI/CD trivial; no manual folders or ad-hoc commands.
- **Auditable Rust** – Contracts built with Linera Views, async-graphql services, and ergonomic error handling.

---

## Architecture at a Glance

```
┌───────────────┐     ┌────────────────────┐     ┌────────────────────────┐
│ Chainlink     │     │ SynapseNet Backend │     │ Linera Price Oracle    │
│ Pyth          │     │  - Express REST    │     │  - Contract + Service  │
│ CoinGecko     │──▶  │  - WebSocket 8090 │──▶  │  - MapView + Register  │
└───────────────┘     │  - Aggregation     │     │  - GraphQL mutations   │
                      │  - Linera writer   │     └─────────┬──────────────┘
                      └─────────┬──────────┘               │
                                │                          │
                                ▼                          ▼
                      ┌────────────────────┐      ┌────────────────────────┐
                      │ React Dashboard    │◀────▶│ External GraphQL/REST  │
                      │  - Vite + WS       │      │ Consumers               │
                      │  - Analytics views │      │                         │
                      └────────────────────┘      └────────────────────────┘
```

Data lifecycle:
1. Fetch prices + latency metrics from three oracles.
2. Aggregate (median, TWAP, VWAP, reputation weighting) + candle generation.
3. Persist to Linera via GraphQL mutation and broadcast via WebSocket.
4. Frontend + external clients stream live data and query historical state.

---

## Monorepo Layout

```
backend-v2/          Multi-oracle Node.js service (Express + ws)
frontend-v2/         React + Vite dashboard (Tailwind, Recharts, router)
price-oracle/        Linera contract, service, and state (Rust/WASM)
services/            Additional Linera service helpers
scripts/             Tooling (e.g., wasm artifact copier)
Dockerfile           Buildathon-compliant container definition
compose.yaml         Ports: 5173, 8080, 9001, 13001
run.bash             Spins Linera localnet + deploy + starts apps
vercel.json          Vercel config pointing at frontend-v2
render.yaml          Render blueprint for backend-v2
```

---

## Quickstart

### 1. Requirements
- Rust 1.86+, `wasm32-unknown-unknown` target
- Linera CLI `linera-service@0.15.5`
- Node.js 18+
- Docker Desktop (optional but easiest path)

### 2. One-command localnet

```bash
docker compose up --force-recreate
```

What happens:
1. Container installs Linera + Node toolchain.
2. Localnet + faucet launch (`linera net up --with-faucet`).
3. `price-oracle` contract/service build & publish → new application.
4. `backend-v2` boots (REST 3001, WS 8090) and auto-configures Linera IDs.
5. `frontend-v2` dev server exposes the dashboard on `http://localhost:5173`.

Stop with `Ctrl+C` or `docker compose down`.

### 3. Manual workflow (advanced)

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

## Environment Variables

| Component     | Variables                                      | Notes |
|---------------|------------------------------------------------|-------|
| `backend-v2`  | `PORT` (default 3001)                          | HTTP API port for Render |
|               | `WS_PORT` (default 8090)                       | WebSocket broadcast port |
|               | `LINERA_RPC`                                   | `https://.../chains/<id>/applications/<id>` base |
|               | `LINERA_CHAIN`, `LINERA_ORACLE_APP`            | Set via `/config/linera` API or env |
| `frontend-v2` | `VITE_API_URL`, `VITE_WS_URL`, `VITE_CHAIN_ID` | Optional overrides for hosted deployments |

Create a `.env` inside each package if you prefer file-based configuration; Vite automatically loads `VITE_*` variables.

---

## Deployment Playbooks

### Vercel (frontend)
`vercel.json` already informs Vercel to treat `frontend-v2` as the project root.

```bash
npm install -g vercel
vercel login
vercel --prod
```

Internals:
- `installCommand`: `npm install --prefix frontend-v2`
- `buildCommand`: `npm run build --prefix frontend-v2`
- `outputDirectory`: `frontend-v2/dist`

Optional environment variables (Project Settings → Environment Variables):
```
VITE_API_URL=https://synapsenet-backend.onrender.com
VITE_WS_URL=wss://synapsenet-backend.onrender.com
```

### Render (backend)
`render.yaml` describes a single Node web service rooted at `backend-v2`.

```bash
render blueprint deploy
```

Key settings in the blueprint:
- `buildCommand: npm install`
- `startCommand: npm run start`
- `healthCheckPath: /health`
- Replace `https://your-linera-rpc-endpoint` with the validator you control.
- Render assigns `$PORT`; our Express server already respects it.

### Other Targets
- **Docker/Compose** (local judging) – already compliant with [Linera template](https://github.com/linera-io/buildathon-template.git).
- **Linera testnet/mainnet** – adjust `LINERA_RPC` + wallet data in `run.bash`.

---

## Backend Surface

- `GET /health` – uptime + stats + current Linera binding.
- `POST /config/linera` – body `{ chain, oracleApp }`, hot swaps target.
- `GET /api/v1/price/:token` – aggregated price + oracle inputs.
- `GET /api/v1/candles/:token?interval=1m&limit=100` – OHLCV snapshots.
- `GET /api/v1/stats` – totals, fail counts, average latency.
- WebSocket `ws://<host>:WS_PORT` – `price_update` payloads with live candles.

---

## Contract / Service Highlights

- `PriceOracle` view:
  - `MapView<String, PriceSnapshot>` for historical storage.
  - `RegisterView<Option<PriceSnapshot>>` caches the latest tick.
- `PriceSnapshot`
  - Token, aggregated price, TWAP/VWAP/median, oracle breakdown, timestamp.
- GraphQL service resolvers:
  - `latestPrice`, `price(token: String!)`, `allPrices`.
- Access control & validation:
  - Guard rails around malformed payloads and missing tokens.

Build + test:

```bash
cd price-oracle
cargo fmt && cargo clippy
cargo test
cargo build --release --target wasm32-unknown-unknown
```

---

## Frontend Highlights

- Vite + React 18 + Tailwind + Framer Motion for fast iterations.
- Dashboard pages: live ticker, analytics, alerts, API docs, subscriptions.
- WebSocket reconnect logic with status banners.
- Recharts-based visualizations for TWAP/VWAP/candle overlays.
- Router layout with persistent navigation + theming.

Build locally:

```bash
cd frontend-v2
npm install
npm run build
npm run preview
```

---

## Testing & Tooling

| Target        | Command                                             |
|---------------|-----------------------------------------------------|
| Contract unit tests | `cargo test -p price-oracle`                      |
| Backend lint/test  | `npm run lint && npm test` (scripts coming soon)   |
| Frontend typecheck | `npm run build` (Vite enforces TS via JSX tooling) |
| End-to-end smoke   | `bash test-local.sh`                              |

CI/CD tips:
- Add `npm run lint` & `npm run build --prefix frontend-v2` to Vercel preview checks.
- On Render, enable `Auto-Deploy` so every push redeploys after tests pass.

---

## Troubleshooting

- **Docker healthcheck fails** – ensure `npm install` completes inside container; rerun with `docker compose up --build`.
- **Render health check red** – visit `/health` to read failure causes (Linera unreachable, oracle RPC issues).
- **Vercel 404** – check that project is linked at repo root; `vercel.json` must live at the same level as `package.json`.
- **Backend can’t write to Linera** – verify `LINERA_CHAIN`/`LINERA_ORACLE_APP` (from `run.bash` logs or `/health`).
- **WebSocket blocked** – expose port 8090 or set `WS_PORT` to match hosting provider constraints.

---

## Roadmap

- Expand oracle roster (Kaiko, Amberdata) with dynamic weighting.
- Persist candle history on-chain via secondary microchain.
- Add alerting microservice + push notifications.
- Bring-your-own Linera account onboarding flow in the UI.

---

## License

MIT © 2025 SynapseNet contributors.

---

Built for the Linera Buildathon with ❤️. Let’s connect:
- Issues & discussions: GitHub repository
- Email: hello@synapsenet.io
# SynapseNet - Real-Time Oracle Data on Linera Blockchain

<div align="center">

**Live Chainlink Price Feeds • Linera Smart Contracts • Real-Time WebSocket Streaming**

[![Linera](https://img.shields.io/badge/Linera-v0.15.5-blue)](https://linera.dev)
[![Rust](https://img.shields.io/badge/Rust-1.86.0-orange)](https://www.rust-lang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB)](https://react.dev/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Smart Contract Details](#-smart-contract-details)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔎 Overview

SynapseNet is a decentralized oracle integration platform that bridges real-world data from Chainlink oracles to the Linera blockchain. It demonstrates a complete end-to-end solution for:

- **Real-time price feeds** from Chainlink oracles on Ethereum Sepolia testnet
- **On-chain storage** using Linera smart contracts with persistent state
- **GraphQL API** for querying historical and current price data
- **WebSocket streaming** for live updates to frontend applications
- **React dashboard** for visualizing real-time cryptocurrency prices

### Use Cases

- **DeFi Applications**: Provide reliable price feeds for lending, trading, and derivatives platforms
- **Oracle Integration**: Demonstrate how to integrate external data sources with Linera blockchain
- **Real-time Data Streaming**: Show patterns for streaming blockchain data to web applications
- **Cross-chain Communication**: Bridge data between Ethereum and Linera ecosystems

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ETHEREUM SEPOLIA                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Chainlink Oracle Contract                              │    │
│  │  Address: 0x694AA1769357215DE4FAC081bf1f309aDC325306   │    │
│  │  Function: latestRoundData() → ETH/USD Price           │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────────────────┘
                           │ RPC Call (every 2 seconds)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND LISTENER                            │
│                      (Node.js Service)                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Ethers.js Provider                                     │  │
│  │  • Fetches ETH/USD price every 2 seconds                 │  │
│  │  • Calculates latency and formats data                   │  │
│  │  • HTTP API (port 3001)                                   │  │
│  │  • WebSocket Server (port 8090)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────┬──────────────────────────┬────────────────────────┘
               │ GraphQL Mutation         │ WebSocket Broadcast
               ▼                          ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   LINERA BLOCKCHAIN      │    │   REACT FRONTEND         │
│                          │    │                          │
│  ┌────────────────────┐  │    │  ┌────────────────────┐ │
│  │ Price Oracle       │  │    │  │ Real-time Display  │ │
│  │ Smart Contract     │  │    │  │ • Current Price    │ │
│  │                    │  │    │  │ • Price History    │ │
│  │ State:             │  │    │  │ • Connection Status│ │
│  │ • MapView<Prices>  │  │    │  │ • Latency Info     │ │
│  │ • RegisterView     │  │    │  └────────────────────┘ │
│  │   <LatestPrice>    │  │    │                          │
│  │                    │  │    │  Port: 5173              │
│  │ GraphQL Service:   │  │    └──────────────────────────┘
│  │ • latestPrice()    │  │
│  │ • price(token)     │  │
│  │ • allPrices()      │  │
│  └────────────────────┘  │
│                          │
│  Port: 8080 (GraphQL)    │
└──────────────────────────┘
```

### Data Flow

1. **Oracle Polling**: Backend service polls Chainlink oracle every 2 seconds
2. **Data Processing**: Price data is formatted and timestamped
3. **Dual Broadcasting**:
   - **To Linera**: GraphQL mutation stores data on-chain
   - **To Frontend**: WebSocket pushes real-time updates
4. **State Persistence**: Linera contract maintains historical price data
5. **Query Access**: Frontend or external apps can query via GraphQL

---

## ✨ Features

### Backend (Chainlink Listener)

- ✅ **Real Chainlink Integration**: Connects to live Chainlink oracle on Ethereum Sepolia
- ✅ **Automatic Polling**: Fetches ETH/USD price every 2 seconds
- ✅ **Latency Tracking**: Measures and reports request latency
- ✅ **Dual Output**: Sends data to both Linera blockchain and WebSocket clients
- ✅ **HTTP API**: RESTful endpoints for health checks and configuration
- ✅ **WebSocket Server**: Real-time price streaming to connected clients
- ✅ **Error Handling**: Graceful error handling with automatic retry logic
- ✅ **CORS Enabled**: Cross-origin requests supported for frontend integration

### Linera Smart Contract

- ✅ **Persistent Storage**: Uses Linera's view system for durable state
- ✅ **GraphQL Mutations**: `updatePrice` operation for storing new data
- ✅ **GraphQL Queries**: 
  - `latestPrice`: Get most recent price
  - `price(token)`: Get price for specific token
  - `allPrices`: Retrieve all stored prices
- ✅ **Type Safety**: Strongly typed with Rust and Serde serialization
- ✅ **WASM Compilation**: Compiles to WebAssembly for blockchain execution
- ✅ **Event Logging**: Tracks all price updates with timestamps

### Frontend Dashboard

- ✅ **Real-time Updates**: WebSocket connection for live price streaming
- ✅ **Connection Status**: Visual indicator for WebSocket connection state
- ✅ **Price Display**: Large, readable current price display
- ✅ **Price History**: Shows last 10 price updates
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **Beautiful UI**: Gradient background with glassmorphism effects
- ✅ **Auto-reconnect**: Automatically reconnects on connection loss

---

## 🛠️ Technology Stack

### Backend
- **Node.js** (v18+): JavaScript runtime
- **Ethers.js** (v6.8.1): Ethereum library for blockchain interaction
- **Express** (v4.18.2): Web framework for HTTP API
- **ws** (v8.14.2): WebSocket server implementation
- **node-fetch** (v3.3.2): HTTP client for Linera GraphQL calls
- **cors** (v2.8.5): Cross-origin resource sharing middleware

### Smart Contract
- **Rust** (1.86.0): Systems programming language
- **Linera SDK** (v0.15.5): Linera blockchain development kit
- **Linera Views** (v0.15.5): State management library
- **async-graphql** (v7.0): GraphQL server implementation
- **Serde** (v1.0): Serialization/deserialization framework
- **thiserror** (v2.0): Error handling library

### Frontend
- **React** (v18.2.0): UI library
- **Vite** (v5.0.0): Build tool and dev server
- **JavaScript/JSX**: Programming language

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Bash**: Automation scripts

---

## 📁 Project Structure

```
synapsenet/
├── backend/                      # Node.js backend service
│   ├── listener.js              # Main Chainlink listener service
│   ├── package.json             # Node.js dependencies
│   └── node_modules/            # Installed packages
│
├── frontend/                     # React frontend application
│   ├── src/
│   │   ├── App.jsx              # Main React component
│   │   └── main.jsx             # React entry point
│   ├── index.html               # HTML template
│   ├── vite.config.js           # Vite configuration
│   ├── package.json             # Frontend dependencies
│   └── node_modules/            # Installed packages
│
├── price-oracle/                 # Linera smart contract
│   ├── src/
│   │   ├── lib.rs               # ABI definitions and types
│   │   ├── contract.rs          # Contract logic and operations
│   │   ├── service.rs           # GraphQL service implementation
│   │   └── state.rs             # State management (MapView, RegisterView)
│   ├── Cargo.toml               # Rust dependencies
│   ├── Cargo.lock               # Dependency lock file
│   └── target/                  # Compiled artifacts
│       └── wasm32-unknown-unknown/
│           └── release/
│               ├── price_oracle_contract.wasm  # Contract binary (185 KB)
│               └── price_oracle_service.wasm   # Service binary (1.8 MB)
│
├── Dockerfile                    # Docker container definition
├── compose.yaml                  # Docker Compose configuration
├── run.bash                      # Automated startup script
├── test-local.sh                 # Local testing script
├── PROJECT_SUMMARY.md            # Project summary document
└── README.md                     # This file
```

### Key Files Explained

#### Backend Files

**`backend/listener.js`** (200 lines)
- Main service class `ChainlinkListener`
- Connects to Chainlink oracle using Ethers.js
- Manages WebSocket server for real-time broadcasting
- Handles HTTP API endpoints
- Sends GraphQL mutations to Linera

**`backend/package.json`**
- Defines project metadata and dependencies
- Scripts for starting the service
- ES module configuration

#### Frontend Files

**`frontend/src/App.jsx`** (150 lines)
- Main React component
- WebSocket connection management
- State management for price and history
- Inline styles for UI components

**`frontend/src/main.jsx`**
- React application entry point
- Renders App component to DOM

**`frontend/vite.config.js`**
- Vite build configuration
- Development server settings

#### Smart Contract Files

**`price-oracle/src/lib.rs`** (40 lines)
- Defines `PriceOracleAbi` for contract interface
- `Operation` enum for contract operations
- `PriceData` struct for price information
- Implements ContractAbi and ServiceAbi traits

**`price-oracle/src/contract.rs`** (75 lines)
- `PriceOracleContract` struct
- Implements `Contract` trait
- `execute_operation` handles price updates
- State loading and saving logic

**`price-oracle/src/service.rs`** (90 lines)
- `PriceOracleService` struct
- Implements `Service` trait
- GraphQL query resolvers
- Schema definition with async-graphql

**`price-oracle/src/state.rs`** (12 lines)
- `PriceOracle` state struct
- Uses `MapView` for price storage
- Uses `RegisterView` for latest price
- Derives `RootView` for persistence

**`price-oracle/Cargo.toml`**
- Rust package configuration
- Dependencies and versions
- Binary targets for contract and service

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

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/synapsenet.git
cd synapsenet
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Build Smart Contract

```bash
cd price-oracle
cargo build --release --target wasm32-unknown-unknown
cd ..
```

Verify WASM files are created:
```bash
ls -lh price-oracle/target/wasm32-unknown-unknown/release/*.wasm
```

Expected output:
```
price_oracle_contract.wasm  (185 KB)
price_oracle_service.wasm   (1.8 MB)
```

---

## 🎮 Running the Application

### Option 1: Docker (Recommended)

**Easiest method - everything automated:**

```bash
docker compose up --force-recreate
```

This will:
1. Build the Docker container with all dependencies
2. Start Linera local network with faucet
3. Compile and deploy the smart contract
4. Start the backend listener
5. Start the frontend dashboard

Access the application at: **http://localhost:5173**

### Option 2: Manual Setup

**Step-by-step manual execution:**

#### Step 1: Start Linera Network

```bash
# Initialize Linera network
linera net up --with-faucet

# In a new terminal, set environment variables
export LINERA_FAUCET_URL=http://localhost:8080
linera wallet init --faucet="$LINERA_FAUCET_URL"
linera wallet request-chain --faucet="$LINERA_FAUCET_URL"
```

#### Step 2: Deploy Smart Contract

```bash
cd price-oracle

# Build contract
cargo build --release --target wasm32-unknown-unknown

# Publish bytecode
BYTECODE_ID=$(linera publish-bytecode \
  target/wasm32-unknown-unknown/release/price_oracle_{contract,service}.wasm)

# Create application
APP_ID=$(linera create-application $BYTECODE_ID)

echo "Contract deployed!"
echo "Bytecode ID: $BYTECODE_ID"
echo "App ID: $APP_ID"

cd ..
```

#### Step 3: Start Backend

```bash
cd backend

# Set Linera configuration
export LINERA_RPC=http://localhost:8080

# Start listener
node listener.js &
LISTENER_PID=$!

# Configure with deployed contract
curl -X POST http://localhost:3001/config \
  -H "Content-Type: application/json" \
  -d "{\"chain\":\"YOUR_CHAIN_ID\",\"app\":\"$APP_ID\"}"

cd ..
```

#### Step 4: Start Frontend

```bash
cd frontend
npm run dev
```

Access the application at: **http://localhost:5173**

### Option 3: Development Mode

**For active development:**

```bash
# Terminal 1: Backend with auto-reload
cd backend
npm start

# Terminal 2: Frontend with hot reload
cd frontend
npm run dev

# Terminal 3: Watch contract changes
cd price-oracle
cargo watch -x 'build --release --target wasm32-unknown-unknown'
```

---

## 📡 API Documentation

### Backend HTTP API

#### Health Check

```http
GET http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok",
  "lastPrice": 3161.66,
  "linera": {
    "chain": "e476...",
    "app": "e476..."
  }
}
```

#### Configure Linera

```http
POST http://localhost:3001/config
Content-Type: application/json

{
  "chain": "e476abc123...",
  "app": "e476def456..."
}
```

**Response:**
```json
{
  "success": true
}
```

### WebSocket API

#### Connect

```javascript
const ws = new WebSocket('ws://localhost:8090');

ws.onopen = () => {
  console.log('Connected to SynapseNet');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Price update:', data);
};
```

#### Message Format

```json
{
  "type": "price_update",
  "data": {
    "token": "ETH",
    "price": 3161.66,
    "source": "Chainlink Oracle",
    "network": "Ethereum Sepolia"
  },
  "timestamp": 1700000000000,
  "latency": 250
}
```

### Linera GraphQL API

#### Endpoint

```
http://localhost:8080/chains/{CHAIN_ID}/applications/{APP_ID}
```

#### Mutation: Update Price

```graphql
mutation UpdatePrice($token: String!, $price: Float!, $source: String!, $network: String!) {
  updatePrice(
    token: $token
    price: $price
    source: $source
    network: $network
  )
}
```

**Variables:**
```json
{
  "token": "ETH",
  "price": 3161.66,
  "source": "Chainlink Oracle",
  "network": "Ethereum Sepolia"
}
```

#### Query: Latest Price

```graphql
query {
  latestPrice {
    token
    price
    timestamp
    source
    network
  }
}
```

**Response:**
```json
{
  "data": {
    "latestPrice": {
      "token": "ETH",
      "price": 3161.66,
      "timestamp": 1700000000000000,
      "source": "Chainlink Oracle",
      "network": "Ethereum Sepolia"
    }
  }
}
```

#### Query: Specific Token Price

```graphql
query GetPrice($token: String!) {
  price(token: $token) {
    token
    price
    timestamp
    source
    network
  }
}
```

#### Query: All Prices

```graphql
query {
  allPrices {
    token
    price
    timestamp
    source
    network
  }
}
```

---

## 🔐 Smart Contract Details

### State Structure

```rust
pub struct PriceOracle {
    // Stores all price data by token symbol
    pub prices: MapView<String, PriceData>,
    
    // Stores the most recent price update
    pub latest_price: RegisterView<Option<PriceData>>,
}
```

### Data Types

```rust
pub struct PriceData {
    pub token: String,      // Token symbol (e.g., "ETH")
    pub price: f64,         // Price in USD
    pub timestamp: u64,     // Unix timestamp in microseconds
    pub source: String,     // Data source (e.g., "Chainlink Oracle")
    pub network: String,    // Network name (e.g., "Ethereum Sepolia")
}
```

### Operations

```rust
pub enum Operation {
    UpdatePrice {
        token: String,
        price: f64,
        source: String,
        network: String,
    },
}
```

### Contract Logic

1. **Load State**: Retrieves persistent state from blockchain storage
2. **Execute Operation**: Processes `UpdatePrice` operation
   - Generates timestamp using system time
   - Creates `PriceData` struct
   - Inserts into `prices` MapView
   - Updates `latest_price` RegisterView
3. **Store State**: Persists updated state to blockchain

### GraphQL Service

The service provides three query resolvers:

1. **`latestPrice()`**: Returns the most recent price update
2. **`price(token: String)`**: Returns price for a specific token
3. **`allPrices()`**: Returns all stored prices

---

## 🧪 Testing

### Test Contract Compilation

```bash
cd price-oracle
cargo test
cargo check --target wasm32-unknown-unknown
```

### Test Backend

```bash
cd backend

# Run listener
node listener.js

# In another terminal, test health endpoint
curl http://localhost:3001/health

# Test WebSocket connection
wscat -c ws://localhost:8090
```

### Test Frontend

```bash
cd frontend
npm run dev

# Open browser to http://localhost:5173
# Check browser console for WebSocket connection
```

### Integration Test

```bash
# Run the test script
bash test-local.sh
```

This verifies:
- ✅ Prerequisites installed
- ✅ Contract compiles
- ✅ Backend dependencies installed
- ✅ Frontend dependencies installed

---

## 🚢 Deployment

### Deploy to Linera Testnet Conway

```bash
# Initialize wallet with testnet
linera wallet init --with-new-chain \
  --faucet https://faucet.testnet-conway.linera.net

# Build contract
cd price-oracle
cargo build --release --target wasm32-unknown-unknown

# Publish to testnet
linera publish-bytecode \
  target/wasm32-unknown-unknown/release/price_oracle_{contract,service}.wasm

# Create application
linera create-application <BYTECODE_ID>
```

### Deploy Backend to Cloud

**Example: Deploy to Heroku**

```bash
cd backend

# Create Procfile
echo "web: node listener.js" > Procfile

# Deploy
heroku create synapsenet-backend
git push heroku main
```

**Environment Variables:**
```bash
heroku config:set LINERA_RPC=https://your-linera-node.com
```

### Deploy Frontend to Vercel

```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Environment Variables:**
```
VITE_WS_URL=wss://your-backend.com
VITE_LINERA_GRAPHQL=https://your-linera-node.com/graphql
```

---

## 🐛 Troubleshooting

### Contract Won't Compile

**Error**: `error[E0599]: no method named 'save' found`

**Solution**: Ensure you have the correct Linera SDK version:
```bash
cargo update
cargo clean
cargo build --release --target wasm32-unknown-unknown
```

### Backend Can't Connect to Chainlink

**Error**: `Error fetching price: timeout`

**Solution**: Check your internet connection and RPC endpoint:
```bash
curl https://ethereum-sepolia.publicnode.com
```

### WebSocket Connection Fails

**Error**: `WebSocket connection failed`

**Solution**: 
1. Check if backend is running: `curl http://localhost:3001/health`
2. Check firewall settings for port 8090
3. Verify WebSocket URL in frontend code

### Linera Network Won't Start

**Error**: `Failed to parse path as spawn_mode`

**Solution**: This is a Windows path issue. Use WSL or Docker:
```bash
# On Windows, use WSL
wsl
cd /mnt/c/path/to/synapsenet
linera net up --with-faucet
```

### Frontend Shows "Disconnected"

**Checklist**:
1. ✅ Backend is running: `curl http://localhost:3001/health`
2. ✅ WebSocket server is active: `netstat -an | grep 8090`
3. ✅ No firewall blocking port 8090
4. ✅ Correct WebSocket URL in App.jsx

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Linera Protocol**: For the innovative blockchain platform
- **Chainlink**: For reliable oracle infrastructure
- **Ethereum Foundation**: For the Sepolia testnet
- **Open Source Community**: For the amazing tools and libraries

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/synapsenet/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/synapsenet/discussions)
- **Email**: support@synapsenet.io

---

## 🗺️ Roadmap

### Phase 1: Core Functionality (✅ Complete)
- [x] Chainlink oracle integration
- [x] Linera smart contract
- [x] WebSocket streaming
- [x] React dashboard

### Phase 2: Enhanced Features (🚧 In Progress)
- [ ] Multi-token support (BTC, MATIC, etc.)
- [ ] Historical price charts
- [ ] Price alerts and notifications
- [ ] Mobile app

### Phase 3: Advanced Features (📋 Planned)
- [ ] Multi-oracle aggregation
- [ ] Decentralized governance
- [ ] Cross-chain bridges
- [ ] Advanced analytics dashboard

---

<div align="center">

**Built with ❤️ for the Linera Buildathon**

[Website](https://synapsenet.io) • [Documentation](https://docs.synapsenet.io) • [Twitter](https://twitter.com/synapsenet)

</div>

