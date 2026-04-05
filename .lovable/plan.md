
Goal: make Playback Settings actually control playback, fix EQ muting audio, and make crossfade visibly and audibly work.

1. Fix the EQ mute root cause in the audio engine
- Refactor `src/hooks/use-audio-engine.ts` so enabling EQ never reroutes audio into a broken/suspended graph.
- Build a safer graph lifecycle:
  - create/resume `AudioContext` only from a valid user action
  - guard `createMediaElementSource()` so it is created once only
  - ensure the node chain is complete before applying gains
  - add a bypass path / safe fallback if graph init fails
- Add explicit engine status + failure reason so the app can explain why EQ is unavailable instead of silently muting audio.

2. Sync saved playback preferences into the live player
- In `src/pages/AccountSettings.tsx` and `src/contexts/music-player/MusicPlayerContext.tsx`, apply stored preferences on load instead of only saving them.
- Ensure these settings hydrate the active player:
  - preferred quality
  - auto quality
  - EQ enabled state
  - EQ preset/band gains
  - normalization
  - crossfade enabled/duration
- Today the settings UI mostly saves values, but the live engine/player is not fully restored from those saved values.

3. Make EQ state complete and persistent
- Extend the audio engine/context contract in `src/contexts/music-player/types.ts` and related files so it can:
  - report engine readiness/error
  - load saved band values
  - load preset selection
  - expose whether EQ can currently process the active stream
- Save actual band values/preset back through `useAudioPreferences` when the user changes sliders or presets.

4. Fix crossfade so it is a real transition, not only a fade-out
- Replace the current logic in `src/contexts/music-player/MusicPlayerContext.tsx` that only lowers the current track volume near the end.
- Implement proper behavior:
  - detect next playable track from queue
  - pre-trigger the transition before track end
  - start next track cleanly
  - restore normal volume after transition
  - prevent duplicate triggers during one track
- If true overlapping crossfade is not possible with the single-audio-element architecture, implement a reliable “gapless fade transition” and label it correctly in UI.

5. Improve Playback Settings UI feedback
- Upgrade `src/pages/AccountSettings.tsx` so each setting shows live status:
  - EQ: “Active / unavailable / failed to initialize”
  - Crossfade: “Works when next track exists in queue”
  - Quality: show effective mode (Auto vs selected)
- Add short helper/error text when EQ cannot be applied due to browser/context/CORS/runtime limitations.

6. Wire quality settings to actual playback behavior
- Connect `preferredQuality` and `autoQuality` to the playback system instead of leaving them as mostly saved preferences.
- Reuse the existing adaptive streaming hook/patterns where possible so account settings and player controls stay in sync.
- Make sure changing quality does not unintentionally reset playback or break EQ/crossfade.

7. Add diagnostics for playback enhancements
- Extend the existing diagnostics/error surfaces so users can see clear reasons such as:
  - AudioContext suspended
  - EQ initialization failed
  - stream cannot be processed
  - no next track available for crossfade
  - network/source playback issue
- Keep toast timing at 2.5 seconds, but show durable inline status in settings/player for enhancement-specific failures.

8. Regression checks after implementation
- Verify these flows:
  - play track normally with EQ off
  - turn EQ on and confirm sound still plays
  - move each EQ band and apply presets
  - reload page and confirm playback settings restore
  - enable crossfade with at least 2 queued tracks
  - confirm transition occurs and volume restores correctly
  - switch quality modes without breaking playback
- Also confirm desktop/mobile player UIs reflect the same shared state.

Technical notes
- Likely current root causes:
  - EQ graph can connect in a bad state and steal output from the plain audio path.
  - Saved preferences are not fully re-applied to the active engine on load.
  - Crossfade currently fades out only; it does not create a real track-to-track blend.
  - Quality settings are only partially wired to the actual playback pipeline.
- Files most likely involved:
  - `src/hooks/use-audio-engine.ts`
  - `src/contexts/music-player/MusicPlayerContext.tsx`
  - `src/contexts/music-player/types.ts`
  - `src/hooks/use-audio-preferences.tsx`
  - `src/pages/AccountSettings.tsx`
  - possibly `src/components/layout/MusicPlayer.tsx`
  - possibly `src/hooks/use-adaptive-streaming.tsx`
