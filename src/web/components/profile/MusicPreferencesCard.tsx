import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@shared/integrations/supabase/client";
import { useAuth } from "@web/contexts/AuthContext";
import { Card, CardContent } from "@web/components/ui/card";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { toast } from "@web/hooks/use-toast";

const GENRES = ["Afrobeats", "Amapiano", "Hip-Hop", "R&B", "Pop", "Gospel", "Highlife", "Dancehall", "Reggae", "Electronic", "Jazz", "Rock"];
const db = supabase.from as any;

/** Optional, dismissible prompt asking signed-in listeners for genres + location. Never blocks signup. */
export function MusicPreferencesCard() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [genres, setGenres] = useState<string[]>([]);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setShow(false); return; }
    db("listener_profiles").select("favorite_genres, prompt_dismissed_at").eq("user_id", user.id).maybeSingle()
      .then(({ data, error }: any) => {
        if (error) return;
        setShow(!data || (!data.prompt_dismissed_at && !(data.favorite_genres?.length)));
      });
  }, [user]);

  if (!show || !user) return null;

  const save = async (dismissOnly = false) => {
    setSaving(true);
    const row = dismissOnly
      ? { user_id: user.id, prompt_dismissed_at: new Date().toISOString() }
      : { user_id: user.id, favorite_genres: genres, country: country.trim() || null, city: city.trim() || null, prompt_dismissed_at: new Date().toISOString() };
    const { error } = await db("listener_profiles").upsert(row, { onConflict: "user_id" });
    setSaving(false);
    if (error) { toast({ title: "Couldn't save", description: error.message, variant: "destructive" }); return; }
    if (!dismissOnly) toast({ title: "Thanks! Your recommendations will get better." });
    setShow(false);
  };

  const toggle = (g: string) => setGenres((p) => p.includes(g) ? p.filter((x) => x !== g) : p.length < 5 ? [...p, g] : p);

  return (
    <Card className="border-primary/30">
      <CardContent className="p-5 space-y-4 relative">
        <button aria-label="Not now" onClick={() => save(true)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        <div>
          <h3 className="font-semibold">Tell us what you love</h3>
          <p className="text-sm text-muted-foreground">Optional — pick up to 5 genres and where you're listening from for better recommendations and local charts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <Button key={g} size="sm" variant={genres.includes(g) ? "default" : "outline"} onClick={() => toggle(g)} aria-pressed={genres.includes(g)}>{g}</Button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input placeholder="Country (optional)" value={country} onChange={(e) => setCountry(e.target.value)} maxLength={60} />
          <Input placeholder="City (optional)" value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => save(false)} disabled={saving || genres.length === 0}>Save</Button>
          <Button variant="ghost" onClick={() => save(true)} disabled={saving}>Not now</Button>
        </div>
      </CardContent>
    </Card>
  );
}
