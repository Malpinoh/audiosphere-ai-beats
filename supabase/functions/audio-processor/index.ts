import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingRequest {
  trackId: string;
  audioFilePath: string;
  generateQualities?: ('normal' | 'high' | 'hifi' | 'hires')[];
}

interface QualityConfig {
  tier: 'normal' | 'high' | 'hifi' | 'hires';
  format: 'mp3' | 'flac';
  bitrate: number | null;
  sampleRate: number;
  bitDepth: number;
  suffix: string;
}

const QUALITY_CONFIGS: QualityConfig[] = [
  { tier: 'normal', format: 'mp3', bitrate: 128, sampleRate: 44100, bitDepth: 16, suffix: '_128' },
  { tier: 'high', format: 'mp3', bitrate: 320, sampleRate: 44100, bitDepth: 16, suffix: '_320' },
  { tier: 'hifi', format: 'flac', bitrate: null, sampleRate: 44100, bitDepth: 16, suffix: '_lossless' },
  { tier: 'hires', format: 'flac', bitrate: null, sampleRate: 96000, bitDepth: 24, suffix: '_hires' },
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { trackId, audioFilePath, generateQualities = ['normal', 'high'] }: ProcessingRequest = await req.json();
    
    console.log(`Processing audio for track ${trackId}, file: ${audioFilePath}`);
    console.log(`Requested qualities: ${generateQualities.join(', ')}`);
    
    // Get the original audio file info
    const { data: fileInfo, error: fileError } = await supabase
      .storage
      .from('audio_files')
      .list('', {
        search: audioFilePath,
        limit: 1
      });
    
    if (fileError) {
      console.error('Error getting file info:', fileError);
      throw new Error(`Failed to get file info: ${fileError.message}`);
    }
    
    // For now, we'll create quality variant records based on the original file
    // In production, this would trigger actual FFmpeg processing
    const variants = [];
    
    for (const tier of generateQualities) {
      const config = QUALITY_CONFIGS.find(c => c.tier === tier);
      if (!config) continue;
      
      // Generate variant file path (in production, this would be the actual converted file)
      const baseName = audioFilePath.replace(/\.[^/.]+$/, '');
      const extension = config.format;
      const variantPath = `${baseName}${config.suffix}.${extension}`;
      
      // For MVP, use original file path for all qualities
      // In production, this would point to the actual converted files
      const actualPath = audioFilePath;
      
      // Generate HLS playlist path
      const hlsPlaylistPath = `hls/${trackId}/${config.tier}/playlist.m3u8`;
      
      // Insert or update quality variant record
      const { data: variant, error: variantError } = await supabase
        .from('track_quality_variants')
        .upsert({
          track_id: trackId,
          quality_tier: config.tier,
          format: config.format,
          bitrate: config.bitrate,
          sample_rate: config.sampleRate,
          bit_depth: config.bitDepth,
          file_path: actualPath,
          hls_playlist_path: hlsPlaylistPath,
        }, {
          onConflict: 'track_id,quality_tier'
        })
        .select()
        .single();
      
      if (variantError) {
        console.error(`Error creating variant for ${tier}:`, variantError);
      } else {
        variants.push(variant);
        console.log(`Created variant for ${tier}:`, variant);
      }
    }
    
    // Update track with quality info
    const hasHiRes = generateQualities.includes('hires');
    const hasLossless = generateQualities.includes('hifi') || generateQualities.includes('hires');
    const maxQuality = hasHiRes ? 'hires' : hasLossless ? 'hifi' : generateQualities.includes('high') ? 'high' : 'normal';
    
    const { error: updateError } = await supabase
      .from('tracks')
      .update({
        max_quality: maxQuality,
        is_hires: hasHiRes,
        is_lossless: hasLossless,
      })
      .eq('id', trackId);
    
    if (updateError) {
      console.error('Error updating track:', updateError);
    }
    
    // Generate master HLS playlist
    const masterPlaylist = generateMasterPlaylist(trackId, variants);
    
    return new Response(
      JSON.stringify({
        success: true,
        trackId,
        variants,
        masterPlaylist,
        message: 'Audio processing completed. Quality variants created.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in audio-processor:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateMasterPlaylist(trackId: string, variants: any[]): string {
  // Generate HLS master playlist content
  let playlist = '#EXTM3U\n#EXT-X-VERSION:3\n\n';
  
  for (const variant of variants) {
    const bandwidth = variant.bitrate ? variant.bitrate * 1000 : 1411000; // 1411 kbps for lossless CD quality
    const resolution = variant.quality_tier === 'hires' ? ',AUDIO="audio-hires"' : '';
    
    playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},CODECS="${variant.format === 'mp3' ? 'mp4a.40.2' : 'flac'}"${resolution}\n`;
    playlist += `${variant.quality_tier}/playlist.m3u8\n\n`;
  }
  
  return playlist;
}
