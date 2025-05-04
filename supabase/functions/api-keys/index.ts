
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

// Create a Supabase client
const supabaseUrl = 'https://qkpjlfcpncvvjyzfolag.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate a secure API key
function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const length = 32;
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// Main serve function
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  // Get the current user from the JWT token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const userId = user.id;
  
  // Check if user is an artist or admin - this is critical for RLS
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: 'User profile not found' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Verify the user has appropriate role for API keys
  if (!['artist', 'distributor', 'admin'].includes(profile.role)) {
    return new Response(JSON.stringify({ error: 'User does not have permission to manage API keys' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Handle different API endpoints
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();
  
  // List API keys
  if (req.method === 'GET') {
    const { data: apiKeys, error: listError } = await supabase
      .from('api_keys')
      .select('id, api_key, name, active, created_at, expires_at, last_used_at')
      .eq('user_id', userId);
    
    if (listError) {
      return new Response(JSON.stringify({ error: 'Failed to retrieve API keys' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ apiKeys }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Create new API key
  if (req.method === 'POST') {
    try {
      const data = await req.json();
      const keyName = data.name || 'API Key';
      
      // Optional expiration date (default is no expiration)
      let expiresAt = null;
      if (data.expires_in_days) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + data.expires_in_days);
        expiresAt = expirationDate.toISOString();
      }
      
      // Generate a new API key
      const apiKey = generateApiKey();
      
      // Save the API key
      const { data: newKey, error: createError } = await supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          api_key: apiKey,
          name: keyName,
          active: true,
          expires_at: expiresAt,
        })
        .select()
        .single();
      
      if (createError) {
        return new Response(JSON.stringify({ error: 'Failed to create API key' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        message: 'API key created successfully', 
        apiKey: newKey 
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
  
  // Delete API key
  if (req.method === 'DELETE' && path) {
    const keyId = path;
    
    // Verify the key belongs to this user
    const { data: keyData, error: keyCheckError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('id', keyId)
      .eq('user_id', userId)
      .single();
    
    if (keyCheckError || !keyData) {
      return new Response(JSON.stringify({ error: 'API key not found or not authorized' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Delete the key
    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId);
    
    if (deleteError) {
      return new Response(JSON.stringify({ error: 'Failed to delete API key' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ message: 'API key deleted successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  // Unknown endpoint
  return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
