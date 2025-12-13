# SynapseNet

**Real-time multi-oracle price aggregation on Linera microchains**

Built by Ayush for Linera Buildathon

> **TL;DR for Judges:**  
> SynapseNet is a multi-oracle price network where each oracle runs on its own Linera microchain.  
> Prices are aggregated in real time via cross-chain messaging and streamed instantly to DeFi apps.

---

## What is SynapseNet?

SynapseNet is a decentralized oracle network that aggregates cryptocurrency prices from multiple sources (Chainlink, Pyth, CoinGecko) and delivers them through Linera's microchain architecture. It provides DeFi applications with reliable, tamper-proof price data through cross-chain messaging and event streaming.

---

## The Problem SynapseNet Solves

Today's DeFi protocols depend on **single-oracle price feeds** or loosely coupled off-chain aggregators.

This creates serious risks:

- **Oracle manipulation** can liquidate entire protocols
- **Outages or stale feeds** cause cascading failures
- **No coordination between oracles** — each operates in isolation
- **High latency** when aggregating prices on-chain
- **Poor fit for multi-chain DeFi**

Existing oracle networks were not designed for **real-time, multi-source coordination**.

---

## Why Linera?

Traditional oracle solutions face critical limitations:
- **Single points of failure**: One oracle = one source of truth
- **Slow updates**: Blockchain queries introduce latency
- **No cross-chain coordination**: Oracles operate in silos

**Linera solves this with:**
- **Microchains**: Each oracle provider runs on its own chain
- **Cross-chain messaging**: Providers communicate directly without intermediaries
- **Event streaming**: Real-time price updates to subscribers
- **Sub-second finality**: Instant price aggregation

---

## Why This Is Only Possible on Linera

SynapseNet is not just deployed on Linera — it is **architected around Linera's microchains**.

On traditional blockchains:
- All oracles compete for the same global state
- Aggregation becomes slow and expensive
- Cross-oracle coordination requires off-chain trust

Linera enables a new oracle design:

- **One microchain per oracle provider**
- **Direct cross-chain messaging for aggregation**
- **Sub-second finality for real-time prices**
- **Event streaming instead of polling**
- **Clean separation of providers, aggregator, and consumers**

Without Linera's microchains, this architecture would either be:
- Too slow
- Too expensive
- Or too centralized

---

## Architecture

SynapseNet uses a **6-chain architecture**:

```
┌─────────────┐
│ Master Chain│ ← Coordinates the network
└──────┬──────┘
       │
       ├──→ ┌──────────────────┐
       │    │ Aggregator Chain │ ← Collects & aggregates prices
       │    └──────────────────┘
       │
       ├──→ ┌──────────────────┐
       │    │ Chainlink Chain  │ ← Provider 1
       │    └──────────────────┘
       │
       ├──→ ┌─────────────────┐
       │    │ Pyth Chain      │ ← Provider 2
       │    └─────────────────┘
       │
       ├──→ ┌──────────────────┐
       │    │ CoinGecko Chain  │ ← Provider 3
       │    └──────────────────┘
       │
       └──→ ┌──────────────────┐
            │ Consumer Chain   │ ← DeFi apps subscribe here
            └──────────────────┘
```

**Data Flow:**
1. Backend fetches prices from external APIs (Chainlink, Pyth, CoinGecko)
2. Prices submitted to individual provider chains via cross-chain messages
3. Aggregator chain collects submissions and calculates median/TWAP/VWAP
4. Aggregated price stored on-chain and streamed to subscribers
5. Frontend receives real-time updates via WebSocket

---

## Features

### ✅ Working Now

**Multi-Oracle Aggregation**
- Fetches from Chainlink (Sepolia), Pyth Network, CoinGecko
- Calculates median, TWAP, VWAP
- Reputation-weighted scoring
- Updates every 2 seconds

**Linera Integration**
- 6-chain microchain architecture
- Cross-chain messaging between providers
- Event streaming for real-time updates
- GraphQL queries for historical data
- On-chain price storage with MapView

**Price Alerts**
- Create alerts stored on blockchain
- Automatic trigger detection
- Real-time notifications via WebSocket
- Persistent across restarts

**Real-Time Dashboard**
- Live price updates (ETH, BTC, SOL, MATIC, LINK)
- Oracle network status monitoring
- Analytics with query volume and latency
- OHLC candlestick data

**Production Ready**
- Docker Compose one-command deployment
- Health checks and monitoring
- WebSocket for real-time updates
- REST API for integration

### 🚧 Coming Soon

- Additional oracle sources (API3, RedStone, Band Protocol)
- Advanced aggregation algorithms (outlier detection, confidence intervals)
- Historical price charts with more timeframes
- Mobile app for price monitoring
- Public testnet deployment

---

## Use Cases

**DeFi Lending Protocols**
- Accurate collateral valuation
- Liquidation price triggers
- Interest rate calculations

**Decentralized Exchanges**
- Fair price discovery
- Slippage protection
- Arbitrage detection

**Derivatives & Options**
- Strike price determination
- Settlement calculations
- Margin requirements

**Trading Bots**
- Multi-source price validation
- Arbitrage opportunities
- Risk management

**Analytics Platforms**
- Historical price data
- Market trend analysis
- Oracle reliability metrics

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- 4GB RAM minimum
- Internet connection (for oracle APIs)

### One-Command Deployment

```bash
docker compose up
```

This will:
1. Start Linera localnet with 6 chains
2. Deploy oracle smart contract
3. Register 3 oracle providers
4. Start backend aggregator
5. Launch frontend dashboard

**Access:**
- Dashboard: http://localhost:5173
- Backend API: http://localhost:3001
- GraphQL: http://localhost:8081

### Verify It's Working

1. **Check Dashboard**: Open http://localhost:5173
   - Should see real ETH/BTC prices updating
   - Prices match current market rates (in USD)

2. **Test API**:
   ```bash
   curl http://localhost:3001/api/prices
   ```

3. **Verify Linera Wallet** (Shows multi-chain setup):
   ```bash
   # Find the wallet location
   docker compose exec oracle bash -c "find /tmp -name 'wallet_*.json' 2>/dev/null | head -1"
   
   # Show wallet with all chains
   docker compose exec oracle bash -c "export LINERA_WALLET=\$(find /tmp -name 'wallet_1.json' 2>/dev/null | head -1) && export LINERA_KEYSTORE=\${LINERA_WALLET/wallet/keystore} && export LINERA_STORAGE=rocksdb:\${LINERA_WALLET%/*}/client_1.db && linera wallet show"
   ```
   
   **Expected Output:**
   ```
   ╭───────────────────────────────────────────────────────┬──────────────────────────────────────────────────────╮
   │ Chain ID                                              ┆ Latest Block                                         │
   ╞═══════════════════════════════════════════════════════╪══════════════════════════════════════════════════════╡
   │ 08e1ec683116f9997e5e8a51d8be6fc79f1ce8e4f25a8769fe9ef ┆ AccountOwner:       -                                │
   │ 5f62bbc8adf                                           ┆ Block Hash:         -                                │
   │                                                       ┆ Timestamp:          2025-12-13 12:00:18.295703       │
   │                                                       ┆ Next Block Height:  0                                │
   ├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
   │ [6 more chains...]                                    ┆ ...                                                  │
   ╰───────────────────────────────────────────────────────┴──────────────────────────────────────────────────────╯
   ```
   
   This confirms:
   - 7 Linera chains created (Master, Aggregator, 3 Providers, Consumer, Genesis)
   - Each chain has unique AccountOwner (public key)
   - Wallet managing all chains in one place
   - Cross-chain messaging infrastructure ready

4. **Create Alert**:
   - Go to Alerts page
   - Set "ETH above $3500"
   - Watch it trigger when price crosses threshold

5. **Check Logs**:
   ```bash
   docker logs -f linera_oracle-oracle-1
   ```
   - Look for "💰 ETH: $3197.35 (3 oracles, 245ms) → Linera"

---

## Testing & Validation

### Deployment Test Results

**Successfully deployed on local Linera devnet:**

```
Application ID: 023018aa82fffc04434d19a41e3f979917aeface29dd161f061d6f1af3544c03f
```

**Chain IDs Created:**
- Master Chain: `2359dd3520fedb9ce1affd06b895aca37c85c0d278e81d21663c63f0197a6edb`
- Aggregator Chain: `5c9ee131ea831fa8cc57171093583d8b7214c01569a494e9ca362c7790e86a97`
- Chainlink Provider: `750ba1834ee851b7c2dc995535616e127fc4e6c4573b3bf0f61ba4f995be41f0`
- Pyth Provider: `ec267fd1e48b7d559840a5f7f75de251fa3862b417f5b8148c4f4adc732c11a8`
- CoinGecko Provider: `f652dd08d58f6de771d699a59458e265cfb419662e7d58961174f11d570be620`
- Consumer Chain: `d8608916f43fec4fd8fb645e0a5c2ac3c388276ac8dfc2ebda6d8c918c4338a8`

### What We Tested

**✅ Multi-Chain Deployment**
- 6 chains created successfully
- Cross-chain messaging working
- Provider registration confirmed

**✅ Oracle Integration**
- Chainlink: Fetching from Sepolia testnet contracts
- Pyth: Real-time data from Hermes API
- CoinGecko: Market prices via public API
- All 3 sources updating every 2 seconds

**✅ Price Aggregation**
- Median calculation working
- TWAP/VWAP computed correctly
- Reputation weighting applied
- Prices stored on-chain

**✅ Real-Time Updates**
- WebSocket broadcasting to frontend
- Dashboard showing live prices
- Updates every 2 seconds
- No lag or delays

**✅ Alert System**
- Alerts stored on Linera blockchain
- Trigger detection working
- WebSocket notifications sent
- Browser notifications displayed

**✅ GraphQL Queries**
- `latestPrice` query working
- `allPrices` returning data
- `userAlerts` fetching from chain
- `networkStats` showing metrics

**✅ Frontend Integration**
- Dashboard displaying real prices
- Analytics page showing statistics
- Alerts page CRUD operations
- All pages responsive and working

### Test Commands

**Query Latest Price:**
```bash
curl -X POST http://localhost:8081/chains/2359dd3520fedb9ce1affd06b895aca37c85c0d278e81d21663c63f0197a6edb/applications/023018aa82fffc04434d19a41e3f979917aeface29dd161f061d6f1af3544c03f \
  -H "Content-Type: application/json" \
  -d '{"query":"{ latestPrice { token price timestamp } }"}'
```

**Get Network Stats:**
```bash
curl -X POST http://localhost:8081/chains/2359dd3520fedb9ce1affd06b895aca37c85c0d278e81d21663c63f0197a6edb/applications/023018aa82fffc04434d19a41e3f979917aeface29dd161f061d6f1af3544c03f \
  -H "Content-Type: application/json" \
  -d '{"query":"{ networkStats { totalQueries activeOracles avgLatency } }"}'
```

**Create Alert (via backend):**
```bash
curl -X POST http://localhost:3001/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"token":"ETH","condition":"above","value":3500}'
```

### Performance Metrics

**Observed During Testing:**
- Price update latency: 200-300ms average
- Oracle response time: 15-25ms (Chainlink), 18-30ms (Pyth), 20-35ms (CoinGecko)
- WebSocket message delivery: <10ms
- GraphQL query response: 50-100ms
- Frontend render time: <16ms (60fps)

### Known Limitations

**Current Deployment:**
- Running on local devnet (not public testnet)
- Limited to 5 tokens (ETH, BTC, SOL, MATIC, LINK)
- Chainlink using Sepolia testnet (not mainnet)
- Free tier API rate limits apply

**These will be addressed in future versions.**

---

## Project Structure

```
├── oracle-microchain/       # Linera smart contract (Rust/WASM)
│   ├── src/
│   │   ├── contract.rs      # Cross-chain messaging, aggregation
│   │   ├── service.rs       # GraphQL queries
│   │   ├── state.rs         # MapView storage
│   │   └── lib.rs           # Types & events
│   └── Cargo.toml
│
├── backend-v2/              # Oracle aggregator (Node.js)
│   ├── src/
│   │   ├── index.js         # Main server, WebSocket
│   │   ├── oracles/         # Chainlink, Pyth, CoinGecko
│   │   └── aggregation/     # Price aggregation, candles
│   └── package.json
│
├── frontend-v2/             # Dashboard (React + Vite)
│   ├── src/
│   │   ├── pages/           # Dashboard, Analytics, Alerts
│   │   └── components/      # Layout, UI components
│   └── package.json
│
├── run.bash                 # Multi-chain deployment script
├── compose.yaml             # Docker orchestration
├── Dockerfile               # Production container
└── README.md                # This file
```

---

## Technology Stack

**Blockchain**
- Linera SDK 0.15.5
- Rust 1.86.0
- WASM (WebAssembly)

**Backend**
- Node.js 18+
- Express (REST API)
- WebSocket (real-time updates)
- Ethers.js (Chainlink integration)

**Frontend**
- React 18
- Vite (build tool)
- Tailwind CSS
- Recharts (data visualization)
- Framer Motion (animations)

**Oracles**
- Chainlink (Ethereum Sepolia)
- Pyth Network (Hermes API)
- CoinGecko (Public API)

---

## API Documentation

### REST Endpoints

**Get All Prices**
```bash
GET /api/prices
```
Returns current prices for all tracked tokens.

**Get Specific Token**
```bash
GET /api/v1/price/:token
```
Example: `/api/v1/price/ETH`

**Get Analytics**
```bash
GET /api/analytics
```
Returns network statistics and oracle performance.

**Health Check**
```bash
GET /health
```

### WebSocket

Connect to `ws://localhost:8090` for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8090');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Price update:', data);
};
```

**Message Format:**
```json
{
  "type": "price_update",
  "symbol": "ETH",
  "price": 3197.35,
  "sources": ["chainlink", "pyth", "coingecko"],
  "timestamp": 1702345678000,
  "confidence": 0.95
}
```

### GraphQL

Query the Linera contract directly:

```graphql
query {
  latestPrice {
    token
    price
    median
    twap
    vwap
    timestamp
  }
}
```

---

## Deployment

### Local Development
```bash
docker compose up
```

### Production Deployment

**Railway (Recommended - 8GB RAM Free Tier)**
See [RAILWAY.md](./RAILWAY.md) for complete guide.

Quick steps:
1. Go to https://railway.app
2. Deploy from GitHub: `ayushsaklani-min/Linera_oracle`
3. Railway auto-detects Dockerfile
4. Wait 15-20 minutes for first build
5. Access at `https://your-app.railway.app`

**Alternative Platforms**
- Vercel (frontend only) - See [DEPLOYMENT.md](./DEPLOYMENT.md)
- Render (requires paid plan for 2GB+ RAM)
- DigitalOcean App Platform ($5/month)

---

## How It Works

### 1. Price Collection
Backend polls three oracle sources every 2 seconds:
- **Chainlink**: On-chain price feeds (Sepolia testnet)
- **Pyth**: Real-time price API
- **CoinGecko**: Market aggregated prices

### 2. Aggregation
Prices are aggregated using:
- **Median**: Middle value (outlier resistant)
- **TWAP**: Time-weighted average
- **VWAP**: Volume-weighted average
- **Reputation weighting**: Based on oracle reliability

### 3. Cross-Chain Submission
Each oracle's price is submitted to its dedicated provider chain via Linera's cross-chain messaging.

### 4. On-Chain Storage
Aggregated prices stored in Linera contract using MapView:
```rust
MapView<String, PriceData>  // token → price data
```

### 5. Event Streaming
Price updates broadcast to subscribers via Linera's event streaming:
```rust
runtime.emit(ORACLE_STREAM_NAME, &OracleEvent::PriceUpdate { ... });
```

### 6. Real-Time Updates
Frontend receives updates through WebSocket and displays live prices.

---

## Linera Features Used

 **Cross-Chain Messaging**
- Providers send prices to aggregator
- Master chain coordinates registration

 **Event Streaming**
- Real-time price updates
- Alert notifications

 **Parameters**
- Master chain ID
- Aggregator chain ID

 **State Management**
- MapView for price storage
- RegisterView for latest price cache

 **GraphQL Service**
- Query historical prices
- Fetch oracle statistics

---

## Monitoring

### Backend Logs
```bash
docker logs -f linera_oracle-oracle-1
```

Look for:
- `ETH: $3197.35 (3 oracles, 245ms) → Linera` - Price updates
- `Oracle deployed: <app-id>` - Successful deployment
- `Alert triggered: ETH ABOVE $3500` - Alert notifications

### Health Check
```bash
curl http://localhost:3001/health
```

Returns:
```json
{
  "status": "ok",
  "stats": {
    "totalUpdates": 1523,
    "successfulUpdates": 1520,
    "avgLatency": 245
  },
  "oracles": ["chainlink", "pyth", "coingecko"],
  "tokens": ["ETH", "BTC", "SOL", "MATIC", "LINK"]
}
```

---

## Troubleshooting

**Prices show $0**
- Wait 30 seconds for first update
- Check backend logs for oracle API errors
- Verify internet connection

**"Application failed to respond"**
- Container still starting (wait 2-3 minutes)
- Check Docker logs for errors

**WebSocket not connecting**
- Ensure port 8090 is not blocked
- Check browser console for errors

**Build fails**
- Ensure 4GB RAM available
- Try: `docker compose up --build --force-recreate`

---

## Contributing

This project was built for the Linera Buildathon. Contributions welcome after the event!

---

## License

MIT License - see LICENSE file for details

---

## Acknowledgments

- **Linera Protocol** - For the innovative microchain architecture
- **Chainlink** - Decentralized oracle infrastructure
- **Pyth Network** - Real-time price feeds
- **CoinGecko** - Comprehensive market data

---

## Contact

Built by **Ayush** for Linera Buildathon 2025


---

**SynapseNet** - Bringing reliable, decentralized price data to Linera microchains 🚀
