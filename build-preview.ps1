#!/usr/bin/env pwsh

# FP Merchant - Preview Build Script
# This script builds a preview version for testing before production

Write-Host "🚀 Starting FP Merchant Preview Build..." -ForegroundColor Green

# Function to check if command exists
function Test-Command {
    param($cmdname)
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "npx")) {
    Write-Host "❌ Node.js/npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "eas")) {
    Write-Host "📦 Installing EAS CLI..." -ForegroundColor Yellow
    npm install -g @expo/eas-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install EAS CLI" -ForegroundColor Red
        exit 1
    }
}

# Check if logged in to EAS
Write-Host "🔐 Checking EAS login status..." -ForegroundColor Yellow
eas whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔑 Please login to EAS first:" -ForegroundColor Yellow
    Write-Host "   eas login" -ForegroundColor Cyan
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Test bundle locally first
Write-Host "🧪 Testing JavaScript bundle locally..." -ForegroundColor Yellow
npx expo export
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ JavaScript bundle failed - please fix the issues above" -ForegroundColor Red
    exit 1
}

# Clean the export folder
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

# Build preview
Write-Host "🏗️ Building preview APK..." -ForegroundColor Green
Write-Host "This may take 10-15 minutes..." -ForegroundColor Yellow

eas build --platform android --profile preview
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Preview build failed" -ForegroundColor Red
    Write-Host "💡 Check the build logs at: https://expo.dev/accounts/vu2s222/projects/frontend/builds" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Preview build completed successfully!" -ForegroundColor Green
Write-Host "📱 You can download your APK from: https://expo.dev/accounts/vu2s222/projects/frontend/builds" -ForegroundColor Cyan
Write-Host "🧪 Test this preview build thoroughly before building for production" -ForegroundColor Yellow 