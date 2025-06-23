#!/usr/bin/env pwsh

# FP Merchant - Production Build Script
# This script builds the production version of the FP Merchant app

Write-Host "🚀 Starting FP Merchant Production Build..." -ForegroundColor Green

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

# Clean previous builds (optional)
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
npx expo install --fix

# Prebuild to check for issues
Write-Host "🔧 Running prebuild check..." -ForegroundColor Yellow
npx expo prebuild --clear
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prebuild failed - please fix the issues above" -ForegroundColor Red
    exit 1
}

# Build for production
Write-Host "🏗️ Building production APK..." -ForegroundColor Green
Write-Host "This may take 10-20 minutes..." -ForegroundColor Yellow

eas build --platform android --profile production
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Production build failed" -ForegroundColor Red
    Write-Host "💡 Try running the preview build first:" -ForegroundColor Yellow
    Write-Host "   eas build --platform android --profile preview" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Production build completed successfully!" -ForegroundColor Green
Write-Host "📱 You can download your APK from: https://expo.dev/accounts/vu2s222/projects/frontend/builds" -ForegroundColor Cyan 