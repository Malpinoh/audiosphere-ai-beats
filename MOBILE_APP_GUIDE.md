
# Maudio Mobile App Guide

This guide will help you build and run the Maudio mobile app on iOS and Android devices.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- For iOS: Mac with Xcode 13+ installed
- For Android: Android Studio with SDK tools installed

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
- Background audio playback
- Lock screen & notification media controls
- Native share functionality
- Offline mode (coming soon)
- Push notifications (coming soon)

## Troubleshooting

If you encounter issues:
- Ensure all dependencies are installed correctly
- Check that you've run `npx cap sync` after building
- For iOS build issues, ensure you have the latest Xcode
- For Android build issues, check that your SDK and build tools are up to date
