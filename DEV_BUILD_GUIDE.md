# Development Build Setup for CueView

## Recent Fixes Applied ✅

### Fixed Issues (June 2025):
- ✅ **React Native Paper Module Resolution**: Fixed missing dependency installation
- ✅ **ShowId NaN Bug**: Added proper type handling for Firestore string/number conversion  
- ✅ **Notification Validation**: Added defensive checks for invalid showId values
- ✅ **Development Build Workflow**: Streamlined build and testing process

### Current Status:
- All major notification-related bugs have been resolved
- Development build includes proper push notification support
- Firestore data type handling is now robust
- React Native Paper theming integration working

---

## Overview
Since SDK 53, expo-notifications remote push notifications are no longer supported in Expo Go. You need to use a development build to test push notifications.

## Quick Start

### 1. Build Development Client
```bash
# For Android
npm run build:dev:android

# For iOS  
npm run build:dev:ios
```

### 2. Install Development Build
- Download the APK/IPA from the EAS dashboard
- Install it on your device
- Or use `eas build --platform android --profile development --local` for local builds

### 3. Start Development Server
```bash
npm run start:dev-client
```

### 4. Test Notifications
1. Get your Expo push token from your app
2. Use the test script: `node scripts/test-notifications.js <your-token>`

## Development Build vs Expo Go

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| Push Notifications | ❌ Limited | ✅ Full Support |
| Native Modules | ❌ Limited | ✅ Full Support |
| Custom Native Code | ❌ No | ✅ Yes |
| Quick Updates | ✅ Instant | ⚡ Fast with EAS Update |

## Key Commands

```bash
# Start with development client
npm run start:dev-client

# Build development versions
npm run build:dev:android
npm run build:dev:ios

# Build preview versions
npm run build:preview:android  
npm run build:preview:ios

# Test notifications
node scripts/test-notifications.js <expo-push-token>
```

## Notification Setup

The app is configured with:
- expo-notifications plugin
- Proper Android permissions
- Default notification channel
- Custom notification icon

## Troubleshooting

### Build Issues
- Make sure you're logged in: `eas whoami`
- Check your EAS quota: `eas build:list`
- Clear cache: `expo r -c`

### Notification Issues
- Ensure device permissions are granted
- Check Expo push token generation
- Verify notification service configuration

### Development Client Issues
- Use `expo start --dev-client` not `expo start`
- Make sure development build is installed
- Check Metro bundler connection
