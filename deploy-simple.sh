#!/bin/bash
set -e

echo "🚀 Deploying SynapseNet to Local Linera Network"
echo ""

# Initialize wallet if it doesn't exist
if [ ! -f "$HOME/.config/linera/wallet.json" ]; then
    echo "💰 Initializing new wallet..."
    linera wallet init --with-new-chain
else
    echo "✅ Using existing wallet"
fi

# Get the default chain
CHAIN_ID=$(linera wallet show | grep -oP 'e476[a-f0-9]+' | head -1)
echo "📊 Chain ID: $CHAIN_ID"
echo ""

# Deploy Oracle Microchain
echo "📦 Deploying Oracle Microchain..."
ORACLE_BYTECODE_ID=$(linera publish-bytecode \
  target/wasm32-unknown-unknown/release/oracle_contract.wasm \
  target/wasm32-unknown-unknown/release/oracle_service.wasm | \
  grep -oP 'e476[a-f0-9]+')

ORACLE_APP_ID=$(linera create-application "$ORACLE_BYTECODE_ID" | grep -oP 'e476[a-f0-9]+')
echo "✅ Oracle App: $ORACLE_APP_ID"
echo ""

# Deploy Metadata Microchain
echo "📦 Deploying Metadata Microchain..."
METADATA_BYTECODE_ID=$(linera publish-bytecode \
  target/wasm32-unknown-unknown/release/metadata_contract.wasm \
  target/wasm32-unknown-unknown/release/metadata_service.wasm | \
  grep -oP 'e476[a-f0-9]+')

METADATA_APP_ID=$(linera create-application "$METADATA_BYTECODE_ID" | grep -oP 'e476[a-f0-9]+')
echo "✅ Metadata App: $METADATA_APP_ID"
echo ""

# Deploy Subscription Microchain
echo "📦 Deploying Subscription Microchain..."
SUBSCRIPTION_BYTECODE_ID=$(linera publish-bytecode \
  target/wasm32-unknown-unknown/release/subscription_contract.wasm \
  target/wasm32-unknown-unknown/release/subscription_service.wasm | \
  grep -oP 'e476[a-f0-9]+')

SUBSCRIPTION_APP_ID=$(linera create-application "$SUBSCRIPTION_BYTECODE_ID" | grep -oP 'e476[a-f0-9]+')
echo "✅ Subscription App: $SUBSCRIPTION_APP_ID"
echo ""

# Save deployment info
cat > deployment-info.json <<EOF
{
  "chain_id": "$CHAIN_ID",
  "oracle_app_id": "$ORACLE_APP_ID",
  "metadata_app_id": "$METADATA_APP_ID",
  "subscription_app_id": "$SUBSCRIPTION_APP_ID",
  "rpc_url": "http://localhost:8080",
  "deployed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "✅ Deployment Complete!"
echo ""
echo "📊 Summary:"
echo "  Chain:        $CHAIN_ID"
echo "  Oracle:       $ORACLE_APP_ID"
echo "  Metadata:     $METADATA_APP_ID"
echo "  Subscription: $SUBSCRIPTION_APP_ID"
echo ""
echo "💾 Saved to: deployment-info.json"
