#!/usr/bin/env bash

set -eu

FAUCET_PORT=8080
LINERA_SERVICE_PORT_A=8081
LINERA_SERVICE_PORT_B=8082
LINERA_SERVICE_PORT_C=8083
FRONTEND_PORT=5173

export PATH="$PWD/target/debug:$PATH"
source /dev/stdin <<<"$(linera net helper 2>/dev/null)"
linera_spawn linera net up --initial-amount 1000000000000 --with-faucet --faucet-port $FAUCET_PORT --faucet-amount 1000000000

sleep 10

FAUCET_URL=http://localhost:$FAUCET_PORT
GRAPHQL_URL=http://localhost:$LINERA_SERVICE_PORT_A

export LINERA_WALLET_1="$LINERA_TMP_DIR/wallet_1.json"
export LINERA_KEYSTORE_1="$LINERA_TMP_DIR/keystore_1.json"
export LINERA_STORAGE_1="rocksdb:$LINERA_TMP_DIR/client_1.db"

export LINERA_WALLET_2="$LINERA_TMP_DIR/wallet_2.json"
export LINERA_KEYSTORE_2="$LINERA_TMP_DIR/keystore_2.json"
export LINERA_STORAGE_2="rocksdb:$LINERA_TMP_DIR/client_2.db"

export LINERA_WALLET_3="$LINERA_TMP_DIR/wallet_3.json"
export LINERA_KEYSTORE_3="$LINERA_TMP_DIR/keystore_3.json"
export LINERA_STORAGE_3="rocksdb:$LINERA_TMP_DIR/client_3.db"

# ----------------------------------------------------------
# [FUNCTION] Initiate New Wallet from Faucet
# ----------------------------------------------------------
initiate_new_wallet_from_faucet() {
  if [ -z "$1" ]; then
    echo "Error: Missing required parameter <Wallet_Number>"
    exit 1
  fi
  linera --with-wallet "$1" wallet init --faucet "$FAUCET_URL"
  if [ $? -ne 0 ]; then
      echo "Initiate New Wallet from Faucet failed. Exiting..."
      exit 1
  fi
}

# ----------------------------------------------------------
# [FUNCTION] Open Chain from Faucet
# ----------------------------------------------------------
open_chain_from_faucet() {
  if [ -z "$1" ]; then
    echo "Error: Missing required parameter <Wallet_Number>"
    exit 1
  fi
  linera --with-wallet "$1" wallet request-chain --faucet "$FAUCET_URL"
  if [ $? -ne 0 ]; then
      echo "Open Chain from Faucet failed. Exiting..."
      exit 1
  fi
}

# ----------------------------------------------------------
# Create Wallets and Chains
# ----------------------------------------------------------
echo "🔧 Creating wallets and chains..."

INITIATE_WALLET_1=$(initiate_new_wallet_from_faucet 1)

OPEN_NEW_DEFAULT_WALLET_1=$(open_chain_from_faucet 1)
mapfile -t StringArray <<< "$OPEN_NEW_DEFAULT_WALLET_1"
MASTER_CHAIN_ID=${StringArray[0]}

linera --with-wallet 1 sync && linera --with-wallet 1 query-balance
sleep 1

# Create aggregator chain
OPEN_AGGREGATOR_CHAIN=$(open_chain_from_faucet 1)
mapfile -t StringArray <<< "$OPEN_AGGREGATOR_CHAIN"
AGGREGATOR_CHAIN_ID=${StringArray[0]}

# Create provider chains (Chainlink, Pyth, CoinGecko)
OPEN_CHAINLINK_CHAIN=$(open_chain_from_faucet 1)
mapfile -t StringArray <<< "$OPEN_CHAINLINK_CHAIN"
CHAINLINK_CHAIN_ID=${StringArray[0]}

OPEN_PYTH_CHAIN=$(open_chain_from_faucet 1)
mapfile -t StringArray <<< "$OPEN_PYTH_CHAIN"
PYTH_CHAIN_ID=${StringArray[0]}

OPEN_COINGECKO_CHAIN=$(open_chain_from_faucet 1)
mapfile -t StringArray <<< "$OPEN_COINGECKO_CHAIN"
COINGECKO_CHAIN_ID=${StringArray[0]}

# Create consumer chain
OPEN_CONSUMER_CHAIN=$(open_chain_from_faucet 1)
mapfile -t StringArray <<< "$OPEN_CONSUMER_CHAIN"
CONSUMER_CHAIN_ID=${StringArray[0]}

linera --with-wallet 1 sync && linera --with-wallet 1 query-balance
sleep 1

echo "✅ Chains created:"
echo "   Master Chain: $MASTER_CHAIN_ID"
echo "   Aggregator Chain: $AGGREGATOR_CHAIN_ID"
echo "   Chainlink Provider: $CHAINLINK_CHAIN_ID"
echo "   Pyth Provider: $PYTH_CHAIN_ID"
echo "   CoinGecko Provider: $COINGECKO_CHAIN_ID"
echo "   Consumer Chain: $CONSUMER_CHAIN_ID"

# ----------------------------------------------------------
# Deploy Oracle Application (will build automatically)
# ----------------------------------------------------------
echo "🚀 Building and deploying Oracle Application..."

cd /build

# Wait for clock sync to avoid timestamp issues
echo "⏳ Waiting for clock synchronization..."
sleep 10

# Retry deployment up to 5 times if timestamp error occurs
for i in {1..5}; do
  echo "🔄 Deployment attempt $i..."
  ORACLE_APP_ID=$(linera --with-wallet 1 --wait-for-outgoing-messages project publish-and-create . oracle-microchain \
    --json-parameters "{
    \"master_chain\": \"$MASTER_CHAIN_ID\",
    \"aggregator_chain\": \"$AGGREGATOR_CHAIN_ID\"
    }" 2>&1)
  
  if [[ $ORACLE_APP_ID != *"timestamp is in the future"* ]] && [[ $ORACLE_APP_ID != *"Error"* ]]; then
    echo "✅ Deployment successful!"
    break
  fi
  
  if [ $i -lt 5 ]; then
    echo "⏳ Retry $i: Clock sync issue, waiting 10 seconds..."
    sleep 10
  else
    echo "❌ Deployment failed after 5 attempts"
    exit 1
  fi
done

echo "✅ Oracle deployed: $ORACLE_APP_ID"

sleep 5

# ----------------------------------------------------------
# Start Node Services
# ----------------------------------------------------------
echo "🌐 Starting node services..."

linera --with-wallet 1 service --port $LINERA_SERVICE_PORT_A &
SERVICE_PID_A=$!
echo "Node service A started with PID $SERVICE_PID_A"
sleep 5

# ----------------------------------------------------------
# Register Oracle Providers
# ----------------------------------------------------------
echo "📝 Registering oracle providers..."

# Register Chainlink
MUTATION="mutation { registerProvider(providerChain: \\\"$CHAINLINK_CHAIN_ID\\\", sourceName: \\\"Chainlink\\\") }"
curl -s -X POST "$GRAPHQL_URL/chains/$MASTER_CHAIN_ID/applications/$ORACLE_APP_ID" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"$MUTATION\"}" | jq .
sleep 2

# Register Pyth
MUTATION="mutation { registerProvider(providerChain: \\\"$PYTH_CHAIN_ID\\\", sourceName: \\\"Pyth\\\") }"
curl -s -X POST "$GRAPHQL_URL/chains/$MASTER_CHAIN_ID/applications/$ORACLE_APP_ID" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"$MUTATION\"}" | jq .
sleep 2

# Register CoinGecko
MUTATION="mutation { registerProvider(providerChain: \\\"$COINGECKO_CHAIN_ID\\\", sourceName: \\\"CoinGecko\\\") }"
curl -s -X POST "$GRAPHQL_URL/chains/$MASTER_CHAIN_ID/applications/$ORACLE_APP_ID" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"$MUTATION\"}" | jq .
sleep 2

echo "✅ Providers registered"

# ----------------------------------------------------------
# Generate Frontend Config
# ----------------------------------------------------------
echo "⚙️ Generating frontend config..."

jq -n \
  --arg nodeServiceURL "http://localhost:$LINERA_SERVICE_PORT_A" \
  --arg oracleAppId "$ORACLE_APP_ID" \
  --arg masterChain "$MASTER_CHAIN_ID" \
  --arg aggregatorChain "$AGGREGATOR_CHAIN_ID" \
  --arg chainlinkChain "$CHAINLINK_CHAIN_ID" \
  --arg pythChain "$PYTH_CHAIN_ID" \
  --arg coingeckoChain "$COINGECKO_CHAIN_ID" \
  --arg consumerChain "$CONSUMER_CHAIN_ID" \
  '{
    nodeServiceURL: $nodeServiceURL,
    oracleAppId: $oracleAppId,
    masterChain: $masterChain,
    aggregatorChain: $aggregatorChain,
    chainlinkChain: $chainlinkChain,
    pythChain: $pythChain,
    coingeckoChain: $coingeckoChain,
    consumerChain: $consumerChain
  }' > "frontend-v2/config.json"

echo "✅ Config generated at frontend-v2/config.json"

# ----------------------------------------------------------
# Start Backend
# ----------------------------------------------------------
echo "🎧 Starting backend oracle aggregator..."
cd /build/backend-v2
npm install

export LINERA_RPC="http://localhost:$LINERA_SERVICE_PORT_A"
export ORACLE_APP_ID="$ORACLE_APP_ID"
export AGGREGATOR_CHAIN="$AGGREGATOR_CHAIN_ID"
export CHAINLINK_CHAIN="$CHAINLINK_CHAIN_ID"
export PYTH_CHAIN="$PYTH_CHAIN_ID"
export COINGECKO_CHAIN="$COINGECKO_CHAIN_ID"

node src/index.js &
BACKEND_PID=$!
sleep 3

# ----------------------------------------------------------
# Start Frontend
# ----------------------------------------------------------
echo "🌐 Starting frontend..."
cd /build/frontend-v2

# Serve built files with http-server
npx http-server dist -p $FRONTEND_PORT --cors &
FRONTEND_PID=$!

echo ""
echo "-----------------------------------------------------------"
echo ""
echo "✅ SynapseNet Oracle is READY!"
echo ""
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo "   GraphQL: http://localhost:$LINERA_SERVICE_PORT_A"
echo ""
echo "   Master Chain: $MASTER_CHAIN_ID"
echo "   Aggregator Chain: $AGGREGATOR_CHAIN_ID"
echo "   Oracle App: $ORACLE_APP_ID"
echo ""
echo "   Providers:"
echo "     - Chainlink: $CHAINLINK_CHAIN_ID"
echo "     - Pyth: $PYTH_CHAIN_ID"
echo "     - CoinGecko: $COINGECKO_CHAIN_ID"
echo ""
echo "-----------------------------------------------------------"

# Keep running
wait $BACKEND_PID $FRONTEND_PID
