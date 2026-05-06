# Start Backend and Frontend Services for Development
# This script starts both services side-by-side in the terminal

param(
    [string]$Command = "start"
)

$BackendPath = "."
$FrontendPath = "./frontend"
$BackendPort = 8000
$FrontendPort = 3000

function Start-Services {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  Infrastructure Damage Detection - Dual Service Startup   ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    # Check prerequisites
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
    
    # Check Python
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Python not found. Please install Python 3.9+" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Python $pythonVersion" -ForegroundColor Green
    
    # Check Node
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Node.js not found. Please install Node.js 16+" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Node $nodeVersion" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📋 Configuration:" -ForegroundColor Cyan
    Write-Host "   Backend:  http://localhost:$BackendPort" -ForegroundColor White
    Write-Host "   Frontend: http://localhost:$FrontendPort" -ForegroundColor White
    Write-Host "   API Docs: http://localhost:$BackendPort/docs" -ForegroundColor White
    Write-Host ""
    
    # Check .env files
    if (!(Test-Path ".env")) {
        Write-Host "⚠️  .env not found. Creating from template..." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Backend .env configured" -ForegroundColor Green
    }
    
    if (!(Test-Path "frontend/.env")) {
        Write-Host "⚠️  frontend/.env not found. Creating..." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Frontend .env configured" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🚀 Starting services..." -ForegroundColor Cyan
    Write-Host ""
    
    # Start Backend in new window
    Write-Host "Starting Backend (Port $BackendPort)..." -ForegroundColor Yellow
    $backendCommand = @"
        try {
            Write-Host "Backend: Activating virtual environment..." -ForegroundColor Yellow
            & .\.venv\Scripts\Activate.ps1
            Write-Host "Backend: Starting FastAPI server..." -ForegroundColor Yellow
            python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port $BackendPort
        } catch {
            Write-Host "Backend Error: `$_" -ForegroundColor Red
            Read-Host "Press Enter to close"
        }
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand -WindowStyle Normal
    
    # Wait for backend to start
    Start-Sleep -Seconds 2
    
    # Start Frontend in new window
    Write-Host "Starting Frontend (Port $FrontendPort)..." -ForegroundColor Yellow
    $frontendCommand = @"
        try {
            Set-Location $FrontendPath
            Write-Host "Frontend: Installing dependencies (if needed)..." -ForegroundColor Yellow
            if (!(Test-Path "node_modules")) {
                npm install
            }
            Write-Host "Frontend: Starting React development server..." -ForegroundColor Yellow
            npm start
        } catch {
            Write-Host "Frontend Error: `$_" -ForegroundColor Red
            Read-Host "Press Enter to close"
        }
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand -WindowStyle Normal
    
    Write-Host ""
    Write-Host "✅ Services starting... Checking connection..." -ForegroundColor Green
    
    # Wait for services to be ready and check health
    $maxAttempts = 10
    $attempt = 0
    $backendReady = $false
    
    while ($attempt -lt $maxAttempts -and -not $backendReady) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$BackendPort/health" -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $backendReady = $true
                Write-Host "✅ Backend is ready and responding" -ForegroundColor Green
            }
        } catch {
            $attempt++
            Start-Sleep -Seconds 1
            Write-Host "   ⏳ Waiting for backend... (attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
        }
    }
    
    if ($backendReady) {
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║          ✅ All Services Started Successfully!            ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "📱 Access points:" -ForegroundColor Cyan
        Write-Host "   🌐 Frontend:     http://localhost:$FrontendPort" -ForegroundColor White
        Write-Host "   🔌 Backend API:  http://localhost:$BackendPort/api" -ForegroundColor White
        Write-Host "   📚 API Docs:     http://localhost:$BackendPort/docs" -ForegroundColor White
        Write-Host "   💚 Health:       http://localhost:$BackendPort/health" -ForegroundColor White
        
        Write-Host ""
        Write-Host "📝 Quick test in browser console (F12):" -ForegroundColor Yellow
        Write-Host '   fetch("http://localhost:8000/health").then(r=>r.json()).then(console.log)' -ForegroundColor Gray
        
        Write-Host ""
        Write-Host "💡 Tips:" -ForegroundColor Cyan
        Write-Host "   • Backend will auto-reload on code changes" -ForegroundColor White
        Write-Host "   • Frontend will hot-reload on changes" -ForegroundColor White
        Write-Host "   • Check .env files for configuration" -ForegroundColor White
        Write-Host "   • Database initializes on first run" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "⚠️  Backend service did not start. Check the error window." -ForegroundColor Yellow
    }
}

function Stop-Services {
    Write-Host "Stopping all services..." -ForegroundColor Yellow
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ Services stopped" -ForegroundColor Green
}

# Main
switch ($Command.ToLower()) {
    "start" { Start-Services }
    "stop" { Stop-Services }
    default { 
        Write-Host "Usage: .\start_dev.ps1 [start|stop]" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Yellow
        Write-Host "  .\start_dev.ps1 start   # Start backend and frontend" -ForegroundColor Gray
        Write-Host "  .\start_dev.ps1 stop    # Stop all services" -ForegroundColor Gray
    }
}
