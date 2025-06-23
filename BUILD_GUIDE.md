# FP Merchant - Build Guide

## 🚨 Build Issue Resolution

Your previous build failed due to several compatibility issues that have been resolved:

### Issues Identified:
1. **React Native 0.79.3 + Expo SDK 53** - Very recent versions with potential instability
2. **New Architecture Enabled** - Can cause build failures with some dependencies
3. **Insufficient Memory Allocation** - Gradle builds were running out of memory
4. **Missing Resource Class Configuration** - EAS Build was using default (small) resources

### ✅ Solutions Applied:

1. **Disabled New Architecture** - Set `newArchEnabled: false` for build stability
2. **Increased Memory Allocation** - Updated gradle.properties with 4GB heap size
3. **Added Large Resource Class** - Configured EAS Build to use `large` resources
4. **Improved Build Configuration** - Added parallel builds and caching optimizations

## 🛠 Build Scripts

Three PowerShell scripts have been created to streamline your build process:

### 1. `test-build-locally.ps1` - Local Testing
Tests your build locally before pushing to EAS Build to catch issues early.

```powershell
.\test-build-locally.ps1
```

**What it does:**
- Installs dependencies
- Tests JavaScript bundle compilation
- Tests prebuild process
- Optionally tests Android build (if SDK available)

### 2. `build-preview.ps1` - Preview Build
Builds a preview APK for testing before production.

```powershell
.\build-preview.ps1
```

**What it does:**
- Runs local tests first
- Builds preview APK on EAS Build
- Uses internal distribution for testing

### 3. `build-production.ps1` - Production Build
Builds the final production APK.

```powershell
.\build-production.ps1
```

**What it does:**
- Comprehensive pre-build checks
- Builds production APK with auto-increment version
- Ready for distribution

## 🚀 Quick Start

### First Time Setup

1. **Install EAS CLI** (if not already installed):
   ```powershell
   npm install -g @expo/eas-cli
   ```

2. **Login to EAS**:
   ```powershell
   eas login
   ```

3. **Test Your Build Locally** (recommended):
   ```powershell
   .\test-build-locally.ps1
   ```

### Building Your App

#### For Testing:
```powershell
.\build-preview.ps1
```

#### For Production:
```powershell
.\build-production.ps1
```

## 📱 Download & Install

After a successful build:

1. Visit: https://expo.dev/accounts/vu2s222/projects/frontend/builds
2. Download the APK file
3. Install on Android device (enable "Install from Unknown Sources")

## 🔧 Configuration Changes Made

### `eas.json`
- Added `large` resource class for Android builds
- Added `m-medium` resource class for iOS builds
- Better memory allocation for builds

### `app.json`
- Disabled New Architecture (`newArchEnabled: false`)
- This improves build stability

### `android/gradle.properties`
- Increased heap size to 4GB (`-Xmx4096m`)
- Enabled parallel builds
- Added build optimization flags
- Disabled New Architecture for Android

## 🐛 Troubleshooting

### Common Issues:

#### Build Still Fails
1. Run local test first: `.\test-build-locally.ps1`
2. Check if you have uncommitted changes
3. Try clearing cache: `npx expo install --fix`

#### Out of Memory Errors
- The configuration now uses 4GB heap size
- Large resource class provides more build resources
- If still failing, consider splitting large dependencies

#### JavaScript Bundle Errors
- Run `npx expo export` to test bundle locally
- Check for syntax errors in your code
- Verify all imports are correct

#### Permission Errors on Windows
- Run PowerShell as Administrator
- Or use: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Getting Help

1. **Build Logs**: Always check the full build logs on EAS dashboard
2. **Local Testing**: Use `test-build-locally.ps1` to catch issues early
3. **Expo Forums**: https://forums.expo.dev/
4. **Discord**: https://chat.expo.dev/

## 📋 Build Checklist

Before building for production:

- [ ] All features tested in development
- [ ] Local build test passes (`.\test-build-locally.ps1`)
- [ ] Preview build tested on actual device
- [ ] App version incremented (automatic in production profile)
- [ ] All sensitive data removed from code
- [ ] Performance tested on low-end devices

## 🔄 Build Process Overview

```
Local Test ➜ Preview Build ➜ Test APK ➜ Production Build ➜ Distribute
    ⬇️           ⬇️              ⬇️            ⬇️             ⬇️
 Catch errors   Test version   User testing   Final build   App Store
```

## 📊 Build Resources

- **Memory**: 4GB heap size
- **CPU**: Large resource class (4 cores)
- [ ] Build Time**: 10-20 minutes typically
- **APK Size**: ~50-100MB (varies by features)

---

**Need Help?** Check the logs first, then run the local test script to isolate issues. 