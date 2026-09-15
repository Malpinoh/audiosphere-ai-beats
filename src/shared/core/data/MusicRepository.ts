/**
 * MusicRepository — the single source of music data for the whole app.
 *
 * Pages, components and hooks must not query Supabase (or any other backend)
 * for music data directly. They ask the repository, which owns query shape,
 * URL formatting (via StorageManager) and fallbacks.
 */
import { supabase } from "@shared/integrations/supabase/client";
import type { Track, TracksFilter } from "@shared/types/track-types";
import type { StorageManager } from "@shared/core/storage/StorageManager";
import {
  fetchTracks as fetchTracksQuery,
  fetchTrack as fetchTrackQuery,
  fetchAvailableRegions,
  logStreamPlay,
} from "@shared/services/track-service";

export interface AlbumSummary {
  album_name: string;
  artist: string;
  artist_profile_id?: string | null;
  cover_art_path?: string | null;
  track_count: number;
  tracks: Track[];
}

export interface SearchResults {
  tracks: Track[];
  artists: any[];
  albums: AlbumSummary[];
  playlists: any[];
}

export interface MusicRepository {
  // Tracks
  getTracks(filter?: TracksFilter): Promise<Track[]>;
  getTrack(id: string): Promise<Track | null>;
  getTrending(limit?: number): Promise<Track[]>;
  getCharts(opts: {
    scope: "global" | "regional";
    region?: string;
    period?: "daily" | "weekly" | "monthly";
    limit?: number;
  }): Promise<Track[]>;
  logPlay(trackId: string): Promise<boolean>;
  getRegions(): Promise<string[]>;

  // Artists & albums
  getArtistTracks(artistIdOrName: string): Promise<Track[]>;
  getArtist(idOrSlug: string): Promise<any | null>;
  getAlbums(artistIdOrName: string): Promise<AlbumSummary[]>;

  // Discovery
  search(term: string, limit?: number): Promise<Track[]>;
  searchAll(term: string, limit?: number): Promise<SearchResults>;
  getRecommendations(userId?: string | null, limit?: number): Promise<Track[]>;
  getSimilarTracks(trackId: string, limit?: number): Promise<Track[]>;

  // Playlists
  getPlaylists(limit?: number): Promise<any[]>;
  getPlaylist(id: string): Promise<any | null>;
  getPlaylistTracks(playlistId: string): Promise<Track[]>;

  // User library
  getLikedTracks(userId: string): Promise<Track[]>;
  getSavedTracks(userId: string): Promise<Track[]>;
  getRecentlyPlayed(userId: string, limit?: number): Promise<Track[]>;
}

export function createMusicRepository(storage: StorageManager): MusicRepository {
  /** Attach resolved media URLs through StorageManager. */
  const decorate = (rows: any[]): Track[] =>
    (rows || []).map((t) => ({
      ...t,
      track_type: ["single", "ep", "album"].includes(t.track_type)
        ? t.track_type
        : "single",
      cover: storage.coverUrl(t.cover_art_path),
      audioUrl: storage.audioUrl(t.audio_file_path),
    })) as Track[];

  const tracksByIds = async (ids: string[]): Promise<Track[]> => {
    if (!ids.length) return [];
    const { data } = await supabase.from("tracks").select("*").in("id", ids);
    const order = new Map(ids.map((id, i) => [id, i]));
    return decorate(data || []).sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
    );
  };

  return {
    async getTracks(filter = { published: true, limit: 10 }) {
      return decorate(await fetchTracksQuery(filter));
    },

    async getTrack(id) {
      const t = await fetchTrackQuery(id);
      return t ? decorate([t])[0] : null;
    },

    async getTrending(limit = 50) {
      return decorate(await fetchTracksQuery({ chartType: "trending", limit }));
    },

    async getCharts({ scope, region, period, limit = 50 }) {
      return decorate(
        await fetchTracksQuery({
          chartType: scope,
          region,
          chartPeriod: period,
          limit,
        }),
      );
    },

    logPlay: (trackId) => logStreamPlay(trackId),
    getRegions: () => fetchAvailableRegions(),

    async getArtistTracks(artistIdOrName) {
      if (!artistIdOrName) return [];
      let profileId = artistIdOrName;
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          artistIdOrName,
        );
      if (!isUuid) {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .or(`username.ilike.${artistIdOrName},full_name.ilike.${artistIdOrName}`)
          .limit(1)
          .maybeSingle();
        if (data) profileId = data.id;
      }
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .or(
          `user_id.eq.${profileId},artist_profile_id.eq.${profileId},artist.ilike.${artistIdOrName}`,
        )
        .order("play_count", { ascending: false });
      if (error) throw error;
      return decorate(data || []);
    },

    async getArtist(idOrSlug) {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      const query = supabase.from("profiles").select("*");
      const { data } = isUuid
        ? await query.eq("id", idOrSlug).maybeSingle()
        : await query.eq("slug", idOrSlug).maybeSingle();
      if (!data) return null;
      return { ...data, avatar: storage.artistImageUrl((data as any).avatar_url) };
    },

    async getAlbums(artistIdOrName) {
      const tracks = await this.getArtistTracks(artistIdOrName);
      const map = new Map<string, AlbumSummary>();
      for (const t of tracks) {
        const name = t.album_name || t.title;
        const entry = map.get(name);
        if (entry) {
          entry.tracks.push(t);
          entry.track_count = entry.tracks.length;
        } else {
          map.set(name, {
            album_name: name,
            artist: t.artist,
            artist_profile_id: t.artist_profile_id,
            cover_art_path: t.cover_art_path,
            track_count: 1,
            tracks: [t],
          });
        }
      }
      return Array.from(map.values());
    },

    async search(term, limit = 30) {
      if (!term?.trim()) return [];
      return decorate(
        await fetchTracksQuery({ published: true, searchTerm: term, limit }),
      );
    },

    async searchAll(term, limit = 20) {
      const q = term?.trim();
      if (!q) return { tracks: [], artists: [], albums: [], playlists: [] };

      const [tracks, artistsRes, playlistsRes] = await Promise.all([
        this.search(q, limit),
        supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, slug, is_verified, follower_count")
          .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
          .limit(limit),
        supabase
          .from("playlists")
          .select("*")
          .ilike("title", `%${q}%`)
          .limit(limit),
      ]);

      const artists = (artistsRes.data || []).map((a: any) => ({
        ...a,
        avatar: storage.artistImageUrl(a.avatar_url),
      }));

      const playlists = (playlistsRes.data || []).map((p: any) => ({
        ...p,
        cover: storage.coverUrl(p.cover_image_path),
      }));

      // Albums are derived from matching tracks that belong to a release.
      const albumMap = new Map<string, AlbumSummary>();
      for (const t of tracks) {
        if (!t.album_name) continue;
        const key = `${t.album_name}::${t.artist}`;
        const entry = albumMap.get(key);
        if (entry) {
          entry.tracks.push(t);
          entry.track_count = entry.tracks.length;
        } else {
          albumMap.set(key, {
            album_name: t.album_name,
            artist: t.artist,
            artist_profile_id: t.artist_profile_id,
            cover_art_path: t.cover_art_path,
            track_count: 1,
            tracks: [t],
          });
        }
      }

      return { tracks, artists, albums: Array.from(albumMap.values()), playlists };
    },

    async getRecommendations(userId, limit = 20) {
      if (userId) {
        const { data, error } = await supabase.rpc(
          "get_personalized_recommendations",
          { p_user_id: userId, p_limit: limit },
        );
        if (!error && data && data.length) {
          return tracksByIds((data as any[]).map((r) => r.track_id));
        }
      }
      return decorate(
        await fetchTracksQuery({
          published: true,
          limit,
          orderBy: { column: "play_count", ascending: false },
        }),
      );
    },

    async getSimilarTracks(trackId, limit = 10) {
      const { data, error } = await supabase.rpc("get_similar_tracks", {
        p_track_id: trackId,
        p_limit: limit,
      });
      if (error || !data) return [];
      return tracksByIds((data as any[]).map((r) => r.track_id));
    },

    async getPlaylists(limit = 50) {
      const { data } = await supabase
        .from("playlists")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      return (data || []).map((p: any) => ({
        ...p,
        cover: storage.coverUrl(p.cover_image_path),
      }));
    },

    async getPlaylist(id) {
      const { data } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      return { ...data, cover: storage.coverUrl((data as any).cover_image_path) };
    },

    async getPlaylistTracks(playlistId) {
      const { data } = await supabase
        .from("playlist_tracks")
        .select("position, tracks(*)")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true });
      return decorate((data || []).map((r: any) => r.tracks).filter(Boolean));
    },

    async getLikedTracks(userId) {
      const { data } = await supabase
        .from("likes")
        .select("tracks(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      return decorate((data || []).map((r: any) => r.tracks).filter(Boolean));
    },

    async getSavedTracks(userId) {
      const { data } = await supabase
        .from("saved_tracks")
        .select("tracks(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      return decorate((data || []).map((r: any) => r.tracks).filter(Boolean));
    },

    async getRecentlyPlayed(userId, limit = 20) {
      const { data } = await supabase
        .from("user_listening_history")
        .select("tracks(*), last_listened_at")
        .eq("user_id", userId)
        .order("last_listened_at", { ascending: false })
        .limit(limit);
      return decorate((data || []).map((r: any) => r.tracks).filter(Boolean));
    },
  };
}
