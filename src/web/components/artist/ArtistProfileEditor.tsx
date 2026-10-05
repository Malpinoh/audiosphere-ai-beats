import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@web/components/ui/card";
import { Button } from "@web/components/ui/button";
import { Input } from "@web/components/ui/input";
import { Textarea } from "@web/components/ui/textarea";
import { supabase } from "@shared/integrations/supabase/client";
import { useServices } from "@shared/core";
import { Loader2, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

interface Props { artistProfileId: string }

/** Editor for a claimed artist profile. Ownership is enforced by database rules. */
export function ArtistProfileEditor({ artistProfileId }: Props) {
  const { storage } = useServices();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<null | "avatar" | "cover">(null);
  const [form, setForm] = useState({ full_name: "", username: "", bio: "", website: "" });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error }: any = await (supabase as any)
        .from("profiles")
        .select("full_name, username, bio, website, avatar_url, cover_image_path")
        .eq("id", artistProfileId)
        .maybeSingle();
      if (cancelled) return;
      if (error) { console.error(error); toast.error("Could not load artist profile"); }
      if (data) {
        setForm({ full_name: data.full_name || "", username: data.username || "", bio: data.bio || "", website: data.website || "" });
        setAvatar(data.avatar_url);
        setCover((data as any).cover_image_path);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [artistProfileId]);

  const update = async (patch: Record<string, any>) => {
    const { error } = await supabase.from("profiles").update(patch as any).eq("id", artistProfileId);
    if (error) { console.error(error); toast.error("You don't have permission to edit this profile"); return false; }
    return true;
  };

  const upload = async (file: File, kind: "avatar" | "cover") => {
    if (!ALLOWED.includes(file.type)) return toast.error("Use a JPG, PNG or WebP image");
    if (file.size > MAX_BYTES) return toast.error("Image must be under 5 MB");
    setUploading(kind);
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `artist/${artistProfileId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("cover_art").upload(path, file, { contentType: file.type, upsert: false });
    if (error) { console.error(error); toast.error("Upload failed. Please try again."); setUploading(null); return; }
    const ok = kind === "cover"
      ? await update({ cover_image_path: path })
      : await update({ avatar_url: storage.coverUrl(path) });
    if (ok) {
      kind === "cover" ? setCover(path) : setAvatar(storage.coverUrl(path));
      toast.success(kind === "cover" ? "Cover photo updated" : "Profile picture updated");
    }
    setUploading(null);
  };

  const save = async () => {
    setSaving(true);
    const ok = await update({ ...form, website: form.website.trim() || null });
    setSaving(false);
    if (ok) toast.success("Profile saved");
  };

  if (loading) {
    return <Card><CardContent className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>Manage Artist Page</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-2">Cover photo</p>
          <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg bg-gradient-to-br from-primary/30 to-accent/30">
            {cover && <img src={storage.coverUrl(cover)} alt="Artist cover" className="h-full w-full object-cover" />}
            <div className="absolute bottom-2 right-2 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => coverRef.current?.click()} disabled={!!uploading}>
                {uploading === "cover" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                <span className="ml-1">{cover ? "Change" : "Add"}</span>
              </Button>
              {cover && (
                <Button size="sm" variant="secondary" aria-label="Remove cover photo" onClick={async () => { if (await update({ cover_image_path: null })) setCover(null); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <input ref={coverRef} type="file" accept={ALLOWED.join(",")} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "cover"); e.target.value = ""; }} />
        </div>

        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {avatar && <img src={avatar} alt="Artist" className="h-full w-full object-cover" />}
          </div>
          <Button variant="outline" onClick={() => avatarRef.current?.click()} disabled={!!uploading}>
            {uploading === "avatar" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImagePlus className="h-4 w-4 mr-2" />}
            Change profile picture
          </Button>
          <input ref={avatarRef} type="file" accept={ALLOWED.join(",")} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "avatar"); e.target.value = ""; }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm font-medium space-y-2 block">Artist name
            <Input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} />
          </label>
          <label className="text-sm font-medium space-y-2 block">Username
            <Input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
          </label>
        </div>
        <label className="text-sm font-medium space-y-2 block">Bio
          <Textarea value={form.bio} maxLength={1000} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} className="min-h-[100px]" />
        </label>
        <label className="text-sm font-medium space-y-2 block">Website
          <Input type="url" value={form.website} placeholder="https://" onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} />
        </label>
        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save profile
        </Button>
      </CardContent>
    </Card>
  );
}
