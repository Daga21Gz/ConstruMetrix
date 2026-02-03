# ConstruMetrix - Automated Deployment Script
# Version: 1.0.0

Write-Host "🚀 CONSTRUMETRIX - Automated Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version
    Write-Host "✅ Firebase CLI installed: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI not found. Installing..." -ForegroundColor Red
    npm install -g firebase-tools
}

# Check if logged in
Write-Host ""
Write-Host "🔐 Checking Firebase authentication..." -ForegroundColor Yellow
$loginCheck = firebase projects:list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in. Opening login..." -ForegroundColor Yellow
    firebase login
}

# Install Functions dependencies
Write-Host ""
Write-Host "📦 Installing Functions dependencies..." -ForegroundColor Yellow
Set-Location functions
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Increment Service Worker version
Write-Host ""
Write-Host "🔄 Updating Service Worker version..." -ForegroundColor Yellow
$swContent = Get-Content sw.js -Raw
$swContent = $swContent -replace "construmetrix-v(\d+\.\d+)", {
    $version = [double]$matches[1]
    $newVersion = $version + 0.1
    "construmetrix-v$newVersion"
}
Set-Content sw.js $swContent
Write-Host "✅ Service Worker updated" -ForegroundColor Green

# Ask for deployment type
Write-Host ""
Write-Host "📤 Select deployment type:" -ForegroundColor Cyan
Write-Host "1. Functions only"
Write-Host "2. Hosting only"
Write-Host "3. Full deployment (Functions + Hosting)"
Write-Host "4. Cancel"
$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔧 Deploying Functions..." -ForegroundColor Yellow
        firebase deploy --only functions
    }
    "2" {
        Write-Host ""
        Write-Host "🌐 Deploying Hosting..." -ForegroundColor Yellow
        firebase deploy --only hosting
    }
    "3" {
        Write-Host ""
        Write-Host "🚀 Full deployment starting..." -ForegroundColor Yellow
        firebase deploy
    }
    "4" {
        Write-Host "❌ Deployment cancelled" -ForegroundColor Red
        exit 0
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Test the deployed app"
    Write-Host "2. Run Lighthouse audit"
    Write-Host "3. Monitor Firebase Console for errors"
    Write-Host "4. Check Sentry for any issues"
    Write-Host ""
    
    # Try to get hosting URL
    $projectInfo = firebase projects:list 2>&1 | Select-String "construmetrix"
    if ($projectInfo) {
        Write-Host "🌐 Your app should be live at:" -ForegroundColor Green
        Write-Host "   https://YOUR-PROJECT.web.app" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "❌ DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host "Check the error messages above and try again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Cyan
    Write-Host "- Not logged in: Run 'firebase login'"
    Write-Host "- Wrong project: Run 'firebase use --add'"
    Write-Host "- Missing permissions: Check IAM roles in Firebase Console"
    exit 1
}
