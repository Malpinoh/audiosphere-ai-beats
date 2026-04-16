Proceed with the Playback Engine stabilization updates using the existing architecture.

Follow this exact execution order and ensure regression testing after each step.

-------------------------------------

STEP 1 — FIX CROSSFADE VOLUME RACE CONDITION

File:

src/contexts/music-player/MusicPlayerContext.tsx

Requirements:

Restore the audio volume immediately before calling playNextRef.current().

Do not rely on React effects to restore volume during crossfade.

Ensure:

audio.volume = savedVolumeRef.current

is executed right before:

playNextRef.current()

Reset:

crossfadeActiveRef

only after the new track successfully starts playing.

Ensure:

No track starts at volume 0

No silent playback occurs

-------------------------------------

STEP 2 — IMPLEMENT RESUME PLAYBACK FROM LAST POSITION

File:

src/contexts/music-player/useMusicPlayerState.ts

Requirements:

Save playback position every 5 seconds using localStorage.

Key format:

track-position-{trackId}

Implementation:

Use throttling to prevent excessive writes.

On track load:

Check localStorage for saved position.

If position exists:

Set:

audio.currentTime

before:

[audio.play](http://audio.play)()

Clear saved position when:

Track ends

User manually skips track

Ensure:

Resume works after refresh

Resume works after navigation

Resume works on mobile

-------------------------------------

STEP 3 — ADD BUFFERING DETECTION

File:

src/contexts/music-player/useMusicPlayerState.ts

Add listeners:

audio.addEventListener("waiting")

audio.addEventListener("playing")

Behavior:

If audio is buffering:

set isLoading = true

When playback resumes:

set isLoading = false

Ensure:

Spinner appears during mid-stream buffering

Spinner disappears immediately when playback resumes

-------------------------------------

STEP 4 — ADD QUEUE REORDER FUNCTION

Files:

src/contexts/music-player/types.ts

src/contexts/music-player/useMusicPlayerState.ts

src/components/layout/MusicPlayer.tsx

Requirements:

Add function:

reorderQueue(fromIndex: number, toIndex: number)

Implementation:

Use array splice logic.

UI:

Add Up and Down arrow buttons to each queue item.

Do not add drag-and-drop yet.

Ensure:

Queue updates instantly

Current playing track index remains correct

-------------------------------------

STEP 5 — FIX TRACK DURATION DISPLAY

File:

src/components/ui/track-card.tsx

Requirements:

If duration is missing:

Display:

—

Do not display:

0:00

Ensure:

Duration updates automatically once detected during playback.

-------------------------------------

STEP 6 — HYDRATE PLAYBACK PREFERENCES ON LOAD

File:

src/contexts/music-player/MusicPlayerContext.tsx

Requirements:

After loading saved EQ and audio preferences:

Call:

audioEngine.loadSavedState()

Then:

audioEngine.toggleEq()

Ensure:

EQ settings are active immediately when playback starts.

-------------------------------------

TESTING REQUIREMENTS

After completing all steps, verify:

Crossfade works smoothly

Tracks never start muted

Playback resumes correctly

Queue reorder works

Buffering spinner behaves correctly

Duration display is accurate

Playback works on mobile

Do not deploy until all tests pass.

-------------------------------------

End of stabilization update.