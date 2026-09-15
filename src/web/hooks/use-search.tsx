import { useCallback, useEffect, useState } from "react";
import { useMusicRepository } from "@shared/core";
import type { SearchResults } from "@shared/core/data/MusicRepository";

const EMPTY: SearchResults = { tracks: [], artists: [], albums: [], playlists: [] };
const RECENT_KEY = "maudio:recent-searches";
const MAX_RECENT = 8;

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function rememberSearch(term: string) {
  const q = term.trim();
  if (!q) return;
  try {
    const next = [q, ...getRecentSearches().filter((t) => t.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — recent searches simply won't persist */
  }
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
}

/** Debounced multi-entity search through MusicRepository. */
export function useSearch(term: string, debounceMs = 300) {
  const repository = useMusicRepository();
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(
    async (q: string, signal: { cancelled: boolean }) => {
      try {
        setLoading(true);
        setError(null);
        const data = await repository.searchAll(q);
        if (!signal.cancelled) setResults(data);
      } catch (err) {
        console.error("Search failed:", err);
        if (!signal.cancelled) {
          setError(err instanceof Error ? err : new Error("Search failed"));
          setResults(EMPTY);
        }
      } finally {
        if (!signal.cancelled) setLoading(false);
      }
    },
    [repository],
  );

  useEffect(() => {
    const q = term.trim();
    const signal = { cancelled: false };
    if (!q) {
      setResults(EMPTY);
      setLoading(false);
      return () => { signal.cancelled = true; };
    }
    const id = window.setTimeout(() => run(q, signal), debounceMs);
    return () => {
      signal.cancelled = true;
      window.clearTimeout(id);
    };
  }, [term, debounceMs, run]);

  const total =
    results.tracks.length + results.artists.length + results.albums.length + results.playlists.length;

  return { results, loading, error, total };
}
