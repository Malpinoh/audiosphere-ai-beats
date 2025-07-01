
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ensureStorageBuckets } from './storage-setup.ts';

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

// Determine the best MIME type for audio files to ensure compatibility
function getCompatibleAudioMimeType(originalType: string, fileName: string): string {
  console.log(`Checking MIME type for: ${fileName}, original type: ${originalType}`);
  
  if (originalType.includes('mp3') || fileName.toLowerCase().endsWith('.mp3')) {
    return 'audio/mpeg';
  }
  
  if (originalType.includes('wav') || fileName.toLowerCase().endsWith('.wav')) {
    return 'audio/wav';
  }
  
  // Default to audio/mpeg for all other formats to ensure compatibility
  return 'audio/mpeg';
}

// Authenticate API key - Updated to use user_id
async function authenticateApiKey(apiKey: string): Promise<{ authenticated: boolean; user_id?: string }> {
  console.log('Authenticating API key...');
  
  if (!apiKey) {
    console.log('No API key provided');
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
      console.log('API key is expired');
      return { authenticated: false };
    }
  
    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('api_key', apiKey);
  
    console.log(`API key authenticated for user: ${data.user_id}`);
    return { authenticated: true, user_id: data.user_id };
  } catch (error) {
    console.error('API key authentication error:', error);
    return { authenticated: false };
  }
}

// Ensure user profile exists
async function ensureUserProfile(userId: string): Promise<boolean> {
  console.log(`Ensuring profile exists for user: ${userId}`);
  
  try {
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing profile:', checkError);
      return false;
    }

    if (existingProfile) {
      console.log('Profile already exists');
      return true;
    }

    console.log('Profile does not exist, creating new profile...');
    
    // Profile doesn't exist, get user data from auth.users and create profile
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return false;
    }

    // Create profile for the user
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: user.email?.split('@')[0] || 'admin',
        full_name: user.user_metadata?.full_name || 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return false;
    }

    console.log(`Profile created successfully for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    return false;
  }
}

// Handle form data parsing and file upload with comprehensive error handling
async function handleFormData(formData: FormData, userId: string) {
  console.log('Starting upload process...');
  
  // Ensure storage buckets exist
  const bucketsReady = await ensureStorageBuckets(supabase);
  if (!bucketsReady) {
    console.warn('Storage buckets may not be properly configured');
  }

  // Ensure user profile exists before proceeding
  const profileExists = await ensureUserProfile(userId);
  if (!profileExists) {
    throw new Error('Failed to create or verify user profile');
  }

  // Extract and validate required fields
  const title = formData.get('title') as string;
  const artist = formData.get('artist') as string;
  const genre = formData.get('genre') as string;
  const mood = formData.get('mood') as string;
  const description = formData.get('description') as string || null;
  const lyrics = formData.get('lyrics') as string || null;
  
  console.log(`Processing upload: "${title}" by ${artist}`);
  
  // New fields for track types
  const trackType = formData.get('track_type') as string || 'single';
  const albumName = formData.get('album_name') as string || null;
  const trackNumber = formData.get('track_number') ? parseInt(formData.get('track_number') as string) : null;
  const totalTracks = formData.get('total_tracks') ? parseInt(formData.get('total_tracks') as string) : null;
  
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
      tags = tagsField.split(',').map(tag => tag.trim());
    }
  }
  
  // Validate required fields
  if (!title || !artist || !genre || !mood) {
    throw new Error('Missing required fields: title, artist, genre, and mood are required');
  }
  
  // Validate track type
  if (!['single', 'ep', 'album'].includes(trackType)) {
    throw new Error('Invalid track type. Must be single, ep, or album');
  }
  
  // Get the audio file
  const audioFile = formData.get('audio_file') as File;
  if (!audioFile) {
    throw new Error('Missing audio file');
  }
  
  console.log(`Audio file: ${audioFile.name}, size: ${audioFile.size} bytes`);
  
  // Enhanced file size validation - increased to 100MB
  const maxAudioSize = 100 * 1024 * 1024; // 100MB
  if (audioFile.size > maxAudioSize) {
    throw new Error('Audio file size exceeds 100MB limit');
  }
  
  // Validate and determine compatible audio MIME type
  const compatibleMimeType = getCompatibleAudioMimeType(audioFile.type, audioFile.name);
  console.log(`Using MIME type: ${compatibleMimeType}`);
  
  // Get the cover art
  const coverArt = formData.get('cover_art') as File;
  if (!coverArt) {
    throw new Error('Missing cover art');
  }
  
  console.log(`Cover art: ${coverArt.name}, size: ${coverArt.size} bytes`);
  
  // Validate cover art file type and size
  const coverArtType = coverArt.type;
  if (!['image/jpeg', 'image/png', 'image/jpg'].includes(coverArtType)) {
    throw new Error('Invalid cover art file type. Only JPG and PNG files are supported');
  }
  
  const maxCoverArtSize = 10 * 1024 * 1024; // 10MB
  if (coverArt.size > maxCoverArtSize) {
    throw new Error('Cover art file size exceeds 10MB limit');
  }
  
  // Create unique filenames with better structure
  const timestamp = Date.now();
  const audioExtension = compatibleMimeType === 'audio/mpeg' ? '.mp3' : '.wav';
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\-_]/g, '-').toLowerCase();
  const sanitizedArtist = artist.replace(/[^a-zA-Z0-9\-_]/g, '-').toLowerCase();
  
  const audioFileName = `${timestamp}-${sanitizedArtist}-${sanitizedTitle}${audioExtension}`;
  const coverArtFileName = `${timestamp}-${sanitizedArtist}-${sanitizedTitle}-cover.${coverArtType.split('/')[1]}`;
  
  console.log(`Generated filenames - Audio: ${audioFileName}, Cover: ${coverArtFileName}`);
  
  // Upload audio file with compatible MIME type
  console.log('Uploading audio file...');
  const audioBuffer = await audioFile.arrayBuffer();
  const { data: audioUploadData, error: audioUploadError } = await supabase.storage
    .from('audio_files')
    .upload(audioFileName, audioBuffer, {
      contentType: compatibleMimeType,
      cacheControl: '3600',
      upsert: false
    });
  
  if (audioUploadError) {
    console.error('Audio upload error:', audioUploadError);
    throw new Error(`Failed to upload audio file: ${audioUploadError.message}`);
  }
  
  console.log(`Audio uploaded successfully: ${audioFileName}`);
  
  // Upload cover art
  console.log('Uploading cover art...');
  const coverArtBuffer = await coverArt.arrayBuffer();
  const { data: coverUploadData, error: coverArtUploadError } = await supabase.storage
    .from('cover_art')
    .upload(coverArtFileName, coverArtBuffer, {
      contentType: coverArtType,
      cacheControl: '3600',
      upsert: false
    });
  
  if (coverArtUploadError) {
    console.error('Cover art upload error:', coverArtUploadError);
    
    // Clean up uploaded audio file
    await supabase.storage.from('audio_files').remove([audioFileName]);
    
    throw new Error(`Failed to upload cover art: ${coverArtUploadError.message}`);
  }

  console.log(`Cover art uploaded successfully: ${coverArtFileName}`);

  // Get audio file duration
  let duration = null;
  if (formData.get('duration')) {
    duration = parseInt(formData.get('duration') as string, 10);
  }
  
  // Create or get artist profile
  let artistProfileId = null;
  try {
    const { data: profileData, error: profileError } = await supabase
      .rpc('create_artist_profile_if_not_exists', { artist_name: artist });
    
    if (profileError) {
      console.error('Error creating artist profile:', profileError);
    } else {
      artistProfileId = profileData;
      console.log(`Artist profile ID: ${artistProfileId}`);
    }
  } catch (error) {
    console.error('Error creating artist profile:', error);
  }
  
  // Insert track into database
  console.log('Saving track to database...');
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
      artist_profile_id: artistProfileId,
      track_type: trackType,
      album_name: albumName,
      track_number: trackNumber,
      total_tracks: totalTracks,
    })
    .select()
    .single();
  
  if (trackInsertError) {
    console.error('Track insert error:', trackInsertError);
    
    // Clean up uploaded files if database insert fails
    await supabase.storage.from('audio_files').remove([audioFileName]);
    await supabase.storage.from('cover_art').remove([coverArtFileName]);
    
    throw new Error(`Failed to save track metadata: ${trackInsertError.message}`);
  }
  
  console.log(`Track saved successfully with ID: ${track.id}`);
  
  // Generate public URLs for verification
  const audioUrl = `${supabaseUrl}/storage/v1/object/public/audio_files/${audioFileName}`;
  const coverUrl = `${supabaseUrl}/storage/v1/object/public/cover_art/${coverArtFileName}`;
  
  console.log(`Audio URL: ${audioUrl}`);
  console.log(`Cover URL: ${coverUrl}`);
  
  return {
    track,
    artist_profile_created: !!artistProfileId,
    audio_file_url: audioUrl,
    cover_art_url: coverUrl
  };
}

// Main serve function
serve(async (req) => {
  console.log(`${req.method} request received at ${new Date().toISOString()}`);
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  try {
    // Extract API key from header
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      console.log('No API key provided in request');
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Authenticate API key
    const { authenticated, user_id } = await authenticateApiKey(apiKey);
    if (!authenticated || !user_id) {
      console.log('API key authentication failed');
      return new Response(JSON.stringify({ error: 'Invalid or expired API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse form data
    console.log('Parsing form data...');
    const formData = await req.formData();
    
    // Process upload
    const result = await handleFormData(formData, user_id);
    
    console.log('Upload completed successfully');
    
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
    
    // Return detailed error response
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'An error occurred while processing your request',
      error: error.toString(),
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
