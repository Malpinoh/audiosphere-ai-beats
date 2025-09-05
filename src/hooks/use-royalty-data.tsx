import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EarningsData {
  total_earnings: number;
  available_balance: number;
  total_paid_out: number;
  total_streams: number;
  total_tracks: number;
  pending_payouts: number;
}

export interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  requested_at: string;
  processed_at?: string;
  admin_notes?: string;
}

export interface EarningsBreakdown {
  track_id: string;
  track_title: string;
  earnings_amount: number;
  stream_count: number;
  regions: string[];
}

export const useRoyaltyData = () => {
  const { user, profile } = useAuth();
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [earningsBreakdown, setEarningsBreakdown] = useState<EarningsBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEarningsData = async () => {
    if (!user || profile?.role !== 'artist') return;

    try {
      const { data, error } = await supabase
        .from("artist_earnings_summary")
        .select("*")
        .eq("artist_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching earnings:", error);
        return;
      }

      setEarningsData(data || {
        total_earnings: 0,
        available_balance: 0,
        total_paid_out: 0,
        total_streams: 0,
        total_tracks: 0,
        pending_payouts: 0
      });
    } catch (error) {
      console.error("Error fetching earnings data:", error);
    }
  };

  const fetchPayoutRequests = async () => {
    if (!user || profile?.role !== 'artist') return;

    try {
      const { data, error } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("artist_id", user.id)
        .order("requested_at", { ascending: false });

      if (error) {
        console.error("Error fetching payout requests:", error);
        return;
      }

      setPayoutRequests(data || []);
    } catch (error) {
      console.error("Error fetching payout requests:", error);
    }
  };

  const fetchEarningsBreakdown = async () => {
    if (!user || profile?.role !== 'artist') return;

    try {
      const { data, error } = await supabase
        .from("earnings")
        .select(`
          track_id,
          earnings_amount,
          region_country,
          tracks!inner(title)
        `)
        .eq("artist_id", user.id);

      if (error) {
        console.error("Error fetching earnings breakdown:", error);
        return;
      }

      // Group by track and aggregate data
      const trackMap = new Map<string, EarningsBreakdown>();
      
      data?.forEach((earning: any) => {
        const trackId = earning.track_id;
        if (!trackMap.has(trackId)) {
          trackMap.set(trackId, {
            track_id: trackId,
            track_title: earning.tracks.title,
            earnings_amount: 0,
            stream_count: 0,
            regions: []
          });
        }

        const track = trackMap.get(trackId)!;
        track.earnings_amount += parseFloat(earning.earnings_amount);
        track.stream_count += 1;
        
        if (earning.region_country && !track.regions.includes(earning.region_country)) {
          track.regions.push(earning.region_country);
        }
      });

      setEarningsBreakdown(Array.from(trackMap.values()));
    } catch (error) {
      console.error("Error fetching earnings breakdown:", error);
    }
  };

  const requestPayout = async (amount: number, paymentMethod: string, paymentDetails: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('process-payout', {
        body: {
          amount,
          payment_method: paymentMethod,
          payment_details: paymentDetails
        }
      });

      if (error) throw error;

      // Refresh data after successful payout request
      await Promise.all([
        fetchEarningsData(),
        fetchPayoutRequests()
      ]);

      return { success: true, data };
    } catch (error) {
      console.error("Error requesting payout:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (user && profile?.role === 'artist') {
      setLoading(true);
      Promise.all([
        fetchEarningsData(),
        fetchPayoutRequests(),
        fetchEarningsBreakdown()
      ]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  return {
    earningsData,
    payoutRequests,
    earningsBreakdown,
    loading,
    requestPayout,
    refreshData: () => {
      Promise.all([
        fetchEarningsData(),
        fetchPayoutRequests(),
        fetchEarningsBreakdown()
      ]);
    }
  };
};