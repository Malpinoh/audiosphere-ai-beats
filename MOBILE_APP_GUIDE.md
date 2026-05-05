
# MAUDIO Mobile App Guide

This guide walks you through turning the MAUDIO web app into a real native
Android (and iOS) app using Capacitor v8.

The codebase already includes:
- Capacitor v8 + Music Controls plugin (lock-screen / notification controls)
- @capacitor-community/sqlite for offline metadata
- Filesystem-based downloads (`Documents/music_downloads`) and a
  200 MB LRU auto-cache (`Cache/music_cache`)
- MediaSession API fallback for web/iOS
- Spotify-style mobile mini-player + immersive fullscreen player
- Network detection + offline banner

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- For iOS: Mac with Xcode 13+ installed
- For Android: Android Studio with SDK tools installed

App identifier: `com.maudio.online` (set in `capacitor.config.ts`).

## Building the Mobile App

### Step 1: Clone and Set Up the Project

1. Export this project to your GitHub repository using the "Export to GitHub" button
2. Clone the repository to your local machine
3. Install dependencies:
   ```bash
   npm install
   ```

### Step 2: Add Native Platforms

Add iOS platform (Mac only):
```bash
npx cap add ios
```

Add Android platform:
```bash
npx cap add android
```

### Step 2.5: Android permissions (one-time)

After `npx cap add android`, open
`android/app/src/main/AndroidManifest.xml` and ensure these permissions
exist inside `<manifest>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.MEDIA_CONTENT_CONTROL" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
```

These power background playback, the media notification, and offline file
access on Android 13+.

### Step 3: Build the Web App

```bash
npm run build
```

### Step 4: Sync Web Code to Native Projects

```bash
npx cap sync
```

### Step 5: Run on Device or Emulator

For iOS:
```bash
npx cap open ios
```
Then build and run from Xcode.

For Android:
```bash
npx cap open android
```
Then build and run from Android Studio.

Alternatively, use:
```bash
npx cap run ios
```
or
```bash
npx cap run android
```

## Development Workflow

When making changes to the web app:
1. Make your changes in the web code
2. Run `npm run build` to rebuild the web app
3. Run `npx cap sync` to update native projects
4. Test on native platforms

## Features

The mobile app includes the following native features:
- Background audio playback (foreground service via Music Controls plugin)
- Lock-screen and notification media controls (play/pause/next/prev/seek)
- Offline downloads with persistent storage in `Documents/music_downloads`
- Auto-cache (200 MB LRU) so recently played tracks work offline
- Offline Mix tab in Library — plays without internet
- Network status banner with quick link to offline library
- Native share, haptics, splash screen, status bar styling

## Final QA Checklist

After installing the APK on a device, verify:

- [ ] Floating header appears **only on the Home page**
- [ ] Mini player floats above the bottom nav (Apple-Music style)
- [ ] Tapping the mini player opens the immersive blur fullscreen player
- [ ] Lock-screen shows track art + play/pause/next/prev/seek
- [ ] Notification persists while audio is playing in background
- [ ] Downloading a track works offline (toggle airplane mode → still plays)
- [ ] Auto-cache: play a track online, go offline, replay → still plays
- [ ] Network banner appears immediately when going offline
- [ ] Background playback continues with screen off
- [ ] App icon launches with the dark splash, no white flash

## Troubleshooting

If you encounter issues:
- Ensure all dependencies are installed correctly
- Check that you've run `npx cap sync` after building
- For iOS build issues, ensure you have the latest Xcode
- For Android build issues, check that your SDK and build tools are up to date
