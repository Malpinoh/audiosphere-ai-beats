import { useRef, useCallback, useEffect, useState } from 'react';

export interface EqBand {
  frequency: number;
  label: string;
  gain: number;
}

const DEFAULT_BANDS: EqBand[] = [
  { frequency: 60, label: '60Hz', gain: 0 },
  { frequency: 230, label: '230Hz', gain: 0 },
  { frequency: 910, label: '910Hz', gain: 0 },
  { frequency: 4000, label: '4kHz', gain: 0 },
  { frequency: 14000, label: '14kHz', gain: 0 },
];

export const EQ_PRESETS: Record<string, number[]> = {
  'Flat': [0, 0, 0, 0, 0],
  'Bass Boost': [6, 4, 0, -1, -1],
  'Vocal': [-1, 0, 4, 3, 1],
  'Electronic': [4, 2, -2, 3, 5],
  'Acoustic': [2, 0, 1, 2, 3],
  'Rock': [4, 2, -1, 2, 4],
};

export function useAudioEngine(audioRef: React.RefObject<HTMLAudioElement>) {
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const connectedRef = useRef(false);
  const [bands, setBands] = useState<EqBand[]>(DEFAULT_BANDS);
  const [eqEnabled, setEqEnabled] = useState(false);
  const [currentPreset, setCurrentPreset] = useState('Flat');

  const initContext = useCallback(() => {
    if (contextRef.current) return contextRef.current;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    contextRef.current = ctx;
    return ctx;
  }, []);

  const connectAudioGraph = useCallback(() => {
    if (connectedRef.current || !audioRef.current) return;
    
    try {
      const ctx = initContext();
      
      // Resume context if suspended (needed after user gesture)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceRef.current = source;

      // Create 5-band EQ
      const filters = DEFAULT_BANDS.map((band, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = i === 0 ? 'lowshelf' : i === DEFAULT_BANDS.length - 1 ? 'highshelf' : 'peaking';
        filter.frequency.value = band.frequency;
        filter.gain.value = 0;
        if (filter.type === 'peaking') {
          filter.Q.value = 1.4;
        }
        return filter;
      });
      filtersRef.current = filters;

      // Gain node for normalization
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.0;
      gainNodeRef.current = gainNode;

      // Connect chain: source -> filters -> gain -> destination
      let lastNode: AudioNode = source;
      filters.forEach(filter => {
        lastNode.connect(filter);
        lastNode = filter;
      });
      lastNode.connect(gainNode);
      gainNode.connect(ctx.destination);

      connectedRef.current = true;
    } catch (err) {
      console.error('Failed to initialize audio engine:', err);
    }
  }, [audioRef, initContext]);

  const setEqBand = useCallback((index: number, gain: number) => {
    if (filtersRef.current[index]) {
      filtersRef.current[index].gain.value = eqEnabled ? gain : 0;
    }
    setBands(prev => prev.map((band, i) => i === index ? { ...band, gain } : band));
  }, [eqEnabled]);

  const applyPreset = useCallback((presetName: string) => {
    const preset = EQ_PRESETS[presetName];
    if (!preset) return;
    setCurrentPreset(presetName);
    preset.forEach((gain, i) => {
      if (filtersRef.current[i]) {
        filtersRef.current[i].gain.value = eqEnabled ? gain : 0;
      }
    });
    setBands(prev => prev.map((band, i) => ({ ...band, gain: preset[i] || 0 })));
  }, [eqEnabled]);

  const toggleEq = useCallback((enabled: boolean) => {
    setEqEnabled(enabled);
    filtersRef.current.forEach((filter, i) => {
      filter.gain.value = enabled ? bands[i].gain : 0;
    });
  }, [bands]);

  const setNormalization = useCallback((enabled: boolean) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = enabled ? 0.85 : 1.0;
    }
  }, []);

  // Auto-connect when audio element is available and plays
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handlePlay = () => {
      if (!connectedRef.current) {
        connectAudioGraph();
      }
      if (contextRef.current?.state === 'suspended') {
        contextRef.current.resume();
      }
    };
    
    audio.addEventListener('play', handlePlay);
    return () => audio.removeEventListener('play', handlePlay);
  }, [audioRef, connectAudioGraph]);

  return {
    bands,
    eqEnabled,
    currentPreset,
    setEqBand,
    applyPreset,
    toggleEq,
    setNormalization,
    connectAudioGraph,
  };
}
