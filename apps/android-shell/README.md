# CyberPath Academy Android Shell

This Android project wraps the standalone CyberPath Academy frontend build inside a WebView and loads it from packaged app assets.

## What works
- Offline demo mode using seeded local data
- Student, mentor, and admin demo accounts
- Local progress persistence through browser storage inside the WebView
- Responsive UI and installable mobile shell

## Build in Android Studio
1. Open this `android-shell` folder in Android Studio.
2. Let Android Studio sync Gradle.
3. Build debug APK or generate a release APK/AAB.
4. The app entry is `MainActivity`.

## Important
This shell packages the frontend demo build only. It does not bundle the original Node/Express backend. The in-app data layer runs in mock/demo mode so the app is usable immediately on-device.
