import { useState, useRef } from "react";
import { useFeaturedBanners, MAX_BANNERS, FeaturedBanner } from "@/hooks/use-featured-banners";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, ChevronUp, ChevronDown, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export function FeaturedBannersManagement() {
  const { banners, refetch } = useFeaturedBanners(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (banners.length >= MAX_BANNERS) {
      toast.error(`Maximum of ${MAX_BANNERS} banners allowed`);
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("featured_banners")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("featured_banners").getPublicUrl(path);
      const nextOrder = banners.length > 0 ? Math.max(...banners.map((b) => b.display_order)) + 1 : 0;
      const { error: insErr } = await supabase.from("featured_banners" as any).insert({
        image_url: pub.publicUrl,
        display_order: nextOrder,
        is_active: true,
      } as any);
      if (insErr) throw insErr;
      toast.success("Banner uploaded");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (banner: FeaturedBanner) => {
    if (!confirm("Delete this banner?")) return;
    const { error } = await supabase.from("featured_banners" as any).delete().eq("id", banner.id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    // Best-effort cleanup of storage object
    try {
      const url = banner.image_url;
      const idx = url.indexOf("/featured_banners/");
      if (idx >= 0) {
        const path = url.slice(idx + "/featured_banners/".length);
        await supabase.storage.from("featured_banners").remove([path]);
      }
    } catch {}
    toast.success("Banner deleted");
    refetch();
  };

  const handleToggle = async (banner: FeaturedBanner, active: boolean) => {
    const { error } = await supabase
      .from("featured_banners" as any)
      .update({ is_active: active } as any)
      .eq("id", banner.id);
    if (error) toast.error("Failed to update");
    else refetch();
  };

  const handleUpdateField = async (banner: FeaturedBanner, field: "title" | "link_url", value: string) => {
    const { error } = await supabase
      .from("featured_banners" as any)
      .update({ [field]: value || null } as any)
      .eq("id", banner.id);
    if (error) toast.error("Failed to update");
    else refetch();
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= banners.length) return;
    const a = banners[index];
    const b = banners[target];
    await Promise.all([
      supabase.from("featured_banners" as any).update({ display_order: b.display_order } as any).eq("id", a.id),
      supabase.from("featured_banners" as any).update({ display_order: a.display_order } as any).eq("id", b.id),
    ]);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Featured Banners</h2>
          <p className="text-sm text-muted-foreground">
            {banners.length} / {MAX_BANNERS} banners. Recommended size: 1920×600 (16:5).
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || banners.length >= MAX_BANNERS}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading…" : "Upload Banner"}
          </Button>
        </div>
      </div>

      {banners.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No banners yet. Upload your first banner above.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner, i) => (
            <Card key={banner.id} className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-64 flex-shrink-0 aspect-[16/5] rounded-lg overflow-hidden bg-muted">
                  <img src={banner.image_url} alt={banner.title || "banner"} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Title (optional)</label>
                      <Input
                        defaultValue={banner.title || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (banner.title || "")) {
                            handleUpdateField(banner, "title", e.target.value);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Link URL (optional)</label>
                      <Input
                        defaultValue={banner.link_url || ""}
                        placeholder="https://…"
                        onBlur={(e) => {
                          if (e.target.value !== (banner.link_url || "")) {
                            handleUpdateField(banner, "link_url", e.target.value);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Switch checked={banner.is_active} onCheckedChange={(v) => handleToggle(banner, v)} />
                      <span className="text-sm">{banner.is_active ? "Active" : "Hidden"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" onClick={() => handleMove(i, -1)} disabled={i === 0}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleMove(i, 1)}
                        disabled={i === banners.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(banner)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
