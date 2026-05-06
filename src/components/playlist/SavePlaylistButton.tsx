import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SavePlaylistButtonProps {
  playlistId: string;
}

export function SavePlaylistButton({ playlistId }: SavePlaylistButtonProps) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("saved_playlists")
        .select("id")
        .eq("playlist_id", playlistId)
        .eq("user_id", user.id)
        .maybeSingle();
      setSaved(!!data);
    })();
  }, [user, playlistId]);

  if (!user) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      if (saved) {
        const { error } = await supabase
          .from("saved_playlists")
          .delete()
          .eq("playlist_id", playlistId)
          .eq("user_id", user.id);
        if (error) throw error;
        setSaved(false);
        toast.success("Removed from your library");
      } else {
        const { error } = await supabase
          .from("saved_playlists")
          .upsert(
            { playlist_id: playlistId, user_id: user.id },
            { onConflict: "user_id,playlist_id", ignoreDuplicates: true }
          );
        if (error) throw error;
        setSaved(true);
        toast.success("Saved to your library");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={saved ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className="gap-1.5"
    >
      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}