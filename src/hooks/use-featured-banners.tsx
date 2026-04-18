import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FeaturedBanner {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export const MAX_BANNERS = 15;

export function useFeaturedBanners(activeOnly = true) {
  const [banners, setBanners] = useState<FeaturedBanner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("featured_banners" as any)
      .select("*")
      .order("display_order", { ascending: true });
    if (activeOnly) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (!error && data) setBanners(data as unknown as FeaturedBanner[]);
    setLoading(false);
  }, [activeOnly]);

  useEffect(() => {
    fetchBanners();
    const channel = supabase
      .channel("featured_banners_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "featured_banners" },
        () => fetchBanners()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBanners]);

  return { banners, loading, refetch: fetchBanners };
}
