#!/usr/bin/env bash

set -eu

eval "$(linera net helper)"
linera_spawn linera net up --with-faucet

export LINERA_FAUCET_URL=http://localhost:8080
linera wallet init --faucet="$LINERA_FAUCET_URL"
CHAIN_ID=$(linera wallet request-chain --faucet="$LINERA_FAUCET_URL" | grep -oP 'e476[a-f0-9]+')

echo "📦 Building Linera contract..."
cd /build/price-oracle
cargo build --release --target wasm32-unknown-unknown

echo "🚀 Publishing contract to Linera..."
BYTECODE_ID=$(linera publish-bytecode \
  target/wasm32-unknown-unknown/release/price_oracle_{contract,service}.wasm | \
  grep -oP 'e476[a-f0-9]+')

echo "📝 Creating application..."
APP_ID=$(linera create-application "$BYTECODE_ID" | grep -oP 'e476[a-f0-9]+')

echo "✅ Contract deployed!"
echo "   Chain ID: $CHAIN_ID"
echo "   App ID: $APP_ID"

# Start backend listener
echo "🎧 Starting Chainlink listener..."
cd /build/backend-v2
. ~/.nvm/nvm.sh
npm install
export LINERA_RPC=http://localhost:8080
node listener.js &
LISTENER_PID=$!

# Wait for listener to start
sleep 3

# Configure listener with Linera details
curl -X POST http://localhost:3001/config \
  -H "Content-Type: application/json" \
  -d "{\"chain\":\"$CHAIN_ID\",\"app\":\"$APP_ID\"}"

# Start frontend
echo "🌐 Starting frontend..."
cd /build/frontend-v2
npm install
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ SynapseNet is running!"
echo "   Frontend: http://localhost:5173"
echo "   Linera GraphQL: http://localhost:8080/chains/$CHAIN_ID/applications/$APP_ID"
echo ""

# Keep running
wait $LISTENER_PID $FRONTEND_PID
