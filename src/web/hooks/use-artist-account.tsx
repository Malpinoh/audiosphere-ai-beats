import { useEffect, useState } from "react";
import { supabase } from "@shared/integrations/supabase/client";
import { useAuth } from "@web/contexts/AuthContext";

export interface ManagedArtist { artist_profile_id: string; manager_role: string }

/** Artist profiles the signed-in user is approved to manage (via artist_profile_managers). */
export function useManagedArtists() {
  const { user } = useAuth();
  const [managed, setManaged] = useState<ManagedArtist[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    if (!user) { setManaged([]); setLoading(false); return; }
    setLoading(true);
    (supabase.from as any)("artist_profile_managers")
      .select("artist_profile_id, manager_role")
      .eq("user_id", user.id)
      .then(({ data, error }: any) => {
        if (cancelled) return;
        if (error) console.error("Error loading managed artists:", error);
        setManaged(data || []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user]);
  return { managed, loading };
}
