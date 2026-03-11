

# MAUDIO Platform -- Development Audit & Improvement Plan

## Issues Found

### 1. Bugs & Broken Patterns
- **RecentPlaysSection**: Loading skeleton uses hardcoded `bg-white/5` instead of semantic `bg-muted` token
- **RecentPlaysSection**: TrackCard rendered without `variant="list"` -- inconsistent with mobile list approach
- **MobileAuthGuard**: Forces mobile users to auth before seeing homepage -- bad UX for discovery; new users can't browse
- **MainLayout**: Double bottom spacing -- `h-[120px]` spacer + `h-14` bottom nav spacer causes excessive whitespace on mobile
- **Navbar mobile menu**: Still shows Home, Browse, Library links that duplicate bottom nav items
- **MusicPlayer**: On mobile, no progress bar shown -- only play/pause button, no seek or time info
- **AccountSettings**: `profile?.follower_count.toLocaleString()` will crash if `follower_count` is null

### 2. UX Improvements Needed
- **No search on mobile home**: Search is buried in hamburger menu; should be prominent
- **MobileFullscreenPlayer**: No swipe-to-dismiss gesture
- **Track list actions**: Like/queue buttons hidden behind hover (impossible on touch); need always-visible on mobile
- **No loading/splash state**: App shows blank white while auth loads
- **Bottom nav + player overlap**: Player sits at `bottom-14` on mobile but spacer math is off

### 3. Polish & Consistency
- **Navbar mobile menu redundancy**: Remove nav links already in bottom nav (Home, Browse, Library)
- **Missing `safe-area-inset`** CSS class used but never defined
- **Console noise**: Excessive `console.log` in audio player state (dozens of logs per interaction)

---

## Implementation Plan

### Task 1: Fix MobileAuthGuard -- allow browsing without auth
Remove `MobileAuthGuard` wrapper from the homepage route. Let unauthenticated mobile users browse. The bottom nav Profile tab already redirects to `/auth` if not logged in.

**File**: `src/App.tsx`
- Remove `MobileAuthGuard` component entirely
- Change route `/` to render `<Index />` directly

### Task 2: Fix MainLayout mobile spacing
The current spacer stack on mobile adds up to ~190px of dead space. Simplify to one correct spacer.

**File**: `src/components/layout/MainLayout.tsx`
- Mobile with player: player height (~72px) + bottom nav (56px) = 128px spacer
- Desktop: 96px spacer (h-24)
- Remove the separate `h-14` bottom nav spacer div

### Task 3: Clean up Navbar mobile menu redundancy
Remove Home, Browse, Library from the hamburger sheet since they're in the bottom nav. Keep only: Search, Upload, Dashboard, Admin, Account, Sign Out.

**File**: `src/components/layout/Navbar.tsx`
- Filter `navLinks` out of mobile sheet content
- Keep search bar and auth section

### Task 4: Add mobile search bar to homepage
Add a search input at the top of the mobile homepage for quick access.

**File**: `src/pages/Index.tsx`
- Add `SearchBar` component above sections when `isMobile`

### Task 5: Fix MusicPlayer mobile -- add progress bar and time
Currently mobile player only shows play/pause. Add a slim progress bar and track time.

**File**: `src/components/layout/MusicPlayer.tsx`
- In the mobile branch, add a progress `Slider` below controls
- Show `currentTime / duration` text

### Task 6: Fix TrackCard touch interactions
On mobile, like/queue buttons are hidden behind `:hover` which doesn't work on touch. Make action buttons always visible on mobile.

**File**: `src/components/ui/track-card.tsx`
- In list variant, remove `opacity-0 group-hover:opacity-100` on mobile
- Show a compact action row (like button always visible, plus menu for queue)

### Task 7: Fix RecentPlaysSection styling
- Replace `bg-white/5` with `bg-muted`
- Pass `variant="list"` to TrackCard

**File**: `src/components/sections/RecentPlaysSection.tsx`

### Task 8: Fix AccountSettings null safety
- Add optional chaining: `profile?.follower_count?.toLocaleString() || '0'`

**File**: `src/pages/AccountSettings.tsx`

### Task 9: Add safe-area CSS + reduce console noise
**File**: `src/index.css`
- Add `.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }` and `.safe-area-inset { padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }`

### Task 10: Add app loading skeleton
Show a branded loading screen while auth initializes instead of blank white.

**File**: `src/App.tsx`
- Add a simple loading state with MAUDIO logo + spinner while `AuthProvider` is loading

---

## Summary
10 focused tasks addressing bugs (auth guard, spacing, null crash), mobile UX (search, progress bar, touch actions), and polish (redundant nav, safe-area, loading state). No database changes needed.

