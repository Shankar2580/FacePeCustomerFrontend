# FP Merchant APK Build Guide

## Overview
This guide explains how to build the FP Merchant APK with automatic update checking functionality.

## Features Added
- ✅ App name changed to "FP Merchant"
- ✅ Automatic update checking on app launch
- ✅ Manual update check in Profile screen
- ✅ Update download with progress indicator
- ✅ Proper app versioning display
- ✅ Keyboard handling improvements

## Prerequisites
1. **Node.js** (v18 or higher)
2. **Android Studio** with Android SDK
3. **Java Development Kit (JDK 17)**
4. **Expo CLI** and **EAS CLI**

## Environment Setup
```powershell
# Install required packages
npm install -g @expo/cli eas-cli

# Set Android environment variables
$env:ANDROID_HOME = "C:\Users\[USERNAME]\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools"
```

## Building the APK

### Method 1: Local Build (Recommended)
```powershell
# Navigate to Frontend directory
cd Frontend

# Run the build script
.\build-apk.ps1
```

### Method 2: EAS Build (Cloud)
```powershell
# Navigate to Frontend directory
cd Frontend

# Build with EAS (requires EAS subscription for faster builds)
eas build --platform android --profile preview
```

## APK Output
- **Local Build**: `Frontend/FP-Merchant-v1.0.0.apk`
- **EAS Build**: Download link provided after build completion

## Update System

### How Updates Work
1. **Automatic Check**: App checks for updates on launch
2. **Manual Check**: Users can check via Profile → Check for Updates
3. **Download**: Updates are downloaded in the background
4. **Install**: App restarts to apply the update

### Publishing Updates
```powershell
# Update the version in app.json
# Then publish the update
eas update --channel production --message "Bug fixes and improvements"
```

## App Configuration

### Key Settings in `app.json`
```json
{
  "expo": {
    "name": "FP Merchant",
    "slug": "fp-merchant",
    "version": "1.0.0",
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0
    },
    "runtimeVersion": "1.0.0"
  }
}
```

## Testing the APK

### Installation
1. Enable "Unknown Sources" in Android settings
2. Transfer APK to device
3. Install the APK
4. Launch "FP Merchant" app

### Testing Updates
1. Make changes to the app
2. Increment version in `app.json`
3. Publish update: `eas update --channel production`
4. Open app to trigger update check

## Troubleshooting

### Common Issues

**Build Fails - Gradle Error**
```powershell
# Clean and rebuild
cd android
.\gradlew.bat clean
.\gradlew.bat assembleRelease
```

**Update Not Working**
- Ensure `runtimeVersion` is set correctly
- Check that updates are enabled in app.json
- Updates only work in production builds, not development

**Keyboard Issues**
- The app includes `react-native-keyboard-controller` for better keyboard handling
- Keyboard automatically hides bottom tabs when opened

## Version Management

### Current Version: 1.0.0
- Initial release with update system
- Stripe integration
- Face recognition support
- Mobile verification

### Future Updates
- Increment version in `app.json`
- Use semantic versioning (e.g., 1.0.1, 1.1.0, 2.0.0)
- Publish updates through EAS Update

## Support
For issues with building or updates, check:
1. Expo documentation: https://docs.expo.dev/
2. EAS Build docs: https://docs.expo.dev/build/introduction/
3. EAS Update docs: https://docs.expo.dev/eas-update/introduction/ 