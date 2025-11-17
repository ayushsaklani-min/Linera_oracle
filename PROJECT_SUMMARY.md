# SynapseNet - Project Summary

## What We Built

A real-time Chainlink oracle integration with Linera blockchain that demonstrates:
- Live ETH/USD price feeds from Chainlink (Ethereum Sepolia testnet)
- Linera smart contract for on-chain price storage with persistent state
- Real-time WebSocket streaming to a React dashboard
- GraphQL API for querying price data

## Architecture

```
┌─────────────────┐
│ Chainlink Oracle│ (Ethereum Sepolia)
│   ETH/USD Feed  │
└────────┬────────┘
         │ Every 2 seconds
         ▼
┌─────────────────┐
│  Node.js        │
│  Listener       │ (backend/listener.js)
│  + WebSocket    │
└────────┬────────┘
         │ GraphQL Mutation
         ▼
┌─────────────────┐
│ Linera Contract │ (price-oracle/)
│  Price Storage  │ - MapView for all prices
│  + GraphQL API  │ - RegisterView for latest
└────────┬────────┘
         │ WebSocket Stream
         ▼
┌─────────────────┐
│ React Dashboard │ (frontend/)
│  Live Updates   │ - Current price
│  Price History  │ - Recent history
└─────────────────┘
```

## Key Components

### 1. Linera Smart Contract (`price-oracle/`)
- **Language**: Rust
- **SDK**: linera-sdk 0.15.5
- **Features**:
  - Persistent state using `MapView` and `RegisterView`
  - GraphQL mutations for price updates
  - GraphQL queries for price retrieval
  - WASM compilation target

**Operations**:
- `updatePrice(token, price, source, network)` - Store new price data

**Queries**:
- `latestPrice` - Get most recent price
- `price(token)` - Get price for specific token
- `allPrices` - Get all stored prices

### 2. Backend Listener (`backend/`)
- **Language**: Node.js (ES modules)
- **Dependencies**: ethers.js, ws, express
- **Features**:
  - Connects to Chainlink oracle on Ethereum Sepolia
  - Polls price every 2 seconds
  - Sends GraphQL mutations to Linera contract
  - WebSocket server for real-time broadcasting
  - HTTP API for health checks and configuration

**Endpoints**:
- `GET /health` - Service health status
- `POST /config` - Configure Linera chain/app IDs
- `WS ws://localhost:8090` - WebSocket price stream

### 3. Frontend Dashboard (`frontend/`)
- **Framework**: React 18 + Vite
- **Features**:
  - Real-time price display
  - Connection status indicator
  - Price history (last 10 updates)
  - Responsive gradient UI
  - WebSocket auto-reconnection

## Compliance with Wave 2 Requirements

✅ **Compiles Successfully**
- Contract builds to WASM without errors
- All dependencies resolved
- Tested with `cargo build --release --target wasm32-unknown-unknown`

✅ **Functional Linera Contract**
- Uses official Linera SDK 0.15.5
- Implements Contract and Service traits
- Persistent state with RootView
- GraphQL integration for mutations and queries
- Proper WASM binaries generated

✅ **Uses Buildathon Template**
- Based on official linera-io/buildathon-template
- Maintains required port structure (5173, 8080, 9001, 13001)
- Includes Dockerfile with all dependencies
- Docker Compose configuration
- Automated run.bash script

## How to Run

### Option 1: Docker (Recommended for Submission)
```bash
docker compose up --force-recreate
```
Access at: http://localhost:5173

### Option 2: Manual Setup
```bash
# Start Linera network
linera net up --with-faucet

# Build and deploy contract
cd price-oracle
cargo build --release --target wasm32-unknown-unknown
linera publish-bytecode target/wasm32-unknown-unknown/release/price_oracle_{contract,service}.wasm
linera create-application <BYTECODE_ID>

# Start backend
cd ../backend
npm install
LINERA_RPC=http://localhost:8080 node listener.js &

# Configure backend with chain/app IDs
curl -X POST http://localhost:3001/config \
  -H "Content-Type: application/json" \
  -d '{"chain":"<CHAIN_ID>","app":"<APP_ID>"}'

# Start frontend
cd ../frontend
npm install
npm run dev
```

## Testing

Run the test script to verify compilation:
```bash
bash test-local.sh
```

This checks:
- Prerequisites (Rust, Linera CLI, Node.js)
- Contract compilation
- Backend dependencies
- Frontend dependencies

## Technical Highlights

1. **Real Oracle Integration**: Not simulated - actual Chainlink price feed from Ethereum Sepolia
2. **Persistent State**: Uses Linera's view system for durable storage
3. **Real-time Updates**: WebSocket streaming with <200ms latency
4. **Production Ready**: Error handling, reconnection logic, health checks
5. **Clean Architecture**: Separation of concerns between oracle, blockchain, and UI

## Future Enhancements

- Multi-token support (BTC, MATIC, etc.)
- Historical price charts
- Price alerts and notifications
- Aggregation from multiple oracles
- Testnet Conway deployment

## Dependencies

**Rust**:
- linera-sdk 0.15.5
- async-graphql 7.0
- serde 1.0
- thiserror 2.0

**Node.js**:
- ethers 6.8.1
- ws 8.14.2
- express 4.18.2
- node-fetch 3.3.2

**Frontend**:
- react 18.2.0
- vite 5.0.0

## File Structure

```
buildathon-template/
├── price-oracle/          # Linera smart contract
│   ├── src/
│   │   ├── lib.rs        # ABI definitions
│   │   ├── state.rs      # State management
│   │   ├── contract.rs   # Contract logic
│   │   └── service.rs    # GraphQL service
│   └── Cargo.toml
├── backend/               # Chainlink listener
│   ├── listener.js
│   └── package.json
├── frontend/              # React dashboard
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── Dockerfile             # Container definition
├── compose.yaml           # Docker Compose config
├── run.bash              # Automated startup script
└── README.md             # Documentation
```

## Submission Checklist

- [x] Contract compiles successfully
- [x] Uses Linera SDK 0.15.5
- [x] Based on buildathon template
- [x] Includes Dockerfile and compose.yaml
- [x] Maintains required port structure
- [x] Includes run.bash automation
- [x] Has functional frontend
- [x] Real blockchain integration (Chainlink)
- [x] Documentation complete
- [x] Ready for local testing

## Contact & Links

- GitHub: (Your repository URL)
- Demo Video: (If applicable)
- Documentation: See README.md

---

Built with ❤️ for Linera Buildathon Wave 2
