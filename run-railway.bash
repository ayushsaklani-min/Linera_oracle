#!/usr/bin/env bash

set -eu

echo "🚂 Railway Deployment - Lightweight Mode"
echo "=========================================="

# Railway-specific configuration
export PORT=${PORT:-3001}
export WS_PORT=${WS_PORT:-8090}
export FRONTEND_PORT=${FRONTEND_PORT:-5173}

# Check if we're on Railway
if [ -n "${RAILWAY_ENVIRONMENT:-}" ]; then
  echo "✅ Running on Railway"
  echo "   Environment: $RAILWAY_ENVIRONMENT"
  echo "   Service: ${RAILWAY_SERVICE_NAME:-unknown}"
fi

# ----------------------------------------------------------
# Start Backend Only (No Linera Network)
# ----------------------------------------------------------
echo ""
echo "🎧 Starting backend in mock mode..."
echo "   (For full Linera integration, run locally with Docker Compose)"
echo ""

cd /build/backend-v2

# Set mock mode environment variable
export MOCK_MODE=true
export NODE_ENV=production

# Start backend
node src/index.js &
BACKEND_PID=$!

echo "✅ Backend started on port $PORT"

# ----------------------------------------------------------
# Start Frontend
# ----------------------------------------------------------
echo ""
echo "🌐 Starting frontend..."
cd /build/frontend-v2

# Serve built files
npx http-server dist -p $FRONTEND_PORT --cors &
FRONTEND_PID=$!

echo "✅ Frontend started on port $FRONTEND_PORT"

echo ""
echo "-----------------------------------------------------------"
echo ""
echo "✅ SynapseNet is READY (Mock Mode)!"
echo ""
echo "   Frontend: http://0.0.0.0:$FRONTEND_PORT"
echo "   Backend API: http://0.0.0.0:$PORT"
echo "   WebSocket: ws://0.0.0.0:$WS_PORT"
echo ""
echo "   ⚠️  Running in MOCK MODE (no Linera blockchain)"
echo "   📝 For full blockchain integration, use Docker Compose locally"
echo ""
echo "-----------------------------------------------------------"

# Keep running
wait $BACKEND_PID $FRONTEND_PID
