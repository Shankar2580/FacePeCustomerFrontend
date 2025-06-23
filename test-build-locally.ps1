#!/usr/bin/env pwsh

# FP Merchant - Local Build Test Script
# This script tests the build locally to catch issues before EAS Build

Write-Host "Testing FP Merchant Build Locally..." -ForegroundColor Green

# Function to check if command exists
function Test-Command {
    param($cmdname)
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "npx")) {
    Write-Host "Node.js/npm is not installed" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Test JavaScript bundle
Write-Host "Testing JavaScript bundle..." -ForegroundColor Yellow
npx expo export --clear
if ($LASTEXITCODE -ne 0) {
    Write-Host "JavaScript bundle test failed" -ForegroundColor Red
    Write-Host "Fix the above issues before building on EAS" -ForegroundColor Yellow
    exit 1
}

Write-Host "JavaScript bundle test passed!" -ForegroundColor Green

# Clean export
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

# Test prebuild
Write-Host "Testing prebuild..." -ForegroundColor Yellow
npx expo prebuild --clear --platform android
if ($LASTEXITCODE -ne 0) {
    Write-Host "Prebuild test failed" -ForegroundColor Red
    Write-Host "Fix the above issues before building on EAS" -ForegroundColor Yellow
    exit 1
}

Write-Host "Prebuild test passed!" -ForegroundColor Green

# Clean up android folder if it was generated
if (Test-Path "android") {
    Write-Host "Cleaning up generated android folder..." -ForegroundColor Yellow
    Remove-Item -Path "android" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "ios" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "All local tests passed!" -ForegroundColor Green
Write-Host "You can now run a build on EAS with confidence" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run preview build: .\build-preview.ps1" -ForegroundColor Cyan
Write-Host "  2. Test the preview APK thoroughly" -ForegroundColor Cyan
Write-Host "  3. Run production build: .\build-production.ps1" -ForegroundColor Cyan 