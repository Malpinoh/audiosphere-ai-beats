import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@web/components/ui/card";
import { Button } from "@web/components/ui/button";
import { Badge } from "@web/components/ui/badge";
import { Textarea } from "@web/components/ui/textarea";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@web/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@web/components/ui/select";
import { Megaphone } from "lucide-react";
import { supabase } from "@shared/integrations/supabase/client";
import { useAuth } from "@web/contexts/AuthContext";
import { toast } from "@web/hooks/use-toast";

const db = supabase.from as any;
interface Opt { id: string; title: string }
interface Req { id: string; kind: "Boost" | "Pitch"; title: string; status: string; note?: string | null }

export const PromotionSection = ({ artistId }: { artistId: string }) => {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Opt[]>([]);
  const [playlists, setPlaylists] = useState<Opt[]>([]);
  const [requests, setRequests] = useState<Req[]>([]);
  const [open, setOpen] = useState<null | "boost" | "pitch">(null);
  const [trackId, setTrackId] = useState("");
  const [playlistId, setPlaylistId] = useState("");
  const [genre, setGenre] = useState("");
  const [days, setDays] = useState("7");
  const [pitch, setPitch] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [t, p, b, e] = await Promise.all([
      supabase.from("tracks").select("id, title").eq("artist_profile_id", artistId).eq("published", true).order("uploaded_at", { ascending: false }),
      supabase.from("playlists").select("id, title").eq("is_editorial", true).order("title"),
      db("release_boosts").select("id, status, admin_notes, tracks(title)").eq("artist_profile_id", artistId).order("created_at", { ascending: false }).limit(10),
      db("editorial_submissions").select("id, status, admin_notes, tracks(title), playlists(title)").eq("artist_profile_id", artistId).order("created_at", { ascending: false }).limit(10),
    ]);
    setTracks(t.data || []);
    setPlaylists(p.data || []);
    setRequests([
      ...(b.data || []).map((r: any) => ({ id: r.id, kind: "Boost", title: r.tracks?.title, status: r.status, note: r.admin_notes })),
      ...(e.data || []).map((r: any) => ({ id: r.id, kind: "Pitch", title: `${r.tracks?.title} → ${r.playlists?.title}`, status: r.status, note: r.admin_notes })),
    ]);
  }, [artistId]);
  useEffect(() => { load(); }, [load]);

  const openDialog = (k: "boost" | "pitch") => { setTrackId(tracks[0]?.id || ""); setPlaylistId(""); setPitch(""); setOpen(k); };

  const submit = async () => {
    if (!user || !trackId) return;
    setBusy(true);
    const { error } = open === "boost"
      ? await db("release_boosts").insert({ artist_profile_id: artistId, track_id: trackId, requested_by: user.id, target_genre: genre || null, duration_days: Number(days) })
      : await db("editorial_submissions").insert({ artist_profile_id: artistId, track_id: trackId, playlist_id: playlistId, submitted_by: user.id, pitch: pitch.trim() });
    setBusy(false);
    if (error) {
      toast({ title: "Could not send", description: error.code === "23505" ? "This song already has an open request." : error.message, variant: "destructive" });
      return;
    }
    toast({ title: open === "boost" ? "Boost requested" : "Pitch sent", description: "Our team will review it shortly." });
    setOpen(null); load();
  };

  const noTracks = tracks.length === 0;
  const canSubmit = trackId && (open === "boost" || (playlistId && pitch.trim().length >= 10));

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" />Promotion Opportunities</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border border-border rounded-md">
          <h4 className="font-medium">Boost Your Latest Release</h4>
          <p className="text-sm text-muted-foreground mb-3">Ask our team to feature a song across MAUDIO for 1–30 days.</p>
          <Button size="sm" className="w-full" disabled={noTracks} onClick={() => openDialog("boost")}>Boost Track</Button>
        </div>
        <div className="p-4 border border-border rounded-md">
          <h4 className="font-medium">Submit to Editorial Playlists</h4>
          <p className="text-sm text-muted-foreground mb-3">Pitch a song to our editors for playlist consideration.</p>
          <Button size="sm" variant="outline" className="w-full" disabled={noTracks || playlists.length === 0} onClick={() => openDialog("pitch")}>Submit Music</Button>
          {playlists.length === 0 && <p className="text-xs text-muted-foreground mt-2">No editorial playlists are open for pitches right now.</p>}
        </div>
        {noTracks && <p className="text-xs text-muted-foreground">Publish a song first to unlock promotion.</p>}
        {requests.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Your requests</h4>
            <ul className="space-y-2">
              {requests.map((r) => (
                <li key={r.id} className="text-sm flex items-start justify-between gap-2">
                  <div><span className="text-muted-foreground">{r.kind}:</span> {r.title}{r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}</div>
                  <Badge variant={r.status === "rejected" ? "destructive" : r.status === "pending" ? "secondary" : "default"}>{r.status}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{open === "boost" ? "Boost a release" : "Pitch to an editorial playlist"}</DialogTitle>
            <DialogDescription>Requests are reviewed by the MAUDIO team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Song</Label>
              <Select value={trackId} onValueChange={setTrackId}>
                <SelectTrigger><SelectValue placeholder="Choose a song" /></SelectTrigger>
                <SelectContent>{tracks.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {open === "boost" ? (<>
              <div className="space-y-2"><Label>Target genre (optional)</Label><Input value={genre} onChange={(e) => setGenre(e.target.value)} maxLength={50} placeholder="e.g. Afrobeats" /></div>
              <div className="space-y-2"><Label>Length</Label>
                <Select value={days} onValueChange={setDays}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["3", "7", "14", "30"].map((d) => <SelectItem key={d} value={d}>{d} days</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>) : (<>
              <div className="space-y-2"><Label>Playlist</Label>
                <Select value={playlistId} onValueChange={setPlaylistId}>
                  <SelectTrigger><SelectValue placeholder="Choose a playlist" /></SelectTrigger>
                  <SelectContent>{playlists.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Your pitch</Label>
                <Textarea value={pitch} onChange={(e) => setPitch(e.target.value)} maxLength={1000} rows={5} placeholder="Tell the editors about the song, its story and why it fits this playlist (min 10 characters)." />
              </div>
            </>)}
          </div>
          <DialogFooter><Button onClick={submit} disabled={!canSubmit || busy}>{busy ? "Sending…" : "Send request"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
