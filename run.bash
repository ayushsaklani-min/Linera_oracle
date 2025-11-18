#!/usr/bin/env bash

set -eu

eval "$(linera net helper)"
linera_spawn linera net up --with-faucet || true

export LINERA_FAUCET_URL=http://localhost:8080
linera wallet init --faucet="$LINERA_FAUCET_URL"
CHAIN_ID=$(linera wallet request-chain --faucet="$LINERA_FAUCET_URL" | grep -oP '[a-f0-9]{64}' | head -1)

echo "📦 Using pre-built Linera contracts..."
cd /build
# Contracts are already built and copied into the container

echo "🚀 Publishing Oracle Microchain..."
ORACLE_APP_ID=$(linera publish-and-create \
  target/wasm32-unknown-unknown/release/oracle_contract.wasm \
  target/wasm32-unknown-unknown/release/oracle_service.wasm | \
  grep -oP '[a-f0-9]{64,}' | tail -1)

echo "🚀 Publishing Metadata Microchain..."
METADATA_APP_ID=$(linera publish-and-create \
  target/wasm32-unknown-unknown/release/metadata_contract.wasm \
  target/wasm32-unknown-unknown/release/metadata_service.wasm | \
  grep -oP '[a-f0-9]{64,}' | tail -1)

echo "🚀 Publishing Subscription Microchain..."
SUBSCRIPTION_APP_ID=$(linera publish-and-create \
  target/wasm32-unknown-unknown/release/subscription_contract.wasm \
  target/wasm32-unknown-unknown/release/subscription_service.wasm | \
  grep -oP '[a-f0-9]{64,}' | tail -1)

echo "✅ Contracts deployed!"
echo "   Chain ID: $CHAIN_ID"
echo "   Oracle App: $ORACLE_APP_ID"
echo "   Metadata App: $METADATA_APP_ID"
echo "   Subscription App: $SUBSCRIPTION_APP_ID"

# Save deployment info
cat > /build/deployment-info.json <<EOF
{
  "chain_id": "$CHAIN_ID",
  "oracle_app_id": "$ORACLE_APP_ID",
  "metadata_app_id": "$METADATA_APP_ID",
  "subscription_app_id": "$SUBSCRIPTION_APP_ID",
  "rpc_url": "http://localhost:8080"
}
EOF

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
  -d "{\"chain\":\"$CHAIN_ID\",\"oracle_app\":\"$ORACLE_APP_ID\",\"metadata_app\":\"$METADATA_APP_ID\",\"subscription_app\":\"$SUBSCRIPTION_APP_ID\"}"

# Start frontend
echo "🌐 Starting frontend..."
cd /build/frontend-v2
npm install
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ SynapseNet is running!"
echo "   Frontend: http://localhost:5173"
echo "   Oracle GraphQL: http://localhost:8080/chains/$CHAIN_ID/applications/$ORACLE_APP_ID"
echo "   Metadata GraphQL: http://localhost:8080/chains/$CHAIN_ID/applications/$METADATA_APP_ID"
echo "   Subscription GraphQL: http://localhost:8080/chains/$CHAIN_ID/applications/$SUBSCRIPTION_APP_ID"
echo ""

# Keep running
wait $LISTENER_PID $FRONTEND_PID
