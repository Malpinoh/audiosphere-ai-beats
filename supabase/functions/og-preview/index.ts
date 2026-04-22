// Public OG/Twitter preview renderer for Maudio.
// URL pattern: /functions/v1/og-preview/{type}/{id}
//   type = track | artist | playlist
// Crawlers (WhatsApp, Facebook, Twitter, Telegram, LinkedIn, Slack, Discord)
// receive HTML with full OG tags. Humans get an immediate redirect to
// the canonical app URL on the configured frontend domain.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SITE = Deno.env.get("MAUDIO_SITE_URL") ?? "https://maudio.online";
const DEFAULT_IMAGE = `${SITE}/maudio-logo.png`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOT_RE = /bot|crawler|spider|facebookexternalhit|whatsapp|telegrambot|twitterbot|linkedinbot|slackbot|discordbot|googlebot|bingbot|applebot|embedly|pinterest|skypeuripreview|vkshare|w3c_validator|preview/i;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function publicUrl(bucket: string, path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

interface OgData {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string; // og:type value
  siteName: string;
}

async function loadTrack(id: string): Promise<OgData | null> {
  const { data, error } = await supabase
    .from("tracks")
    .select("id, title, artist, cover_art_path")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const cover = publicUrl("cover_art", data.cover_art_path) ?? DEFAULT_IMAGE;
  return {
    title: `${data.title} — ${data.artist}`,
    description: `Listen to ${data.title} by ${data.artist} on Maudio.`,
    image: cover,
    url: `${SITE}/track/${data.id}`,
    type: "music.song",
    siteName: "Maudio",
  };
}

async function loadArtist(slugOrId: string): Promise<OgData | null> {
  // Try slug first, then id
  let { data } = await supabase
    .from("profiles")
    .select("id, slug, full_name, username, avatar_url, bio")
    .eq("slug", slugOrId)
    .maybeSingle();
  if (!data) {
    const res = await supabase
      .from("profiles")
      .select("id, slug, full_name, username, avatar_url, bio")
      .eq("id", slugOrId)
      .maybeSingle();
    data = res.data ?? null;
  }
  if (!data) return null;
  const name = data.full_name || data.username || "Artist";
  const avatar = publicUrl("Profile Pictures", data.avatar_url) ?? DEFAULT_IMAGE;
  const slug = data.slug || data.id;
  return {
    title: name,
    description: `Discover music by ${name} on Maudio`,
    image: avatar,
    url: `${SITE}/artist/${slug}`,
    type: "profile",
    siteName: "Maudio",
  };
}

async function loadPlaylist(id: string): Promise<OgData | null> {
  const { data } = await supabase
    .from("playlists")
    .select("id, title, description, cover_image_path")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const cover = publicUrl("cover_art", data.cover_image_path) ?? DEFAULT_IMAGE;
  return {
    title: data.title,
    description: data.description || `Listen to the playlist ${data.title} on Maudio`,
    image: cover,
    url: `${SITE}/playlist/${data.id}`,
    type: "music.playlist",
    siteName: "Maudio",
  };
}

function renderHtml(d: OgData, isBot: boolean): string {
  const t = escapeHtml(d.title);
  const desc = escapeHtml(d.description);
  const img = escapeHtml(d.image);
  const url = escapeHtml(d.url);
  const refresh = isBot ? "" : `<meta http-equiv="refresh" content="0; url=${url}" />`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${t}</title>
<meta name="description" content="${desc}" />
<link rel="canonical" href="${url}" />

<meta property="og:type" content="${escapeHtml(d.type)}" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${img}" />
<meta property="og:image:secure_url" content="${img}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${url}" />
<meta property="og:site_name" content="${escapeHtml(d.siteName)}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="${img}" />

${refresh}
</head>
<body>
<p>Redirecting to <a href="${url}">${t}</a>…</p>
<script>window.location.replace(${JSON.stringify(d.url)});</script>
</body>
</html>`;
}

function notFoundHtml(): string {
  return `<!DOCTYPE html><html><head><title>Not found · Maudio</title>
<meta property="og:title" content="Maudio" />
<meta property="og:description" content="Stream and discover music on Maudio" />
<meta property="og:image" content="${DEFAULT_IMAGE}" />
<meta property="og:url" content="${SITE}" />
<meta http-equiv="refresh" content="0; url=${SITE}" /></head>
<body><script>window.location.replace(${JSON.stringify(SITE)});</script></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  // Strip the function prefix; keep everything after /og-preview
  const idx = url.pathname.indexOf("/og-preview");
  const tail = idx >= 0 ? url.pathname.slice(idx + "/og-preview".length) : url.pathname;
  const parts = tail.split("/").filter(Boolean);
  const ua = req.headers.get("user-agent") ?? "";
  const isBot = BOT_RE.test(ua);

  const htmlHeaders = {
    ...corsHeaders,
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, max-age=300, s-maxage=600",
  };

  try {
    if (parts.length < 2) {
      return new Response(notFoundHtml(), { status: 404, headers: htmlHeaders });
    }
    const [type, id] = parts;
    let data: OgData | null = null;
    if (type === "track") data = await loadTrack(id);
    else if (type === "artist") data = await loadArtist(id);
    else if (type === "playlist") data = await loadPlaylist(id);

    if (!data) {
      return new Response(notFoundHtml(), { status: 404, headers: htmlHeaders });
    }
    return new Response(renderHtml(data, isBot), { status: 200, headers: htmlHeaders });
  } catch (err) {
    console.error("og-preview error", err);
    return new Response(notFoundHtml(), { status: 500, headers: htmlHeaders });
  }
});
