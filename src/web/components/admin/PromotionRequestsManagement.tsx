import { useCallback, useEffect, useState } from "react";
import { supabase } from "@shared/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@web/components/ui/card";
import { Button } from "@web/components/ui/button";
import { Badge } from "@web/components/ui/badge";
import { Textarea } from "@web/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@web/components/ui/tabs";
import { toast } from "@web/hooks/use-toast";

const db = supabase.from as any;

export function PromotionRequestsManagement() {
  const [pitches, setPitches] = useState<any[]>([]);
  const [boosts, setBoosts] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [e, b] = await Promise.all([
      db("editorial_submissions").select("id, status, pitch, admin_notes, created_at, tracks(title, artist), playlists(title)").order("created_at", { ascending: false }).limit(100),
      db("release_boosts").select("id, status, target_genre, duration_days, ends_at, admin_notes, created_at, tracks(title, artist)").order("created_at", { ascending: false }).limit(100),
    ]);
    setPitches(e.data || []); setBoosts(b.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const review = async (fn: string, id: string, approve: boolean) => {
    setBusy(id);
    const { error } = await (supabase.rpc as any)(fn, { _id: id, _approve: approve, _notes: notes[id] || null });
    setBusy(null);
    if (error) { toast({ title: "Action failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: approve ? "Approved" : "Declined" });
    load();
  };

  const Row = ({ r, fn, children }: { r: any; fn: string; children: React.ReactNode }) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{r.tracks?.title} <span className="text-muted-foreground font-normal">— {r.tracks?.artist}</span></CardTitle>
            <CardDescription>{new Date(r.created_at).toLocaleDateString()}</CardDescription>
          </div>
          <Badge variant={r.status === "rejected" ? "destructive" : r.status === "pending" ? "secondary" : "default"}>{r.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {children}
        {r.status === "pending" ? (<>
          <Textarea placeholder="Message to the artist (optional, they will see this)" value={notes[r.id] || ""} maxLength={1000}
            onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} rows={2} />
          <div className="flex gap-2">
            <Button size="sm" disabled={busy === r.id} onClick={() => review(fn, r.id, true)}>Approve</Button>
            <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => review(fn, r.id, false)}>Decline</Button>
          </div>
        </>) : r.admin_notes && <p className="text-xs text-muted-foreground">Note: {r.admin_notes}</p>}
      </CardContent>
    </Card>
  );

  const empty = <p className="text-sm text-muted-foreground py-8 text-center">No requests yet.</p>;

  return (
    <Tabs defaultValue="pitches">
      <TabsList className="mb-4">
        <TabsTrigger value="pitches">Editorial pitches ({pitches.filter((p) => p.status === "pending").length})</TabsTrigger>
        <TabsTrigger value="boosts">Release boosts ({boosts.filter((p) => p.status === "pending").length})</TabsTrigger>
      </TabsList>
      <TabsContent value="pitches" className="space-y-3">
        {pitches.length ? pitches.map((r) => (
          <Row key={r.id} r={r} fn="review_editorial_submission">
            <p className="text-sm"><span className="text-muted-foreground">Playlist:</span> {r.playlists?.title}</p>
            <p className="text-sm whitespace-pre-wrap">{r.pitch}</p>
            {r.status === "pending" && <p className="text-xs text-muted-foreground">Approving adds the song to the playlist.</p>}
          </Row>
        )) : empty}
      </TabsContent>
      <TabsContent value="boosts" className="space-y-3">
        {boosts.length ? boosts.map((r) => (
          <Row key={r.id} r={r} fn="review_release_boost">
            <p className="text-sm">{r.duration_days} days{r.target_genre ? ` · ${r.target_genre}` : ""}{r.ends_at ? ` · ends ${new Date(r.ends_at).toLocaleDateString()}` : ""}</p>
          </Row>
        )) : empty}
      </TabsContent>
    </Tabs>
  );
}
