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

  const connectAudioGraph = useCallback(() => {
    if (connectedRef.current || !audioRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = contextRef.current ?? new AudioContextClass();
    contextRef.current = ctx;

    const initializeGraph = () => {
      if (connectedRef.current || !audioRef.current) return;

      try {
        const source = sourceRef.current ?? ctx.createMediaElementSource(audioRef.current);
        sourceRef.current = source;

        const filters = DEFAULT_BANDS.map((band, i) => {
          const filter = ctx.createBiquadFilter();
          filter.type = i === 0 ? 'lowshelf' : i === DEFAULT_BANDS.length - 1 ? 'highshelf' : 'peaking';
          filter.frequency.value = band.frequency;
          filter.gain.value = bands[i]?.gain ?? 0;
          if (filter.type === 'peaking') {
            filter.Q.value = 1.4;
          }
          return filter;
        });
        filtersRef.current = filters;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.0;
        gainNodeRef.current = gainNode;

        let lastNode: AudioNode = source;
        filters.forEach((filter) => {
          lastNode.connect(filter);
          lastNode = filter;
        });

        lastNode.connect(gainNode);
        gainNode.connect(ctx.destination);

        connectedRef.current = true;
        console.log('Audio engine connected successfully');
      } catch (err) {
        console.error('Failed to initialize audio engine:', err);
      }
    };

    if (ctx.state !== 'running') {
      ctx.resume()
        .then(() => {
          if (ctx.state !== 'running') {
            console.warn('AudioContext is not running yet; EQ graph connection skipped to avoid silent playback');
            return;
          }
          initializeGraph();
        })
        .catch((err) => {
          console.error('Failed to resume audio context:', err);
        });
      return;
    }

    initializeGraph();
  }, [audioRef, bands]);

  const setEqBand = useCallback((index: number, gain: number) => {
    if (filtersRef.current[index]) {
      filtersRef.current[index].gain.value = eqEnabled ? gain : 0;
    }
    setBands((prev) => prev.map((band, i) => i === index ? { ...band, gain } : band));
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

    setBands((prev) => prev.map((band, i) => ({ ...band, gain: preset[i] || 0 })));
  }, [eqEnabled]);

  const toggleEq = useCallback((enabled: boolean) => {
    setEqEnabled(enabled);

    if (enabled && !connectedRef.current) {
      connectAudioGraph();
    }

    if (enabled && contextRef.current?.state === 'suspended') {
      contextRef.current.resume().catch((err) => {
        console.error('Failed to resume suspended audio context:', err);
      });
    }

    filtersRef.current.forEach((filter, i) => {
      filter.gain.value = enabled ? bands[i].gain : 0;
    });
  }, [bands, connectAudioGraph]);

  const setNormalization = useCallback((enabled: boolean) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = enabled ? 0.85 : 1.0;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      if (!eqEnabled) return;

      if (!connectedRef.current) {
        connectAudioGraph();
        return;
      }

      if (contextRef.current?.state === 'suspended') {
        contextRef.current.resume().catch((err) => {
          console.error('Failed to resume audio context on play:', err);
        });
      }
    };

    audio.addEventListener('play', handlePlay);
    return () => audio.removeEventListener('play', handlePlay);
  }, [audioRef, connectAudioGraph, eqEnabled]);

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
