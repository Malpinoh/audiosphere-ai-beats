
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { analyzeMusicContent } from './audio-analysis.ts';

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Create a Supabase client
const supabaseUrl = 'https://qkpjlfcpncvvjyzfolag.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Authenticate API key - Updated to use user_id
async function authenticateApiKey(apiKey: string): Promise<{ authenticated: boolean; user_id?: string }> {
  if (!apiKey) {
    return { authenticated: false };
  }

  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('user_id, active, expires_at')
      .eq('api_key', apiKey)
      .eq('active', true)
      .single();
  
    if (error || !data) {
      console.error('API key authentication error:', error);
      return { authenticated: false };
    }
  
    // Check if API key is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { authenticated: false };
    }
  
    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('api_key', apiKey);
  
    return { authenticated: true, user_id: data.user_id };
  } catch (error) {
    console.error('API key authentication error:', error);
    return { authenticated: false };
  }
}

// Handle form data parsing and file upload - Updated to use userId
async function handleFormData(formData: FormData, userId: string) {
  // Extract and validate required fields
  const title = formData.get('title') as string;
  const artist = formData.get('artist') as string;
  const genre = formData.get('genre') as string;
  const mood = formData.get('mood') as string;
  const description = formData.get('description') as string || null;
  const lyrics = formData.get('lyrics') as string || null;
  
  // Parse tags array
  let tags: string[] = [];
  const tagsField = formData.get('tags') as string;
  if (tagsField) {
    try {
      tags = JSON.parse(tagsField);
      if (!Array.isArray(tags)) {
        tags = [tagsField];
      }
    } catch {
      // If JSON parsing fails, treat it as a comma-separated string
      tags = tagsField.split(',').map(tag => tag.trim());
    }
  }
  
  // Validate required fields
  if (!title || !artist || !genre || !mood) {
    throw new Error('Missing required fields: title, artist, genre, and mood are required');
  }
  
  // Get the audio file
  const audioFile = formData.get('audio_file') as File;
  if (!audioFile) {
    throw new Error('Missing audio file');
  }
  
  // Validate audio file type
  const audioFileType = audioFile.type;
  if (!['audio/mpeg', 'audio/wav'].includes(audioFileType)) {
    throw new Error('Invalid audio file type. Only MP3 and WAV files are supported');
  }
  
  // Get the cover art
  const coverArt = formData.get('cover_art') as File;
  if (!coverArt) {
    throw new Error('Missing cover art');
  }
  
  // Validate cover art file type
  const coverArtType = coverArt.type;
  if (!['image/jpeg', 'image/png', 'image/jpg'].includes(coverArtType)) {
    throw new Error('Invalid cover art file type. Only JPG and PNG files are supported');
  }
  
  // Create unique filenames
  const audioFileName = `${userId}/${Date.now()}-${audioFile.name.replace(/\s+/g, '-')}`;
  const coverArtFileName = `${userId}/${Date.now()}-${coverArt.name.replace(/\s+/g, '-')}`;
  
  // Upload audio file
  const audioBuffer = await audioFile.arrayBuffer();
  const { error: audioUploadError } = await supabase.storage
    .from('audio_files')
    .upload(audioFileName, audioBuffer, {
      contentType: audioFileType,
      cacheControl: '3600',
    });
  
  if (audioUploadError) {
    console.error('Audio upload error:', audioUploadError);
    throw new Error(`Failed to upload audio file: ${audioUploadError.message}`);
  }
  
  // Upload cover art
  const coverArtBuffer = await coverArt.arrayBuffer();
  const { error: coverArtUploadError } = await supabase.storage
    .from('cover_art')
    .upload(coverArtFileName, coverArtBuffer, {
      contentType: coverArtType,
      cacheControl: '3600',
    });
  
  if (coverArtUploadError) {
    console.error('Cover art upload error:', coverArtUploadError);
    throw new Error(`Failed to upload cover art: ${coverArtUploadError.message}`);
  }

  // If AI analysis is requested, analyze the audio file
  let analyzedData = { genre, mood, suggestedTags: tags };
  const useAiAnalysis = formData.get('use_ai_analysis') === 'true';
  
  if (useAiAnalysis) {
    try {
      // Analyze audio content
      analyzedData = await analyzeMusicContent(audioFile, lyrics);
      
      // Override values only if requested
      if (formData.get('override_genre') === 'true') {
        genre = analyzedData.genre;
      }
      
      if (formData.get('override_mood') === 'true') {
        mood = analyzedData.mood;
      }
      
      if (formData.get('override_tags') === 'true' || tags.length === 0) {
        tags = analyzedData.suggestedTags;
      } else {
        // Merge with existing tags
        tags = [...new Set([...tags, ...analyzedData.suggestedTags])];
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      // Continue without AI analysis
    }
  }
  
  // Get audio file duration
  let duration = null;
  if (formData.get('duration')) {
    duration = parseInt(formData.get('duration') as string, 10);
  }
  
  // Insert track into database
  const { data: track, error: trackInsertError } = await supabase
    .from('tracks')
    .insert({
      title,
      artist,
      user_id: userId,
      genre,
      mood,
      tags,
      audio_file_path: audioFileName,
      cover_art_path: coverArtFileName,
      description,
      lyrics,
      duration,
      published: formData.get('published') === 'true',
    })
    .select()
    .single();
  
  if (trackInsertError) {
    console.error('Track insert error:', trackInsertError);
    throw new Error(`Failed to save track metadata: ${trackInsertError.message}`);
  }
  
  // Return track data with analyzed info
  return {
    track,
    analyzed_data: analyzedData,
  };
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
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  try {
    // Extract API key from header
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Authenticate API key
    const { authenticated, user_id } = await authenticateApiKey(apiKey);
    if (!authenticated || !user_id) {
      return new Response(JSON.stringify({ error: 'Invalid or expired API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse form data
    const formData = await req.formData();
    
    // Process upload
    const result = await handleFormData(formData, user_id);
    
    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Track uploaded successfully',
      data: result,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Return error response
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'An error occurred while processing your request',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
