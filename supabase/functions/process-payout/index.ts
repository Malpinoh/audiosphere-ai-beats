import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Authentication failed");

    const { amount, payment_method, payment_details } = await req.json();

    // Validate artist role
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "artist") {
      throw new Error("Only artists can request payouts");
    }

    // Check available balance
    const { data: earnings } = await supabaseClient
      .from("artist_earnings_summary")
      .select("available_balance, total_earnings")
      .eq("artist_id", user.id)
      .single();

    if (!earnings || earnings.available_balance < amount) {
      throw new Error("Insufficient balance for payout");
    }

    // Get minimum payout threshold
    const { data: rates } = await supabaseClient
      .from("royalty_rates")
      .select("minimum_payout")
      .eq("tier_name", "Basic")
      .single();

    if (amount < (rates?.minimum_payout || 10)) {
      throw new Error(`Minimum payout amount is $${rates?.minimum_payout || 10}`);
    }

    // Create payout request
    const { data: payoutRequest, error: payoutError } = await supabaseClient
      .from("payout_requests")
      .insert({
        artist_id: user.id,
        amount,
        payment_method,
        payment_details,
        status: "pending"
      })
      .select()
      .single();

    if (payoutError) throw payoutError;

    console.log(`Payout request created: ${payoutRequest.id} for $${amount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        payout_id: payoutRequest.id,
        message: "Payout request submitted successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Payout processing error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});