
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Setting up storage buckets...');

    // Check and create audio_files bucket
    const { data: audioBucket, error: audioCheckError } = await supabase.storage.getBucket('audio_files');
    
    if (!audioBucket) {
      console.log('Creating audio_files bucket...');
      const { error: audioCreateError } = await supabase.storage.createBucket('audio_files', {
        public: true,
        allowedMimeTypes: ['audio/*'],
        fileSizeLimit: 104857600 // 100MB
      });
      
      if (audioCreateError) {
        console.error('Error creating audio_files bucket:', audioCreateError);
        throw audioCreateError;
      }
      console.log('audio_files bucket created successfully');
    } else {
      console.log('audio_files bucket already exists');
    }

    // Check and create cover_art bucket
    const { data: coverBucket, error: coverCheckError } = await supabase.storage.getBucket('cover_art');
    
    if (!coverBucket) {
      console.log('Creating cover_art bucket...');
      const { error: coverCreateError } = await supabase.storage.createBucket('cover_art', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (coverCreateError) {
        console.error('Error creating cover_art bucket:', coverCreateError);
        throw coverCreateError;
      }
      console.log('cover_art bucket created successfully');
    } else {
      console.log('cover_art bucket already exists');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Storage buckets configured successfully',
      buckets: {
        audio_files: 'Ready',
        cover_art: 'Ready'
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error setting up storage:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to setup storage buckets',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
