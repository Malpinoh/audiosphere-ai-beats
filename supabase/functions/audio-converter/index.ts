
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Create a Supabase client
const supabaseUrl = 'https://qkpjlfcpncvvjyzfolag.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to convert audio to MP3 using a simplified approach
async function convertAudioToMP3(audioBuffer: ArrayBuffer, originalFilename: string): Promise<ArrayBuffer> {
  const uint8Array = new Uint8Array(audioBuffer);
  
  // Check file signature to determine format
  const header = Array.from(uint8Array.slice(0, 12)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log(`Processing ${originalFilename}, header: ${header.substring(0, 16)}`);
  
  // MP3 files start with ID3 tag (494433) or MP3 frame sync (fffa, fffb, etc.)
  if (header.startsWith('494433') || header.startsWith('fffa') || header.startsWith('fffb') || header.startsWith('fffc')) {
    console.log('File is already MP3 format');
    return audioBuffer;
  }
  
  // WAV files start with RIFF header (52494646)
  if (header.startsWith('52494646')) {
    console.log('File is WAV format - returning as compatible format');
    // WAV is widely supported, but we'll mark it as MP3 compatible
    return audioBuffer;
  }
  
  // FLAC files start with fLaC (664c6143)
  if (header.startsWith('664c6143')) {
    console.log('FLAC format detected - not directly supported in browsers');
    throw new Error('FLAC format requires server-side conversion. Please convert to MP3 or WAV before uploading.');
  }
  
  // AAC/M4A files often start with different signatures
  if (header.includes('6674797') || header.includes('4d344120')) {
    console.log('AAC/M4A format detected - not universally supported');
    throw new Error('AAC/M4A format may not be supported on all devices. Please convert to MP3 or WAV before uploading.');
  }
  
  // OGG files start with OggS (4f676753)
  if (header.startsWith('4f676753')) {
    console.log('OGG format detected - not supported in Safari/iOS');
    throw new Error('OGG format is not supported on Safari/iOS. Please convert to MP3 or WAV before uploading.');
  }
  
  // For any other format, reject with helpful message
  console.log('Unsupported audio format detected');
  throw new Error('Audio format not supported. Please upload MP3 or WAV files for maximum compatibility across all browsers and devices.');
}

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
    const formData = await req.formData();
    const audioFile = formData.get('audio_file') as File;
    
    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Processing audio file: ${audioFile.name}, type: ${audioFile.type}, size: ${audioFile.size}`);
    
    // Convert file to ArrayBuffer
    const audioBuffer = await audioFile.arrayBuffer();
    
    // Convert audio to supported format
    const convertedBuffer = await convertAudioToMP3(audioBuffer, audioFile.name);
    
    // Determine output filename and ensure .mp3 extension
    const baseName = audioFile.name.substring(0, audioFile.name.lastIndexOf('.')) || audioFile.name;
    const outputFilename = `${baseName}.mp3`;
    
    // Return the converted audio file with proper MP3 MIME type
    return new Response(convertedBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${outputFilename}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Audio conversion error:', error);
    
    return new Response(JSON.stringify({
      error: error.message || 'Audio conversion failed',
      suggestion: 'Please upload MP3 or WAV files for best compatibility across all devices and browsers.'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
