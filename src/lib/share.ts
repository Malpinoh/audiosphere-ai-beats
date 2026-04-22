// Build social-share URLs that route through the og-preview edge function.
// Crawlers (WhatsApp, Facebook, Twitter, Telegram, LinkedIn) receive
// fully-rendered OG tags; humans are redirected to the canonical app URL.

const SUPABASE_URL = "https://qkpjlfcpncvvjyzfolag.supabase.co";

export type ShareKind = "track" | "artist" | "playlist";

export function buildShareUrl(kind: ShareKind, id: string): string {
  return `${SUPABASE_URL}/functions/v1/og-preview/${kind}/${encodeURIComponent(id)}`;
}

interface SharePayload {
  kind: ShareKind;
  id: string;
  title: string;
  text?: string;
}

/**
 * Try Web Share API; fall back to copying the share link to clipboard.
 * Returns the share URL that was used.
 */
export async function shareContent(p: SharePayload): Promise<string> {
  const url = buildShareUrl(p.kind, p.id);
  const shareData: ShareData = {
    title: p.title,
    text: p.text || p.title,
    url,
  };
  try {
    // @ts-ignore - canShare is not in lib.dom in older TS
    if (typeof navigator !== "undefined" && navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      await navigator.share(shareData);
      return url;
    }
  } catch {
    // user cancelled or share failed — fall through to clipboard
  }
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // ignore — caller may show a manual copy fallback
  }
  return url;
}
