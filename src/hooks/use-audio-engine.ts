import { useRef, useCallback, useEffect, useState } from 'react';

export interface EqBand {
  frequency: number;
  label: string;
  gain: number;
}

export type EngineStatus = 'idle' | 'ready' | 'failed' | 'suspended';

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

/**
 * Safe Web Audio engine.
 *
 * Key design decisions to prevent the "EQ mutes audio" bug:
 *
 * 1. `createMediaElementSource` is called AT MOST once per audio element
 *    (guarded by `sourceRef`).  After that the same source node is reused.
 *
 * 2. The graph always terminates at `ctx.destination`.  When EQ is
 *    **disabled** the filters are bypassed by setting every filter gain to 0
 *    (peaking filters with 0 gain are transparent).  This avoids
 *    disconnecting / reconnecting nodes which is error-prone.
 *
 * 3. The AudioContext is only created inside a user-gesture handler
 *    (toggleEq / connectAudioGraph called from a click).  If the context
 *    is suspended we resume it; if resume fails we report status = 'failed'
 *    and leave audio playing through the default path (no source node
 *    created → audio element outputs directly).
 *
 * 4. If graph construction throws for any reason the engine sets
 *    status = 'failed' and does NOT steal the audio element output.
 */
export function useAudioEngine(audioRef: React.RefObject<HTMLAudioElement>) {
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);
  const graphBuiltRef = useRef(false);

  const [bands, setBands] = useState<EqBand[]>(DEFAULT_BANDS);
  const [eqEnabled, setEqEnabled] = useState(false);
  const [currentPreset, setCurrentPreset] = useState('Flat');
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('idle');
  const [engineError, setEngineError] = useState<string | null>(null);

  // ---------- helpers ----------

  const ensureContext = useCallback((): AudioContext | null => {
    try {
      if (!contextRef.current) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        contextRef.current = new AC();
      }
      return contextRef.current;
    } catch (err) {
      console.error('Failed to create AudioContext:', err);
      setEngineStatus('failed');
      setEngineError('Browser does not support Web Audio');
      return null;
    }
  }, []);

  const resumeContext = useCallback(async (ctx: AudioContext): Promise<boolean> => {
    if (ctx.state === 'running') return true;
    try {
      await ctx.resume();
      if (ctx.state === 'running') return true;
      // Some browsers don't transition immediately
      await new Promise(r => setTimeout(r, 100));
      return ctx.state === 'running';
    } catch (err) {
      console.error('Failed to resume AudioContext:', err);
      return false;
    }
  }, []);

  // ---------- graph lifecycle ----------

  const connectAudioGraph = useCallback(async () => {
    if (graphBuiltRef.current) {
      // Graph already connected – just make sure context is running
      const ctx = contextRef.current;
      if (ctx && ctx.state !== 'running') {
        const ok = await resumeContext(ctx);
        setEngineStatus(ok ? 'ready' : 'suspended');
        if (!ok) setEngineError('Audio engine suspended – interact with the page first');
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      setEngineStatus('failed');
      setEngineError('No audio element available');
      return;
    }

    const ctx = ensureContext();
    if (!ctx) return;

    // Resume context (needs user gesture)
    const running = await resumeContext(ctx);
    if (!running) {
      setEngineStatus('suspended');
      setEngineError('Audio engine suspended – tap play first');
      return;
    }

    try {
      // Create source only once
      if (!sourceRef.current) {
        sourceRef.current = ctx.createMediaElementSource(audio);
      }

      // Build filter chain
      const filters = DEFAULT_BANDS.map((band, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = i === 0 ? 'lowshelf' : i === DEFAULT_BANDS.length - 1 ? 'highshelf' : 'peaking';
        filter.frequency.value = band.frequency;
        filter.gain.value = 0; // Start transparent
        if (filter.type === 'peaking') filter.Q.value = 1.4;
        return filter;
      });
      filtersRef.current = filters;

      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.0;
      gainNodeRef.current = gainNode;

      // Wire: source → filter0 → filter1 → … → gain → destination
      let prev: AudioNode = sourceRef.current;
      for (const filter of filters) {
        prev.connect(filter);
        prev = filter;
      }
      prev.connect(gainNode);
      gainNode.connect(ctx.destination);

      graphBuiltRef.current = true;
      setEngineStatus('ready');
      setEngineError(null);
      console.log('Audio engine graph connected');
    } catch (err: any) {
      console.error('Audio engine graph failed:', err);
      setEngineStatus('failed');
      setEngineError(err?.message || 'Failed to build audio graph');
      // If source was created but chain failed, connect source directly
      // so audio still plays
      try {
        if (sourceRef.current && ctx) {
          sourceRef.current.connect(ctx.destination);
          graphBuiltRef.current = true; // prevent retry loops
        }
      } catch {
        // Nothing we can do – audio element will be silent
      }
    }
  }, [audioRef, ensureContext, resumeContext]);

  // ---------- EQ controls ----------

  const applyGains = useCallback((newBands: EqBand[], enabled: boolean) => {
    filtersRef.current.forEach((filter, i) => {
      const target = enabled ? (newBands[i]?.gain ?? 0) : 0;
      filter.gain.value = target;
    });
  }, []);

  const setEqBand = useCallback((index: number, gain: number) => {
    setBands(prev => {
      const next = prev.map((b, i) => i === index ? { ...b, gain } : b);
      if (filtersRef.current[index]) {
        filtersRef.current[index].gain.value = eqEnabled ? gain : 0;
      }
      return next;
    });
  }, [eqEnabled]);

  const applyPreset = useCallback((presetName: string) => {
    const preset = EQ_PRESETS[presetName];
    if (!preset) return;
    setCurrentPreset(presetName);
    setBands(prev => {
      const next = prev.map((b, i) => ({ ...b, gain: preset[i] ?? 0 }));
      applyGains(next, eqEnabled);
      return next;
    });
  }, [eqEnabled, applyGains]);

  const toggleEq = useCallback(async (enabled: boolean) => {
    setEqEnabled(enabled);

    if (enabled) {
      // Build graph if not yet built (user gesture context)
      if (!graphBuiltRef.current) {
        await connectAudioGraph();
      }
      // Resume if suspended
      if (contextRef.current && contextRef.current.state !== 'running') {
        const ok = await resumeContext(contextRef.current);
        if (!ok) {
          setEngineStatus('suspended');
          setEngineError('Audio engine suspended – try toggling after playing a track');
          // Don't apply gains – filters not active
          return;
        }
      }
      setEngineStatus(graphBuiltRef.current ? 'ready' : 'failed');
    }

    // Apply or zero-out gains
    setBands(prev => {
      applyGains(prev, enabled);
      return prev;
    });
  }, [connectAudioGraph, resumeContext, applyGains]);

  const setNormalization = useCallback((enabled: boolean) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = enabled ? 0.85 : 1.0;
    }
  }, []);

  // ---------- auto-resume on play ----------

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = async () => {
      if (!graphBuiltRef.current || !eqEnabled) return;
      const ctx = contextRef.current;
      if (ctx && ctx.state === 'suspended') {
        const ok = await resumeContext(ctx);
        setEngineStatus(ok ? 'ready' : 'suspended');
      }
    };

    audio.addEventListener('play', handlePlay);
    return () => audio.removeEventListener('play', handlePlay);
  }, [audioRef, eqEnabled, resumeContext]);

  // ---------- load saved state ----------

  const loadSavedState = useCallback((savedBands: EqBand[] | null, savedPreset: string | null, savedEnabled: boolean) => {
    if (savedBands && savedBands.length === DEFAULT_BANDS.length) {
      setBands(savedBands);
    }
    if (savedPreset) setCurrentPreset(savedPreset);
    setEqEnabled(savedEnabled);
    // Don't apply gains yet – graph may not exist. They'll be applied on toggleEq.
  }, []);

  return {
    bands,
    eqEnabled,
    currentPreset,
    engineStatus,
    engineError,
    setEqBand,
    applyPreset,
    toggleEq,
    setNormalization,
    connectAudioGraph,
    loadSavedState,
  };
}
