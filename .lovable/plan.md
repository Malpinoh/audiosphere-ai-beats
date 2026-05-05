# Complete Native MAUDIO App — Final Wiring & Build

Yes — it's possible. The codebase already has the heavy pieces in place (Capacitor v8, Music Controls plugin, SQLite offline DB, Filesystem downloads + 200MB LRU cache, MediaSession fallback, mobile mini/fullscreen player, Spotify-like home header). What's missing is the final **native wiring, build config, and the manual Android Studio steps** — those can't run inside Lovable's sandbox, they must run on your machine.

## What I will do (inside Lovable)

1. **Native bootstrap polish**
  - Ensure `NativeBootstrap` initializes SQLite, Network listener, StatusBar, SplashScreen, and Music Controls in the correct order on app start.
  - Hide splash only after first paint + auth check.
2. **Capacitor config hardening** (`capacitor.config.ts`)
  - Confirm `server.url` is unset (ships compiled bundle, not live preview).
  - Add `App`, `Network`, `Filesystem`, `LocalNotifications`, `MusicControls` plugin configs.
  - Add Android `backgroundColor`, `useLegacyBridge: false`.
  - app id should be
    ```typescript
     appId: 'com.maudio.online',
    ```
3. **Android manifest needs (documented in MOBILE_APP_GUIDE.md)**
  List the exact permissions to add after `npx cap add android`:
  - `INTERNET`, `ACCESS_NETWORK_STATE`
  - `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK` (Android 14+)
  - `POST_NOTIFICATIONS` (Android 13+)
  - `WAKE_LOCK`, `MEDIA_CONTENT_CONTROL`
  - `READ_MEDIA_AUDIO` (for offline file access on Android 13+)
4. **Background playback reliability**
  - Verify the `<audio>` element keeps playing when WebView is backgrounded (Music Controls foreground service handles this — confirm it stays alive across track changes).
  - Wire `App.addListener('appStateChange')` to keep the notification synced when returning from background.
5. **Offline-first guarantees**
  - Confirm `useMusicPlayerState` falls back to cached → downloaded → stream in that priority and surfaces a clear "Offline" badge.
  - Auto-cache: every successful play writes to the 200MB LRU cache.
  - Offline Mix tab: ensure it lists tracks resolvable purely from SQLite + Filesystem with no network.
6. **Performance pass**
  - Lazy-load route bundles (most pages already code-split — verify Index, Library, Player).
  - Add `loading="lazy"` to non-critical images in cards.
  - Disable Web Audio EQ graph until user opens settings (saves CPU on low-end devices).
7. **Final QA checklist** added to `MOBILE_APP_GUIDE.md`:
  - Header only on Home ✓
  - Mini player floats above bottom nav ✓
  - Fullscreen immersive player ✓
  - Lock screen + notification controls (play/pause/next/prev/seek) ✓
  - Download → plays offline ✓
  - Auto-cache → plays offline ✓
  - Network banner appears when offline ✓
  - Background playback persists when screen off ✓

## What you must do (outside Lovable — required for a real native APK)

Lovable's sandbox cannot compile an Android APK or run an emulator. After I finish the code changes, you run these on your machine **once**:

```bash
git pull
npm install
npx cap add android         # only first time
npm run build
npx cap sync android
npx cap open android        # opens Android Studio
```

Then in Android Studio: **Build → Build APK** (or Run on a connected device/emulator).

For every future Lovable change: `git pull && npm run build && npx cap sync android` — no need to re-add the platform.

## Technical notes

- The `capacitor-music-controls-plugin` requires the Android platform to be **added locally** (it registers a Java service). It cannot be tested in the web preview — controls there will silently no-op via the `isAndroidNative()` guard in `src/lib/native/musicControls.ts`. That's expected.
- SQLite via `@capacitor-community/sqlite` also only activates on device; web uses the localStorage fallback already in `src/lib/offline/storage.ts`.
- iOS is **not** included — would need `npx cap add ios` + a Mac with Xcode + extra plugin variants. Say the word if you want me to scope iOS too.

## Out of scope

- Publishing to Google Play (signing keys, store listing, screenshots) — separate task.
- Push notifications (FCM setup) — not in current spec.

Approve to implement steps 1–7. After that the app is ready for you to run the local build commands above.