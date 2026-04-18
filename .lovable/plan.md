

This is a large, multi-part implementation. Let me quickly scan the relevant existing files to ground the plan.
<lov-tool-use id="toolu_vrtx_01DgVNgsU9CMYZB46um44uHT" name="code--view" integration-id="code" data="{\"file_path\": \"src/hooks/use-audio-engine.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_012tXr1sxj8vu23LGV6jkYA9" name="code--view" integration-id="code" data="{\"file_path\": \"src/contexts/music-player/MusicPlayerContext.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01Lg6Uh8zAKKj5rKe41vbjBk" name="code--view" integration-id="code" data="{\"file_path\": \"src/contexts/music-player/useMusicPlayerState.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01JZiTnfBdy1EE73MYN5TYA4" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/AccountSettings.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01En8UAFZDMmPwdJc8zDhCYq" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/layout/MobileFullscreenPlayer.tsx\", \"lines\": \"1,40\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01J9Q8AqyJggNKNDwU3msE4V" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/layout/MobileFullscreenPlayer.tsx\", \"lines\": \"1,30\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01LXf9UhQwkPLngsFgPGLcew" name="code--view" integration-id="code" data="{\"file_path\": \"src/contexts/music-player/MusicPlayerContext.tsx\", \"lines\": \"1,80\"}">
</lov-tool-use>
I have enough context to plan. Let me present the plan.

<lov-plan>

## Implementation Plan

A large multi-part upgrade. I'll group by part, list new files/edits, and call out scope decisions.

### Part 1 — Admin Featured Banner Management

**Database migration**
- New table `featured_banners`: `id uuid pk`, `image_url text`, `title text null`, `link_url text null`, `display_order int`, `is_active bool default true`, `created_at timestamptz default now()`.
- RLS: anyone can SELECT active rows; only admins (via `is_admin()`) can INSERT/UPDATE/DELETE.
- New public storage bucket `featured_banners` for uploads, with admin-only write policies.

**Admin UI**
- New `src/components/admin/FeaturedBannersManagement.tsx`: upload (max 15 enforced), preview grid, active toggle, delete, replace, reorder via up/down arrows (drag-and-drop deferred to keep scope tight).
- Add tab "Banners" in `src/pages/AdminPanel.tsx`.

**Home display**
- Rewrite `src/components/sections/HeroSection.tsx`: remove all static text/buttons. Fetch active banners ordered by `display_order`. Render auto-rotating slider (5s), pause on hover (desktop), swipe (mobile), arrow nav (desktop). If 0 active banners → render nothing. 16:5 aspect on desktop, responsive on mobile, `object-cover`.

### Part 2 — Mobile Playback Reliability

Edit `src/contexts/music-player/useMusicPlayerState.ts` and `src/hooks/use-audio-engine.ts`:
- Force `audio.preload = "metadata"`.
- 8s load timeout → auto-retry up to 3 times, then surface error.
- Already have `waiting`/`playing`; add `canplay` to clear loader and set ready state.
- Detect slow connection via `navigator.connection.effectiveType` (`2g`/`slow-2g`/`3g`) → request lower-quality variant via existing `get_track_stream_url` rpc with reduced `p_max_bitrate`.

### Part 3 — Settings / EQ Page Mobile Responsive

Edit `src/pages/AccountSettings.tsx`:
- Single-column on mobile, grid on `md+`.
- Sliders full width, min 44px touch targets, no horizontal scroll, scrollable container.

### Part 4 + 5 — Full-Screen Player Redesign & Functional Controls

Rewrite `src/components/layout/MobileFullscreenPlayer.tsx` as scrollable layout:

Sections (top→bottom, vertically scrollable):
1. Header (close, queue button, settings hint)
2. Artwork
3. Title/artist + Like
4. Progress bar + times
5. Main controls: Shuffle, Prev, Play/Pause, Next, Repeat
6. Secondary row: Like, Add to Queue, View Queue, Share, Volume
7. **Metadata card**: title, artist, album, genre, release year, duration, songwriters, producer, composer, label, ISRC, language, explicit — only render fields that exist.
8. **Song DNA card**: genre, mood, energy, tempo, danceability, popularity (progress bars + tags). Derive from track fields where present; show "—" placeholder for unknown attributes (no fake data).
9. **Related Tracks**: 5 tracks via existing `get_similar_tracks` rpc; tap to play.

**Queue drawer**: new bottom Sheet opened by Queue button, shows current + upcoming, reorder (uses existing `reorderQueue`), remove.

**Swipe-down from top → Playback Settings drawer** (new component `PlaybackSettingsDrawer.tsx`):
- EQ: Bass / Mid / Treble sliders + presets (Normal, Bass Boost, Treble Boost, Vocal, Dance, Flat). Maps onto existing 5-band engine via preset definitions.
- Crossfade slider 0–12s (Off, 2, 4, 6, 8, 10, 12) — wired into existing `crossfadeDuration` state and `user_audio_preferences`.
- Playback speed selector (0.75x / 1x / 1.25x / 1.5x / 2x) → sets `audio.playbackRate` on the active element. New context method `setPlaybackRate`.
- Audio quality selector (Auto / High / Medium / Low) → updates `user_audio_preferences.preferred_quality` + `auto_quality` and re-resolves stream.

**Gesture handling**: existing swipe-down-to-close stays for outside-of-top area; swipe-down only from top 60px region opens settings drawer (drag-up dismiss). Tap outside closes.

### Scope decisions (kept minimal)
- Reorder uses up/down buttons (no DnD library) for both banners and queue.
- Song DNA shows real values where available; missing attributes display "—" (per platform real-data rule).
- "Download" button only renders if a future `downloadable` flag is set; otherwise hidden.
- Songwriter/Producer/Composer/Label/ISRC/Language/Explicit fields will display only if present on the track. (Schema does not currently store them — they will simply hide until added later. No DB column additions in this plan to keep scope contained. Can add a follow-up migration if you want them editable now — say the word.)

### Files
**New**
- `supabase/migrations/<ts>_featured_banners.sql`
- `src/components/admin/FeaturedBannersManagement.tsx`
- `src/components/player/PlaybackSettingsDrawer.tsx`
- `src/components/player/QueueDrawer.tsx`
- `src/components/player/RelatedTracksSection.tsx`
- `src/components/player/SongDnaCard.tsx`
- `src/components/player/TrackMetadataCard.tsx`
- `src/hooks/use-featured-banners.tsx`

**Edited**
- `src/components/sections/HeroSection.tsx`
- `src/pages/AdminPanel.tsx`
- `src/pages/AccountSettings.tsx`
- `src/components/layout/MobileFullscreenPlayer.tsx`
- `src/contexts/music-player/MusicPlayerContext.tsx`
- `src/contexts/music-player/useMusicPlayerState.ts`
- `src/contexts/music-player/types.ts`
- `src/hooks/use-audio-engine.ts`

