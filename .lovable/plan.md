

# Fix Audio Playback + Add Crossfade, EQ, and Error Diagnostics

## Root Cause Analysis

The audio playback failure has two causes:

1. **Broken user gesture context on mobile**: The current `playTrack` flow does `audio.pause() → audio.src = url → await waitForCanPlay() → await audio.play()`. The `await` breaks the user gesture chain required by iOS/Android browsers. Fix: call `audio.play().catch(()=>{})` synchronously within the click handler to "unlock" the audio element before async work.

2. **Duplicate audio element**: `MusicPlayerContext.tsx` creates an audio element via `document.createElement('audio')` in useEffect AND renders `<audio ref={audioRef}>` in JSX. The ref ends up pointing to the JSX element, while the programmatic one is orphaned. Fix: remove the `useEffect` that creates the duplicate.

3. **`encodeURIComponent` on file path**: `getValidAudioUrl` wraps the path in `encodeURIComponent`, which could double-encode already-encoded characters. The stored paths are simple filenames like `1754390134479-zinoleesky-gen-z.mp3` and don't need encoding.

## Implementation Plan

### 1. Fix Audio Playback (useMusicPlayerState.ts + MusicPlayerContext.tsx)

**MusicPlayerContext.tsx**:
- Remove the `useEffect` that creates a duplicate audio element via `document.createElement`

**useMusicPlayerState.ts**:
- Remove `encodeURIComponent` from `getValidAudioUrl` -- just join base URL + clean path
- In `playTrack`: immediately call `audio.play().catch(() => {})` after setting `audio.src` to unlock the element (user gesture pattern), then await `canplay`, then play again
- Add categorized error messages: network error, decode error, unsupported format, timeout, offline detection via `navigator.onLine`
- Add `playbackError` state with `{ type, message, canRetry }` structure
- Add `retryPlayback()` function that replays the current track

### 2. Add Inline Error + Retry to Mini and Full Player

**MobileMiniPlayer.tsx**:
- When `playbackError` exists, show a red error chip with message and a retry icon button
- Toast shows for 2.5s via `toast.error(msg, { duration: 2500 })`

**MobileFullscreenPlayer.tsx**:
- Show error banner below track info with retry button and "Diagnostics" link
- Diagnostics modal: shows audio URL, HTTP status, network type, error code, browser info

**MusicPlayer.tsx** (desktop):
- Show inline error badge near track info with retry

### 3. Database Migration: Add Crossfade Columns

```sql
ALTER TABLE user_audio_preferences
ADD COLUMN crossfade_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN crossfade_duration integer NOT NULL DEFAULT 6;
```

### 4. Crossfade Implementation

**New hook: `src/hooks/use-crossfade.ts`**:
- Use Web Audio API: create two gain nodes connected to the AudioContext destination
- On track end (when remaining time < crossfade duration), fade out current track's gain and fade in next track's gain
- Manage two audio source nodes alternating between tracks

**Integration in useMusicPlayerState.ts**:
- Before `playNext` at track end, if crossfade is enabled, start the next track early and crossfade
- Listen for `timeupdate` and when `duration - currentTime < crossfadeDuration`, trigger crossfade

### 5. 5-Band EQ (Web Audio API)

**New component: `src/components/player/AudioEqualizer.tsx`**:
- 5 bands: 60Hz (Sub Bass), 230Hz (Bass), 910Hz (Mid), 4kHz (Treble), 14kHz (Presence)
- Each band is a `BiquadFilterNode` with type `peaking`, adjustable gain (-12dB to +12dB)
- Vertical sliders for each band
- Presets: Flat, Bass Boost, Vocal, Electronic, Acoustic
- Store settings in existing `eq_preset` jsonb column

**New hook: `src/hooks/use-audio-engine.ts`**:
- Creates `AudioContext` on first user interaction
- Connects audio element -> EQ filters chain -> gain node (for normalization) -> destination
- Exposes `setEqBand(frequency, gain)`, `setNormalization(enabled)`, `setCrossfadeEnabled/Duration`
- Integrates with `useAudioPreferences` for persistence

### 6. Playback Settings Tab in AccountSettings

Add a new "Playback" tab to `AccountSettings.tsx`:
- **Audio Quality**: preferred quality selector (Normal/High/Hi-Fi/Hi-Res)
- **Auto Quality**: toggle for adaptive bitrate
- **Crossfade**: enable toggle + duration slider (1-12 seconds)
- **Equalizer**: enable toggle + 5-band EQ visualization with preset selector
- **Volume Normalization**: toggle
- All settings persist via `useAudioPreferences` hook

### 7. Update useAudioPreferences Hook

- Add `crossfadeEnabled`, `crossfadeDuration` fields
- Map to new DB columns
- Expose in preferences object

### 8. Error Diagnostics Modal

**New component: `src/components/player/PlaybackDiagnostics.tsx`**:
- Shows: audio file URL, content type, file size, HTTP status, network connection type, browser, error code/message
- "Copy to clipboard" button for support
- Accessible from fullscreen player error state

---

## Files Changed

| File | Change |
|------|--------|
| `src/contexts/music-player/MusicPlayerContext.tsx` | Remove duplicate audio element creation |
| `src/contexts/music-player/useMusicPlayerState.ts` | Fix playback (user gesture unlock, remove encodeURI, categorized errors, retry, crossfade hook) |
| `src/contexts/music-player/types.ts` | Add `playbackError`, `retryPlayback` to context type |
| `src/components/layout/MobileMiniPlayer.tsx` | Inline error chip + retry button |
| `src/components/layout/MobileFullscreenPlayer.tsx` | Error banner, retry, diagnostics link |
| `src/components/layout/MusicPlayer.tsx` | Desktop inline error |
| `src/hooks/use-audio-preferences.tsx` | Add crossfade fields |
| `src/hooks/use-audio-engine.ts` | NEW -- Web Audio API engine (EQ, crossfade, normalization) |
| `src/components/player/AudioEqualizer.tsx` | NEW -- 5-band EQ UI |
| `src/components/player/PlaybackDiagnostics.tsx` | NEW -- error diagnostics modal |
| `src/pages/AccountSettings.tsx` | Add "Playback" tab with EQ, crossfade, quality settings |
| Migration | Add `crossfade_enabled`, `crossfade_duration` columns |

