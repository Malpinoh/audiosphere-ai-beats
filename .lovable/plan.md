

# Fix Audio Playback + Artist Page Mobile Responsiveness + Global UI Polish

## Problem Summary

Three core issues identified from console logs and code inspection:

1. **Audio playback fails** with "loading timeout" and "play() interrupted by pause()" errors -- caused by a short 15s timeout, race conditions on rapid track switches, and async operations breaking user gesture context
2. **Artist page is not mobile responsive** -- header is fixed 400px height with oversized elements, stats/tabs use hardcoded dark colors (`bg-black/20`, `text-white`) instead of semantic tokens
3. **Hardcoded colors throughout artist components** break theming consistency

---

## Implementation Plan

### 1. Fix Audio Playback (useMusicPlayerState.ts)

- **Increase timeout** from 15s to 45s for large audio files
- **Add AbortError handling** -- suppress "play() interrupted by pause()" errors (these are harmless race conditions from rapid track switching)
- **Add playback lock** -- use a ref to prevent concurrent `playTrack` calls from racing. If a new track is requested while loading, abort the previous load
- **Remove redundant HEAD request** -- the pre-check `fetch(audioUrl, { method: 'HEAD' })` wastes time and breaks user gesture context on mobile. Just set `audio.src` directly and let the browser handle errors
- **Add retry logic** -- on timeout, retry once before showing error

### 2. Make Artist Header Mobile Responsive (ArtistHeader.tsx)

- Reduce height: `h-[400px]` → `h-[240px] md:h-[400px]`
- Smaller avatar on mobile: `h-20 w-20 md:h-32 md:w-32`
- Responsive text: `text-2xl md:text-4xl lg:text-5xl`
- Stack layout vertically on mobile (center-aligned) vs horizontal on desktop
- Stats row: wrap and use smaller text on mobile
- Replace hardcoded `bg-black/30` with semantic approach that works in both themes

### 3. Fix Artist Stats Display (ArtistStatsDisplay.tsx)

- Replace `bg-black/20 border-white/10` → `bg-card border-border`
- Replace `text-white` → `text-foreground`
- Replace `text-white/60` → `text-muted-foreground`
- Responsive grid: `grid-cols-2` on mobile stays, reduce padding

### 4. Fix Artist Tabs (ArtistTabs.tsx)

- Replace all `bg-black/20` → `bg-muted/50`
- Replace all `text-white` → `text-foreground`
- Replace `text-white/60` → `text-muted-foreground`
- Replace `border-white/10` → `border-border`
- TabsList: use semantic `bg-muted` styling
- Track rows: responsive padding, smaller text on mobile

### 5. Fix Artist Profile Page (ArtistProfile.tsx)

- Claim banner: use semantic tokens instead of `yellow-50/orange-50` hardcoded colors
- Responsive padding: `px-4 py-4 md:py-8`

### 6. Fix MobileFullscreenPlayer tap target and cover art

- Ensure cover art URL construction is consistent (use same `getCoverUrl` pattern)

---

## Files Changed

| File | Change |
|------|--------|
| `src/contexts/music-player/useMusicPlayerState.ts` | Fix timeout, abort handling, remove HEAD check, add playback lock |
| `src/components/artist/ArtistHeader.tsx` | Mobile responsive layout, semantic tokens |
| `src/components/artist/ArtistStatsDisplay.tsx` | Semantic tokens |
| `src/components/artist/ArtistTabs.tsx` | Semantic tokens, responsive sizing |
| `src/pages/ArtistProfile.tsx` | Responsive spacing, semantic claim banner |

