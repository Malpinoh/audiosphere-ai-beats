/**
 * Offline storage layer for MAUDIO mobile.
 *
 * Two stores:
 *  - Downloads → Capacitor Filesystem `Documents/music_downloads/{trackId}.mp3`
 *    Persistent, never auto-deleted. Tracked in SQLite `downloads` table.
 *  - Auto-cache → Capacitor Filesystem `Cache/music_cache/{trackId}.mp3`
 *    LRU-evicted when total > 200 MB. Tracked in SQLite `cache_entries`.
 *
 * Metadata uses @capacitor-community/sqlite on native, falls back to a
 * localStorage-backed shim on web so the same API works everywhere.
 */
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";

export const isNative = (): boolean => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

export const CACHE_LIMIT_BYTES = 200 * 1024 * 1024; // 200 MB

export interface OfflineTrack {
  track_id: string;
  title: string;
  artist: string;
  album?: string | null;
  cover_art_path?: string | null;
  audio_file_path: string; // remote URL or storage path (kept for re-stream)
  file_path: string;       // local relative path in the directory
  size_bytes: number;
  duration?: number | null;
  added_at: number;        // epoch ms
  last_played_at: number;  // epoch ms
}

const DOWNLOAD_DIR = "music_downloads";
const CACHE_DIR = "music_cache";

// ---------- SQLite (native) + web shim ----------

let _sqliteReady: Promise<any> | null = null;
async function getDb() {
  if (!isNative()) return null;
  if (_sqliteReady) return _sqliteReady;
  _sqliteReady = (async () => {
    const { CapacitorSQLite, SQLiteConnection } = await import("@capacitor-community/sqlite");
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const dbName = "maudio_offline";
    let db: any;
    try {
      const ret = await sqlite.checkConnectionsConsistency();
      const isConn = (await sqlite.isConnection(dbName, false)).result;
      if (ret.result && isConn) {
        db = await sqlite.retrieveConnection(dbName, false);
      } else {
        db = await sqlite.createConnection(dbName, false, "no-encryption", 1, false);
      }
      await db.open();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS downloads (
          track_id TEXT PRIMARY KEY,
          title TEXT, artist TEXT, album TEXT,
          cover_art_path TEXT, audio_file_path TEXT,
          file_path TEXT, size_bytes INTEGER,
          duration INTEGER, added_at INTEGER, last_played_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS cache_entries (
          track_id TEXT PRIMARY KEY,
          title TEXT, artist TEXT, album TEXT,
          cover_art_path TEXT, audio_file_path TEXT,
          file_path TEXT, size_bytes INTEGER,
          duration INTEGER, added_at INTEGER, last_played_at INTEGER
        );
      `);
      return db;
    } catch (e) {
      console.warn("[offline] SQLite init failed, using web shim", e);
      _sqliteReady = null;
      return null;
    }
  })();
  return _sqliteReady;
}

// Web fallback — stash arrays in localStorage. Only used in browser preview.
const WEB_KEY_DOWNLOADS = "maudio_offline_downloads";
const WEB_KEY_CACHE = "maudio_offline_cache";

function webRead(key: string): OfflineTrack[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function webWrite(key: string, list: OfflineTrack[]) {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch {}
}

async function listRows(table: "downloads" | "cache_entries"): Promise<OfflineTrack[]> {
  const db = await getDb();
  if (!db) {
    return webRead(table === "downloads" ? WEB_KEY_DOWNLOADS : WEB_KEY_CACHE);
  }
  const res = await db.query(`SELECT * FROM ${table} ORDER BY added_at DESC`);
  return (res.values || []) as OfflineTrack[];
}

async function upsertRow(table: "downloads" | "cache_entries", row: OfflineTrack) {
  const db = await getDb();
  if (!db) {
    const key = table === "downloads" ? WEB_KEY_DOWNLOADS : WEB_KEY_CACHE;
    const list = webRead(key).filter(r => r.track_id !== row.track_id);
    list.unshift(row);
    webWrite(key, list);
    return;
  }
  await db.run(
    `INSERT OR REPLACE INTO ${table}
     (track_id,title,artist,album,cover_art_path,audio_file_path,file_path,size_bytes,duration,added_at,last_played_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [row.track_id, row.title, row.artist, row.album || null, row.cover_art_path || null,
     row.audio_file_path, row.file_path, row.size_bytes, row.duration || null,
     row.added_at, row.last_played_at]
  );
}

async function deleteRow(table: "downloads" | "cache_entries", trackId: string) {
  const db = await getDb();
  if (!db) {
    const key = table === "downloads" ? WEB_KEY_DOWNLOADS : WEB_KEY_CACHE;
    webWrite(key, webRead(key).filter(r => r.track_id !== trackId));
    return;
  }
  await db.run(`DELETE FROM ${table} WHERE track_id = ?`, [trackId]);
}

async function touchRow(table: "downloads" | "cache_entries", trackId: string) {
  const db = await getDb();
  const now = Date.now();
  if (!db) {
    const key = table === "downloads" ? WEB_KEY_DOWNLOADS : WEB_KEY_CACHE;
    const list = webRead(key);
    const idx = list.findIndex(r => r.track_id === trackId);
    if (idx >= 0) { list[idx].last_played_at = now; webWrite(key, list); }
    return;
  }
  await db.run(`UPDATE ${table} SET last_played_at = ? WHERE track_id = ?`, [now, trackId]);
}

// ---------- File I/O ----------

function dirFor(kind: "download" | "cache") {
  return {
    dirName: kind === "download" ? DOWNLOAD_DIR : CACHE_DIR,
    directory: kind === "download" ? Directory.Documents : Directory.Cache,
  };
}

async function ensureDir(kind: "download" | "cache") {
  if (!isNative()) return;
  const { dirName, directory } = dirFor(kind);
  try { await Filesystem.mkdir({ path: dirName, directory, recursive: true }); }
  catch (e: any) { /* already exists */ }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(binary);
}

async function fetchAndWrite(kind: "download" | "cache", trackId: string, remoteUrl: string): Promise<{ filePath: string; size: number; localUri: string } | null> {
  if (!isNative()) return null;
  await ensureDir(kind);
  const { dirName, directory } = dirFor(kind);
  const filePath = `${dirName}/${trackId}.mp3`;
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const data = arrayBufferToBase64(buf);
  await Filesystem.writeFile({ path: filePath, data, directory, recursive: true });
  const uriRes = await Filesystem.getUri({ path: filePath, directory });
  return { filePath, size: buf.byteLength, localUri: Capacitor.convertFileSrc(uriRes.uri) };
}

async function deleteFile(kind: "download" | "cache", filePath: string) {
  if (!isNative()) return;
  const { directory } = dirFor(kind);
  try { await Filesystem.deleteFile({ path: filePath, directory }); } catch {}
}

async function getLocalUri(kind: "download" | "cache", filePath: string): Promise<string | null> {
  if (!isNative()) return null;
  const { directory } = dirFor(kind);
  try {
    const r = await Filesystem.getUri({ path: filePath, directory });
    return Capacitor.convertFileSrc(r.uri);
  } catch { return null; }
}

async function fileExists(kind: "download" | "cache", filePath: string): Promise<boolean> {
  if (!isNative()) return false;
  const { directory } = dirFor(kind);
  try { await Filesystem.stat({ path: filePath, directory }); return true; }
  catch { return false; }
}

// ---------- Public API ----------

export interface TrackForOffline {
  id: string;
  title: string;
  artist: string;
  album_name?: string | null;
  cover_art_path?: string | null;
  audio_file_path: string;
  duration?: number | null;
}

function resolveRemoteUrl(audio_file_path: string): string {
  if (audio_file_path.startsWith("http")) return audio_file_path;
  const clean = audio_file_path.trim().replace(/^\/+/, "");
  return `https://qkpjlfcpncvvjyzfolag.supabase.co/storage/v1/object/public/audio_files/${clean}`;
}

export async function isDownloaded(trackId: string): Promise<boolean> {
  const rows = await listRows("downloads");
  const row = rows.find(r => r.track_id === trackId);
  if (!row) return false;
  if (!isNative()) return true;
  return fileExists("download", row.file_path);
}

export async function isCached(trackId: string): Promise<boolean> {
  const rows = await listRows("cache_entries");
  const row = rows.find(r => r.track_id === trackId);
  if (!row) return false;
  if (!isNative()) return true;
  return fileExists("cache", row.file_path);
}

export async function getOfflineUri(trackId: string): Promise<string | null> {
  const dRows = await listRows("downloads");
  const d = dRows.find(r => r.track_id === trackId);
  if (d && isNative()) {
    const uri = await getLocalUri("download", d.file_path);
    if (uri) { touchRow("downloads", trackId).catch(() => {}); return uri; }
  }
  const cRows = await listRows("cache_entries");
  const c = cRows.find(r => r.track_id === trackId);
  if (c && isNative()) {
    const uri = await getLocalUri("cache", c.file_path);
    if (uri) { touchRow("cache_entries", trackId).catch(() => {}); return uri; }
  }
  return null;
}

export async function downloadTrack(track: TrackForOffline, onProgress?: (p: number) => void): Promise<void> {
  if (!isNative()) {
    // Web fallback: just record the intent so UI shows "downloaded"
    await upsertRow("downloads", {
      track_id: track.id, title: track.title, artist: track.artist,
      album: track.album_name, cover_art_path: track.cover_art_path,
      audio_file_path: track.audio_file_path,
      file_path: `${DOWNLOAD_DIR}/${track.id}.mp3`, size_bytes: 0,
      duration: track.duration ?? null, added_at: Date.now(), last_played_at: Date.now(),
    });
    return;
  }
  const url = resolveRemoteUrl(track.audio_file_path);
  onProgress?.(0.1);
  const wrote = await fetchAndWrite("download", track.id, url);
  onProgress?.(0.95);
  if (!wrote) throw new Error("Write failed");
  await upsertRow("downloads", {
    track_id: track.id, title: track.title, artist: track.artist,
    album: track.album_name, cover_art_path: track.cover_art_path,
    audio_file_path: track.audio_file_path,
    file_path: wrote.filePath, size_bytes: wrote.size,
    duration: track.duration ?? null, added_at: Date.now(), last_played_at: Date.now(),
  });
  onProgress?.(1);
}

export async function deleteDownload(trackId: string): Promise<void> {
  const rows = await listRows("downloads");
  const row = rows.find(r => r.track_id === trackId);
  if (row) await deleteFile("download", row.file_path);
  await deleteRow("downloads", trackId);
}

export async function listDownloads(): Promise<OfflineTrack[]> {
  return listRows("downloads");
}

export async function listCached(): Promise<OfflineTrack[]> {
  return listRows("cache_entries");
}

export async function listOfflineMix(): Promise<OfflineTrack[]> {
  const [d, c] = await Promise.all([listRows("downloads"), listRows("cache_entries")]);
  const byId = new Map<string, OfflineTrack>();
  for (const r of d) byId.set(r.track_id, r);
  for (const r of c) if (!byId.has(r.track_id)) byId.set(r.track_id, r);
  return Array.from(byId.values()).sort((a, b) => b.last_played_at - a.last_played_at);
}

export async function getCacheUsage(): Promise<{ used: number; limit: number }> {
  const rows = await listRows("cache_entries");
  const used = rows.reduce((s, r) => s + (r.size_bytes || 0), 0);
  return { used, limit: CACHE_LIMIT_BYTES };
}

/** Evict least-recently-played cache entries until total < limit. */
async function evictCacheIfNeeded() {
  const rows = (await listRows("cache_entries"))
    .sort((a, b) => a.last_played_at - b.last_played_at);
  let total = rows.reduce((s, r) => s + (r.size_bytes || 0), 0);
  for (const r of rows) {
    if (total <= CACHE_LIMIT_BYTES) break;
    await deleteFile("cache", r.file_path);
    await deleteRow("cache_entries", r.track_id);
    total -= (r.size_bytes || 0);
  }
}

/** Background-cache a track after it starts playing. Safe to call always. */
export async function cacheTrackInBackground(track: TrackForOffline): Promise<void> {
  if (!isNative()) return;
  try {
    if (await isDownloaded(track.id)) return;
    if (await isCached(track.id)) {
      await touchRow("cache_entries", track.id);
      return;
    }
    const url = resolveRemoteUrl(track.audio_file_path);
    const wrote = await fetchAndWrite("cache", track.id, url);
    if (!wrote) return;
    await upsertRow("cache_entries", {
      track_id: track.id, title: track.title, artist: track.artist,
      album: track.album_name, cover_art_path: track.cover_art_path,
      audio_file_path: track.audio_file_path,
      file_path: wrote.filePath, size_bytes: wrote.size,
      duration: track.duration ?? null, added_at: Date.now(), last_played_at: Date.now(),
    });
    await evictCacheIfNeeded();
  } catch (e) {
    console.warn("[offline] cache failed", e);
  }
}

export async function clearCache(): Promise<void> {
  const rows = await listRows("cache_entries");
  for (const r of rows) {
    await deleteFile("cache", r.file_path);
    await deleteRow("cache_entries", r.track_id);
  }
}

/** Convert offline rows back into Track-shaped objects for the player queue. */
export function offlineToTrack(o: OfflineTrack): any {
  return {
    id: o.track_id,
    title: o.title,
    artist: o.artist,
    album_name: o.album,
    cover_art_path: o.cover_art_path,
    audio_file_path: o.audio_file_path,
    duration: o.duration ?? 0,
  };
}