import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, X, Clock, Music2, Users, Disc3, ListMusic } from "lucide-react";
import MainLayout from "@web/components/layout/MainLayout";
import { Input } from "@web/components/ui/input";
import { Button } from "@web/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@web/components/ui/tabs";
import { TrackCard } from "@web/components/ui/track-card";
import { ArtistCard } from "@web/components/ui/artist-card";
import { PlaylistCard } from "@web/components/ui/playlist-card";
import { AlbumCard } from "@web/components/ui/album-card";
import { EmptyState } from "@web/components/ui/empty-state";
import { ErrorState } from "@web/components/ui/error-state";
import { CardGridSkeleton, ListSkeleton } from "@web/components/ui/loading-states";
import {
  useSearch,
  getRecentSearches,
  rememberSearch,
  clearRecentSearches,
} from "@web/hooks/use-search";

const SearchPage = () => {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") ?? "";
  const [term, setTerm] = useState(initial);
  const [recent, setRecent] = useState<string[]>(() => getRecentSearches());
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, loading, error, total } = useSearch(term);

  // Keep the URL in sync so searches are shareable and refresh-safe.
  useEffect(() => {
    const q = term.trim();
    const current = params.get("q") ?? "";
    if (q === current) return;
    const next = new URLSearchParams(params);
    if (q) next.set("q", q);
    else next.delete("q");
    setParams(next, { replace: true });
  }, [term]); // eslint-disable-line react-hooks/exhaustive-deps

  // Remember a term once it produced results.
  useEffect(() => {
    if (!loading && term.trim() && total > 0) {
      rememberSearch(term);
      setRecent(getRecentSearches());
    }
  }, [loading, total]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const hasQuery = term.trim().length > 0;
  const counts = useMemo(
    () => ({
      tracks: results.tracks.length,
      artists: results.artists.length,
      albums: results.albums.length,
      playlists: results.playlists.length,
    }),
    [results],
  );

  const TrackResults = () =>
    loading ? (
      <ListSkeleton rows={6} />
    ) : counts.tracks ? (
      <div className="space-y-0.5">
        {results.tracks.map((t) => (
          <TrackCard key={t.id} track={t} variant="list" />
        ))}
      </div>
    ) : (
      <EmptyState icon={Music2} title="No songs found" description="Try a different spelling or a shorter search." compact />
    );

  const ArtistResults = () =>
    loading ? (
      <CardGridSkeleton count={6} />
    ) : counts.artists ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {results.artists.map((a: any) => (
          <ArtistCard
            key={a.id}
            id={a.id}
            slug={a.slug}
            name={a.full_name || a.username || "Unknown artist"}
            image={a.avatar || "/placeholder.svg"}
            followers={a.follower_count}
            isVerified={a.is_verified}
          />
        ))}
      </div>
    ) : (
      <EmptyState icon={Users} title="No artists found" description="Search an artist name to see their profile." compact />
    );

  const AlbumResults = () =>
    loading ? (
      <CardGridSkeleton count={6} />
    ) : counts.albums ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {results.albums.map((al) => (
          <AlbumCard
            key={`${al.album_name}-${al.artist}`}
            albumName={al.album_name}
            artistName={al.artist}
            tracks={al.tracks}
            coverArt={al.tracks[0]?.cover || "/placeholder.svg"}
            type={al.track_count > 6 ? "album" : "ep"}
          />
        ))}
      </div>
    ) : (
      <EmptyState icon={Disc3} title="No releases found" description="Albums and EPs matching your search will show here." compact />
    );

  const PlaylistResults = () =>
    loading ? (
      <CardGridSkeleton count={6} />
    ) : counts.playlists ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {results.playlists.map((p: any) => (
          <PlaylistCard
            key={p.id}
            id={p.id}
            title={p.title}
            description={p.description}
            cover={p.cover || "/placeholder.svg"}
            trackCount={0}
            isEditorial={p.is_editorial}
            followerCount={p.follower_count}
          />
        ))}
      </div>
    ) : (
      <EmptyState icon={ListMusic} title="No playlists found" description="Try searching a playlist title." compact />
    );

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Search</h1>

          <div className="relative mb-6">
            <SearchIcon aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Songs, artists, albums or playlists"
              aria-label="Search MAUDIO"
              className="h-12 pl-10 pr-10 bg-muted text-base focus-visible:ring-primary"
            />
            {hasQuery && (
              <button
                type="button"
                onClick={() => { setTerm(""); inputRef.current?.focus(); }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {!hasQuery ? (
            recent.length > 0 ? (
              <section aria-label="Recent searches" className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Recent searches</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => { clearRecentSearches(); setRecent([]); }}
                  >
                    Clear
                  </Button>
                </div>
                <ul className="divide-y divide-border/60">
                  {recent.map((r) => (
                    <li key={r}>
                      <button
                        type="button"
                        onClick={() => setTerm(r)}
                        className="flex w-full items-center gap-3 py-3 text-left text-sm text-foreground hover:text-primary"
                      >
                        <Clock aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{r}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <EmptyState
                icon={SearchIcon}
                title="What do you want to listen to?"
                description="Search for songs, artists, albums and playlists across MAUDIO."
              />
            )
          ) : error ? (
            <ErrorState message="We couldn't run that search. Please try again." onRetry={() => setTerm((t) => `${t}`)} />
          ) : !loading && total === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title={`No results for "${term.trim()}"`}
              description="Check the spelling, or browse trending music instead."
            />
          ) : (
            <Tabs defaultValue="tracks" className="w-full">
              <TabsList className="bg-muted border border-border">
                <TabsTrigger value="tracks" className="text-xs gap-1.5">Songs {counts.tracks > 0 && <span className="text-muted-foreground">{counts.tracks}</span>}</TabsTrigger>
                <TabsTrigger value="artists" className="text-xs gap-1.5">Artists {counts.artists > 0 && <span className="text-muted-foreground">{counts.artists}</span>}</TabsTrigger>
                <TabsTrigger value="albums" className="text-xs gap-1.5">Releases {counts.albums > 0 && <span className="text-muted-foreground">{counts.albums}</span>}</TabsTrigger>
                <TabsTrigger value="playlists" className="text-xs gap-1.5">Playlists {counts.playlists > 0 && <span className="text-muted-foreground">{counts.playlists}</span>}</TabsTrigger>
              </TabsList>

              <TabsContent value="tracks" className="mt-5"><TrackResults /></TabsContent>
              <TabsContent value="artists" className="mt-5"><ArtistResults /></TabsContent>
              <TabsContent value="albums" className="mt-5"><AlbumResults /></TabsContent>
              <TabsContent value="playlists" className="mt-5"><PlaylistResults /></TabsContent>
            </Tabs>
          )}

          {!hasQuery && (
            <p className="mt-8 text-xs text-muted-foreground">
              Looking for something specific? <Link to="/browse" className="text-primary hover:underline">Browse all music</Link>
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SearchPage;
