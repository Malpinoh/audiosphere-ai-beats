import { useState, useEffect, useCallback, useRef } from "react";
import Hls from "hls.js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AudioQualityTier = 'normal' | 'high' | 'hifi' | 'hires' | 'auto';

interface QualityVariant {
  quality_tier: AudioQualityTier;
  format: string;
  bitrate: number | null;
  sample_rate: number;
  bit_depth: number;
  file_path: string;
  hls_playlist_path: string | null;
  display_name: string;
}

interface StreamInfo {
  currentQuality: AudioQualityTier;
  currentBitrate: number;
  isAdaptive: boolean;
  availableQualities: AudioQualityTier[];
  isBuffering: boolean;
  bufferHealth: number;
}

interface AdaptiveStreamingOptions {
  trackId: string;
  audioElement: HTMLAudioElement | null;
  preferredQuality?: AudioQualityTier;
  onQualityChange?: (quality: AudioQualityTier) => void;
}

export function useAdaptiveStreaming({
  trackId,
  audioElement,
  preferredQuality = 'auto',
  onQualityChange,
}: AdaptiveStreamingOptions) {
  const { user } = useAuth();
  const hlsRef = useRef<Hls | null>(null);
  const [streamInfo, setStreamInfo] = useState<StreamInfo>({
    currentQuality: 'normal',
    currentBitrate: 128000,
    isAdaptive: false,
    availableQualities: ['normal'],
    isBuffering: false,
    bufferHealth: 0,
  });
  const [qualityVariants, setQualityVariants] = useState<QualityVariant[]>([]);
  const bandwidthEstimateRef = useRef<number>(1000000); // 1 Mbps default

  // Fetch available quality variants for the track
  const fetchQualityVariants = useCallback(async () => {
    if (!trackId) return;

    try {
      const { data, error } = await supabase.rpc('get_track_qualities', {
        p_track_id: trackId
      });

      if (error) {
        console.error('Error fetching quality variants:', error);
        return;
      }

      if (data && data.length > 0) {
        setQualityVariants(data);
        setStreamInfo(prev => ({
          ...prev,
          availableQualities: ['auto', ...data.map((v: QualityVariant) => v.quality_tier)],
        }));
      }
    } catch (error) {
      console.error('Error in fetchQualityVariants:', error);
    }
  }, [trackId]);

  // Estimate network bandwidth
  const estimateBandwidth = useCallback(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      const downlink = connection.downlink * 1000000; // Convert Mbps to bps
      bandwidthEstimateRef.current = downlink;
      return downlink;
    }
    return bandwidthEstimateRef.current;
  }, []);

  // Select best quality based on bandwidth
  const selectOptimalQuality = useCallback((bandwidth: number): AudioQualityTier => {
    // Quality thresholds (in bps)
    const thresholds = {
      hires: 5000000,  // 5 Mbps for Hi-Res
      hifi: 2000000,   // 2 Mbps for Hi-Fi/Lossless
      high: 500000,    // 500 kbps for High (320kbps MP3)
      normal: 200000,  // 200 kbps for Normal (128kbps MP3)
    };

    const availableQualities = streamInfo.availableQualities.filter(q => q !== 'auto');

    if (bandwidth >= thresholds.hires && availableQualities.includes('hires')) {
      return 'hires';
    } else if (bandwidth >= thresholds.hifi && availableQualities.includes('hifi')) {
      return 'hifi';
    } else if (bandwidth >= thresholds.high && availableQualities.includes('high')) {
      return 'high';
    } else {
      return 'normal';
    }
  }, [streamInfo.availableQualities]);

  // Initialize HLS.js for adaptive streaming
  const initializeHls = useCallback((hlsUrl: string) => {
    if (!audioElement || !Hls.isSupported()) {
      console.log('HLS not supported or no audio element');
      return false;
    }

    // Clean up existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 90,
      maxBufferLength: 30,
      maxMaxBufferLength: 600,
      startLevel: -1, // Auto-select initial quality
      abrEwmaDefaultEstimate: bandwidthEstimateRef.current,
    });

    hls.loadSource(hlsUrl);
    hls.attachMedia(audioElement);

    // Handle quality level changes
    hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      const level = hls.levels[data.level];
      if (level) {
        const bitrate = level.bitrate;
        let qualityTier: AudioQualityTier = 'normal';
        
        if (bitrate >= 1400000) qualityTier = 'hires';
        else if (bitrate >= 800000) qualityTier = 'hifi';
        else if (bitrate >= 300000) qualityTier = 'high';
        
        setStreamInfo(prev => ({
          ...prev,
          currentQuality: qualityTier,
          currentBitrate: bitrate,
          isAdaptive: true,
        }));
        
        onQualityChange?.(qualityTier);
      }
    });

    // Handle buffer events
    hls.on(Hls.Events.FRAG_BUFFERED, () => {
      const buffered = audioElement.buffered;
      if (buffered.length > 0) {
        const currentTime = audioElement.currentTime;
        const bufferedEnd = buffered.end(buffered.length - 1);
        const bufferHealth = bufferedEnd - currentTime;
        
        setStreamInfo(prev => ({
          ...prev,
          bufferHealth,
          isBuffering: bufferHealth < 2,
        }));
      }
    });

    // Handle bandwidth estimation updates
    hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
      const stats = data.frag.stats;
      if (stats.loaded && stats.loading.end) {
        const duration = stats.loading.end - stats.loading.start;
        const bandwidth = (stats.loaded * 8) / (duration / 1000);
        bandwidthEstimateRef.current = bandwidth;
      }
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('HLS error:', data);
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            hls.destroy();
            break;
        }
      }
    });

    hlsRef.current = hls;
    return true;
  }, [audioElement, onQualityChange]);

  // Set quality manually
  const setQuality = useCallback((quality: AudioQualityTier) => {
    if (quality === 'auto') {
      // Re-enable adaptive bitrate
      if (hlsRef.current) {
        hlsRef.current.currentLevel = -1; // Auto
      }
      setStreamInfo(prev => ({ ...prev, isAdaptive: true }));
    } else {
      // Find and set specific quality level
      const variant = qualityVariants.find(v => v.quality_tier === quality);
      if (variant && audioElement) {
        // For non-HLS playback, directly set the source
        const audioUrl = getAudioUrl(variant.file_path);
        
        // Store current time
        const currentTime = audioElement.currentTime;
        const wasPlaying = !audioElement.paused;
        
        // Set new source
        audioElement.src = audioUrl;
        audioElement.currentTime = currentTime;
        
        if (wasPlaying) {
          audioElement.play();
        }
        
        setStreamInfo(prev => ({
          ...prev,
          currentQuality: quality,
          currentBitrate: variant.bitrate ? variant.bitrate * 1000 : 1411000,
          isAdaptive: false,
        }));
        
        onQualityChange?.(quality);
      }
    }
  }, [qualityVariants, audioElement, onQualityChange]);

  // Get audio URL from file path
  const getAudioUrl = (filePath: string): string => {
    if (filePath.startsWith('http')) return filePath;
    const { data } = supabase.storage.from('audio_files').getPublicUrl(filePath);
    return data?.publicUrl || '';
  };

  // Update on preferred quality change
  useEffect(() => {
    if (preferredQuality !== 'auto') {
      setQuality(preferredQuality);
    }
  }, [preferredQuality, setQuality]);

  // Monitor connection changes
  useEffect(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      const handleChange = () => {
        const bandwidth = estimateBandwidth();
        if (streamInfo.isAdaptive) {
          const optimalQuality = selectOptimalQuality(bandwidth);
          if (optimalQuality !== streamInfo.currentQuality) {
            onQualityChange?.(optimalQuality);
          }
        }
      };

      connection.addEventListener('change', handleChange);
      return () => connection.removeEventListener('change', handleChange);
    }
  }, [estimateBandwidth, selectOptimalQuality, streamInfo.isAdaptive, streamInfo.currentQuality, onQualityChange]);

  // Fetch variants on mount and track change
  useEffect(() => {
    fetchQualityVariants();
  }, [fetchQualityVariants]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  return {
    streamInfo,
    qualityVariants,
    setQuality,
    initializeHls,
    getAudioUrl,
  };
}
