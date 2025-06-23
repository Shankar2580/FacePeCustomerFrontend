# FP Merchant APK Build Script
Write-Host "Building FP Merchant APK..." -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan

# Check if Android directory exists
if (-not (Test-Path "android")) {
    Write-Host "Android directory not found. Running prebuild..." -ForegroundColor Yellow
    npx expo prebuild --platform android --clean
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Prebuild failed!" -ForegroundColor Red
        exit 1
    }
}

# Navigate to android directory
Write-Host "Navigating to android directory..." -ForegroundColor Blue
cd android

# Check if gradlew exists
if (-not (Test-Path "gradlew.bat")) {
    Write-Host "Gradle wrapper not found!" -ForegroundColor Red
    cd ..
    exit 1
}

# Clean and build APK
Write-Host "Cleaning project..." -ForegroundColor Blue
.\gradlew.bat clean

Write-Host "Building APK..." -ForegroundColor Blue
.\gradlew.bat assembleRelease

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "APK built successfully!" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Cyan
    
    # Find the APK file
    $apkPath = Get-ChildItem -Path "app\build\outputs\apk\release\" -Name "*.apk" | Select-Object -First 1
    if ($apkPath) {
        $fullApkPath = "app\build\outputs\apk\release\$apkPath"
        Write-Host "APK Location: $fullApkPath" -ForegroundColor Green
        
        # Copy APK to root directory with a better name
        $newApkName = "FP-Merchant-v1.0.0.apk"
        Copy-Item $fullApkPath "..\$newApkName" -Force
        Write-Host "APK copied to: $newApkName" -ForegroundColor Green
    }
    
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "You can now install the APK on your Android device." -ForegroundColor White
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
}

# Return to original directory
cd .. 