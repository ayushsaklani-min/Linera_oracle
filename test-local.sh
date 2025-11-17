#!/bin/bash

# Quick local test script (not for Docker)
# This tests the contract compilation and basic setup

set -e

echo "🧪 Testing SynapseNet locally..."

# Check prerequisites
echo "Checking prerequisites..."
command -v rustc >/dev/null 2>&1 || { echo "❌ Rust not found"; exit 1; }
command -v cargo >/dev/null 2>&1 || { echo "❌ Cargo not found"; exit 1; }
command -v linera >/dev/null 2>&1 || { echo "❌ Linera CLI not found"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found"; exit 1; }

echo "✅ All prerequisites found"

# Build contract
echo ""
echo "📦 Building Linera contract..."
cd price-oracle
cargo build --release --target wasm32-unknown-unknown
cd ..

if [ -f "price-oracle/target/wasm32-unknown-unknown/release/price_oracle_contract.wasm" ]; then
    echo "✅ Contract compiled successfully"
else
    echo "❌ Contract compilation failed"
    exit 1
fi

# Check backend dependencies
echo ""
echo "📦 Checking backend..."
cd backend
npm install --silent
cd ..
echo "✅ Backend dependencies installed"

# Check frontend dependencies
echo ""
echo "📦 Checking frontend..."
cd frontend
npm install --silent
cd ..
echo "✅ Frontend dependencies installed"

echo ""
echo "✅ All tests passed!"
echo ""
echo "To run the full application:"
echo "  1. Using Docker: docker compose up --force-recreate"
echo "  2. Manual: Follow instructions in README.md"
