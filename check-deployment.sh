#!/bin/bash

# Deployment Readiness Check Script
# Run this before deploying to catch issues early

echo "🔍 SynapseNet Deployment Readiness Check"
echo "========================================"
echo ""

ERRORS=0
WARNINGS=0

# Check 1: Node.js version
echo "✓ Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        echo "  ✅ Node.js v$(node -v) (OK)"
    else
        echo "  ⚠️  Node.js v$(node -v) (Recommended: v18+)"
        WARNINGS=$((WARNINGS+1))
    fi
else
    echo "  ❌ Node.js not found"
    ERRORS=$((ERRORS+1))
fi

# Check 2: Frontend dependencies
echo ""
echo "✓ Checking frontend dependencies..."
if [ -f "frontend-v2/package.json" ]; then
    echo "  ✅ package.json found"
    if [ -d "frontend-v2/node_modules" ]; then
        echo "  ✅ node_modules exists"
    else
        echo "  ⚠️  node_modules not found (run: cd frontend-v2 && npm install)"
        WARNINGS=$((WARNINGS+1))
    fi
else
    echo "  ❌ frontend-v2/package.json not found"
    ERRORS=$((ERRORS+1))
fi

# Check 3: Backend dependencies
echo ""
echo "✓ Checking backend dependencies..."
if [ -f "backend-v2/package.json" ]; then
    echo "  ✅ package.json found"
    if [ -d "backend-v2/node_modules" ]; then
        echo "  ✅ node_modules exists"
    else
        echo "  ⚠️  node_modules not found (run: cd backend-v2 && npm install)"
        WARNINGS=$((WARNINGS+1))
    fi
else
    echo "  ❌ backend-v2/package.json not found"
    ERRORS=$((ERRORS+1))
fi

# Check 4: Rust and Cargo
echo ""
echo "✓ Checking Rust toolchain..."
if command -v cargo &> /dev/null; then
    echo "  ✅ Cargo $(cargo --version)"
    if cargo --version | grep -q "1."; then
        echo "  ✅ Rust version OK"
    fi
else
    echo "  ❌ Cargo not found (needed for Linera contract)"
    ERRORS=$((ERRORS+1))
fi

# Check 5: WASM target
echo ""
echo "✓ Checking WASM target..."
if rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
    echo "  ✅ wasm32-unknown-unknown target installed"
else
    echo "  ⚠️  wasm32-unknown-unknown not installed (run: rustup target add wasm32-unknown-unknown)"
    WARNINGS=$((WARNINGS+1))
fi

# Check 6: Deployment configs
echo ""
echo "✓ Checking deployment configurations..."
if [ -f "vercel.json" ]; then
    echo "  ✅ vercel.json found"
else
    echo "  ❌ vercel.json not found"
    ERRORS=$((ERRORS+1))
fi

if [ -f "render.yaml" ]; then
    echo "  ✅ render.yaml found"
else
    echo "  ❌ render.yaml not found"
    ERRORS=$((ERRORS+1))
fi

if [ -f "Dockerfile" ]; then
    echo "  ✅ Dockerfile found"
else
    echo "  ❌ Dockerfile not found"
    ERRORS=$((ERRORS+1))
fi

# Check 7: Environment files
echo ""
echo "✓ Checking environment files..."
if [ -f "frontend-v2/.env.example" ]; then
    echo "  ✅ frontend .env.example found"
else
    echo "  ⚠️  frontend .env.example not found"
    WARNINGS=$((WARNINGS+1))
fi

if [ -f "backend-v2/.env.example" ]; then
    echo "  ✅ backend .env.example found"
else
    echo "  ⚠️  backend .env.example not found"
    WARNINGS=$((WARNINGS+1))
fi

# Check 8: Git status
echo ""
echo "✓ Checking Git status..."
if [ -d ".git" ]; then
    echo "  ✅ Git repository initialized"
    
    if git remote -v | grep -q "origin"; then
        echo "  ✅ Git remote 'origin' configured"
        REMOTE_URL=$(git remote get-url origin)
        echo "     Remote: $REMOTE_URL"
    else
        echo "  ⚠️  No git remote configured (run: git remote add origin <url>)"
        WARNINGS=$((WARNINGS+1))
    fi
    
    UNCOMMITTED=$(git status --porcelain | wc -l)
    if [ "$UNCOMMITTED" -gt 0 ]; then
        echo "  ⚠️  $UNCOMMITTED uncommitted changes"
        WARNINGS=$((WARNINGS+1))
    else
        echo "  ✅ No uncommitted changes"
    fi
else
    echo "  ❌ Not a git repository"
    ERRORS=$((ERRORS+1))
fi

# Check 9: Build test (optional, takes time)
echo ""
echo "✓ Testing frontend build..."
cd frontend-v2
if npm run build > /dev/null 2>&1; then
    echo "  ✅ Frontend builds successfully"
else
    echo "  ❌ Frontend build failed (run: cd frontend-v2 && npm run build)"
    ERRORS=$((ERRORS+1))
fi
cd ..

# Summary
echo ""
echo "========================================"
echo "📊 Summary"
echo "========================================"
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "🎉 All checks passed! Ready to deploy!"
    echo ""
    echo "Next steps:"
    echo "1. Push to GitHub: git push origin main"
    echo "2. Deploy to Render: https://render.com"
    echo "3. Deploy to Vercel: https://vercel.com"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Ready to deploy with warnings"
    echo "   Fix warnings for best results"
    exit 0
else
    echo "❌ Fix errors before deploying"
    exit 1
fi
