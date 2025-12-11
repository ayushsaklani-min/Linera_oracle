# Deployment Readiness Check Script (PowerShell)
# Run this before deploying to catch issues early

Write-Host "🔍 SynapseNet Deployment Readiness Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ERRORS = 0
$WARNINGS = 0

# Check 1: Node.js version
Write-Host "✓ Checking Node.js version..."
try {
    $nodeVersion = node -v
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -ge 18) {
        Write-Host "  ✅ Node.js $nodeVersion (OK)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Node.js $nodeVersion (Recommended: v18+)" -ForegroundColor Yellow
        $WARNINGS++
    }
} catch {
    Write-Host "  ❌ Node.js not found" -ForegroundColor Red
    $ERRORS++
}

# Check 2: Frontend dependencies
Write-Host ""
Write-Host "✓ Checking frontend dependencies..."
if (Test-Path "frontend-v2/package.json") {
    Write-Host "  ✅ package.json found" -ForegroundColor Green
    if (Test-Path "frontend-v2/node_modules") {
        Write-Host "  ✅ node_modules exists" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  node_modules not found (run: cd frontend-v2; npm install)" -ForegroundColor Yellow
        $WARNINGS++
    }
} else {
    Write-Host "  ❌ frontend-v2/package.json not found" -ForegroundColor Red
    $ERRORS++
}

# Check 3: Backend dependencies
Write-Host ""
Write-Host "✓ Checking backend dependencies..."
if (Test-Path "backend-v2/package.json") {
    Write-Host "  ✅ package.json found" -ForegroundColor Green
    if (Test-Path "backend-v2/node_modules") {
        Write-Host "  ✅ node_modules exists" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  node_modules not found (run: cd backend-v2; npm install)" -ForegroundColor Yellow
        $WARNINGS++
    }
} else {
    Write-Host "  ❌ backend-v2/package.json not found" -ForegroundColor Red
    $ERRORS++
}

# Check 4: Rust and Cargo
Write-Host ""
Write-Host "✓ Checking Rust toolchain..."
try {
    $cargoVersion = cargo --version
    Write-Host "  ✅ $cargoVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Cargo not found (needed for Linera contract)" -ForegroundColor Red
    $ERRORS++
}

# Check 5: Deployment configs
Write-Host ""
Write-Host "✓ Checking deployment configurations..."
if (Test-Path "vercel.json") {
    Write-Host "  ✅ vercel.json found" -ForegroundColor Green
} else {
    Write-Host "  ❌ vercel.json not found" -ForegroundColor Red
    $ERRORS++
}

if (Test-Path "render.yaml") {
    Write-Host "  ✅ render.yaml found" -ForegroundColor Green
} else {
    Write-Host "  ❌ render.yaml not found" -ForegroundColor Red
    $ERRORS++
}

if (Test-Path "Dockerfile") {
    Write-Host "  ✅ Dockerfile found" -ForegroundColor Green
} else {
    Write-Host "  ❌ Dockerfile not found" -ForegroundColor Red
    $ERRORS++
}

# Check 6: Environment files
Write-Host ""
Write-Host "✓ Checking environment files..."
if (Test-Path "frontend-v2/.env.example") {
    Write-Host "  ✅ frontend .env.example found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  frontend .env.example not found" -ForegroundColor Yellow
    $WARNINGS++
}

if (Test-Path "backend-v2/.env.example") {
    Write-Host "  ✅ backend .env.example found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  backend .env.example not found" -ForegroundColor Yellow
    $WARNINGS++
}

# Check 7: Git status
Write-Host ""
Write-Host "✓ Checking Git status..."
if (Test-Path ".git") {
    Write-Host "  ✅ Git repository initialized" -ForegroundColor Green
    
    try {
        $remote = git remote get-url origin 2>$null
        if ($remote) {
            Write-Host "  ✅ Git remote 'origin' configured" -ForegroundColor Green
            Write-Host "     Remote: $remote" -ForegroundColor Gray
        } else {
            Write-Host "  ⚠️  No git remote configured (run: git remote add origin <url>)" -ForegroundColor Yellow
            $WARNINGS++
        }
    } catch {
        Write-Host "  ⚠️  No git remote configured" -ForegroundColor Yellow
        $WARNINGS++
    }
    
    $uncommitted = (git status --porcelain | Measure-Object).Count
    if ($uncommitted -gt 0) {
        Write-Host "  ⚠️  $uncommitted uncommitted changes" -ForegroundColor Yellow
        $WARNINGS++
    } else {
        Write-Host "  ✅ No uncommitted changes" -ForegroundColor Green
    }
} else {
    Write-Host "  ❌ Not a git repository" -ForegroundColor Red
    $ERRORS++
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Errors: $ERRORS"
Write-Host "Warnings: $WARNINGS"
Write-Host ""

if ($ERRORS -eq 0 -and $WARNINGS -eq 0) {
    Write-Host "🎉 All checks passed! Ready to deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Push to GitHub: git push origin main"
    Write-Host "2. Deploy to Render: https://render.com"
    Write-Host "3. Deploy to Vercel: https://vercel.com"
    exit 0
} elseif ($ERRORS -eq 0) {
    Write-Host "⚠️  Ready to deploy with warnings" -ForegroundColor Yellow
    Write-Host "   Fix warnings for best results"
    exit 0
} else {
    Write-Host "❌ Fix errors before deploying" -ForegroundColor Red
    exit 1
}
