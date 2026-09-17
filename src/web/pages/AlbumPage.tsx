import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import MainLayout from "@web/components/layout/MainLayout";
import { supabase } from "@shared/integrations/supabase/client";
import { useServices } from "@shared/core";
import { Track } from "@shared/types/track-types";
import { useMusicPlayer } from "@web/contexts/music-player";
import { Button } from "@web/components/ui/button";
import { Play, Pause, Calendar, Disc3, Shuffle } from "lucide-react";
import { Artwork } from "@web/components/ui/artwork";
import { TrackCard } from "@web/components/ui/track-card";
import { EmptyState } from "@web/components/ui/empty-state";
import { ErrorState } from "@web/components/ui/error-state";
import { ListSkeleton } from "@web/components/ui/loading-states";
import { Skeleton } from "@web/components/ui/skeleton";
import { formatTime } from "@shared/utils/formatTime";

interface Album {
  name: string;
  artist: string;
  artistProfileId?: string | null;
  type: "album" | "ep" | "single";
  coverArt: string;
  tracks: Track[];
  releaseDate?: string;
  description?: string;
}

const AlbumPage = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const { storage } = useServices();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { setQueue, playTrack, currentTrack, isPlaying, togglePlay } = useMusicPlayer();

  const fetchAlbum = useCallback(async () => {
    if (!albumId) return;
    const decoded = decodeURIComponent(albumId);
    try {
      setLoading(true);
      setFailed(false);

      let rows: any[] | null = null;
      const byName = await supabase
        .from("tracks")
        .select("*")
        .eq("album_name", decoded)
        .eq("published", true);
      if (byName.error) throw byName.error;

      if (byName.data?.length) {
        rows = byName.data;
      } else if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded)
      ) {
        const byId = await supabase
          .from("tracks")
          .select("*")
          .eq("id", decoded)
          .eq("published", true);
        if (byId.error) throw byId.error;
        rows = byId.data;
      }

      if (!rows?.length) {
        setAlbum(null);
        return;
      }

      const tracks = rows
        .map((t) => ({
          ...t,
          track_type: ["single", "ep", "album"].includes(t.track_type) ? t.track_type : "single",
          cover: storage.coverUrl(t.cover_art_path),
          audioUrl: storage.audioUrl(t.audio_file_path),
        }))
        .sort((a, b) => (a.track_number || 0) - (b.track_number || 0)) as Track[];

      const first = tracks[0];
      setAlbum({
        name: first.album_name || first.title,
        artist: first.artist,
        artistProfileId: first.artist_profile_id,
        type: (first.track_type as Album["type"]) || "single",
        coverArt: storage.coverUrl(first.cover_art_path),
        tracks,
        releaseDate: first.uploaded_at,
        description: first.description,
      });
    } catch (err) {
      console.error("Error fetching album:", err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [albumId, storage]);

  useEffect(() => {
    fetchAlbum();
  }, [fetchAlbum]);

  const albumIsPlaying =
    !!album && isPlaying && album.tracks.some((t) => t.id === currentTrack?.id);

  const handlePlayAlbum = () => {
    if (!album?.tracks.length) return;
    if (albumIsPlaying) {
      togglePlay();
      return;
    }
    setQueue(album.tracks, { kind: "album", name: album.name } as any);
    playTrack(album.tracks[0]);
  };

  const handleShuffle = () => {
    if (!album?.tracks.length) return;
    const shuffled = [...album.tracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled, { kind: "album", name: album.name } as any);
    playTrack(shuffled[0]);
  };

  const totalDuration = album?.tracks.reduce((acc, t) => acc + (t.duration || 0), 0) || 0;

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <Skeleton className="w-40 h-40 md:w-56 md:h-56 rounded-2xl mx-auto md:mx-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-11 w-36 rounded-full" />
            </div>
          </div>
          <ListSkeleton rows={6} />
        </div>
      </MainLayout>
    );
  }

  if (failed) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-12">
          <ErrorState message="We couldn't load this release right now." onRetry={fetchAlbum} />
        </div>
      </MainLayout>
    );
  }

  if (!album) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-12">
          <EmptyState
            icon={Disc3}
            title="Release not found"
            description="This album or EP doesn't exist, or it isn't published anymore."
            actionLabel="Browse music"
            onAction={() => { window.location.href = "/browse"; }}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <header className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 text-center md:text-left mb-8">
          <Artwork
            src={album.coverArt}
            alt={`${album.name} cover art`}
            shape="rounded"
            className="w-44 h-44 md:w-56 md:h-56 shadow-elevated flex-shrink-0"
          />
          <div className="flex-1 min-w-0 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {album.type}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground break-words">
              {album.name}
            </h1>
            {album.artistProfileId ? (
              <Link
                to={`/artist/${album.artistProfileId}`}
                className="inline-block text-lg text-muted-foreground hover:text-primary"
              >
                {album.artist}
              </Link>
            ) : (
              <p className="text-lg text-muted-foreground">{album.artist}</p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground">
              <Calendar aria-hidden="true" className="h-4 w-4" />
              <span>{album.releaseDate ? new Date(album.releaseDate).getFullYear() : "—"}</span>
              <span aria-hidden="true">•</span>
              <span>{album.tracks.length} {album.tracks.length === 1 ? "track" : "tracks"}</span>
              {totalDuration > 0 && (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{formatTime(totalDuration)}</span>
                </>
              )}
            </div>

            {album.description && (
              <p className="text-sm text-muted-foreground max-w-2xl">{album.description}</p>
            )}

            <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
              <Button
                onClick={handlePlayAlbum}
                className="rounded-full px-7 h-11 font-semibold gap-2"
                aria-label={albumIsPlaying ? "Pause release" : "Play release"}
              >
                {albumIsPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
                {albumIsPlaying ? "Pause" : "Play"}
              </Button>
              <Button
                variant="outline"
                onClick={handleShuffle}
                className="rounded-full h-11 px-5 gap-2"
                aria-label="Shuffle release"
              >
                <Shuffle className="h-4 w-4" />
                Shuffle
              </Button>
            </div>
          </div>
        </header>

        <section aria-label="Track list" className="space-y-0.5">
          {album.tracks.map((track) => (
            <TrackCard key={track.id} track={track} variant="list" />
          ))}
        </section>
      </div>
    </MainLayout>
  );
};

export default AlbumPage;
