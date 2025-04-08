
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client
const supabaseUrl = 'https://qkpjlfcpncvvjyzfolag.supabase.co'
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    const { ip } = await req.json()
    
    if (!ip) {
      return new Response(
        JSON.stringify({ error: 'IP address is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Use ipinfo.io to get geolocation data
    // Note: Free tier has limits, consider upgrading for production
    const response = await fetch(`https://ipinfo.io/${ip}/json`)
    const data = await response.json()

    // Create a simplified response with the key location data
    const locationData = {
      ip,
      country: data.country || 'Unknown',
      region: data.region || 'Unknown',
      city: data.city || 'Unknown',
      loc: data.loc || '',
      timezone: data.timezone || '',
    }

    // Return the geolocation data
    return new Response(
      JSON.stringify(locationData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing request:', error)
    
    return new Response(
      JSON.stringify({ error: 'Failed to get location data' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
