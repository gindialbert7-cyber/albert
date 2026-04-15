/**
 * useAudioPlayer — small wrapper around expo-av Sound.
 *
 * Dynamic-imports expo-av so the app still launches if the package is not
 * installed yet. A module-level singleton `_activeSound` ensures only ONE
 * audio clip plays at a time across the whole app (tapping a second AudioSection
 * unloads the first).
 *
 * Returns:
 *   state:      idle | loading | playing | paused | error
 *   progress:   0..1 through the clip
 *   durationMs: total length (once loaded)
 *   play / pause / seek / stop
 *
 * Accepts either a remote https URL or a local `require()` asset module.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface AudioControls {
  state:      AudioState;
  progress:   number;        // 0..1
  positionMs: number;
  durationMs: number;
  play:       () => Promise<void>;
  pause:      () => Promise<void>;
  stop:       () => Promise<void>;
  seek:       (ms: number) => Promise<void>;
}

// ── Module-level singleton so only one clip plays at a time ────────────────────
let _activeSound: any | null = null;
let _activeCleanup: (() => void) | null = null;

async function getAV(): Promise<any | null> {
  try {
    return await import('expo-av');
  } catch {
    return null;
  }
}

/**
 * Stop and unload any currently-playing clip across the whole app. Call this
 * on screen-unmount if you want sound to cease when the user leaves the reader.
 */
export async function stopActiveAudio(): Promise<void> {
  if (_activeCleanup) {
    try { _activeCleanup(); } catch {}
    _activeCleanup = null;
  }
  if (_activeSound) {
    try { await _activeSound.unloadAsync(); } catch {}
    _activeSound = null;
  }
}

export function useAudioPlayer(source: string | number | null): AudioControls {
  const [state,      setState]      = useState<AudioState>('idle');
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const soundRef    = useRef<any | null>(null);
  const mountedRef  = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Best-effort cleanup if this component owned the active sound
      if (soundRef.current && _activeSound === soundRef.current) {
        _activeSound = null;
        _activeCleanup = null;
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync?.().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  // Reset local state when source changes
  useEffect(() => {
    setState('idle');
    setPositionMs(0);
    setDurationMs(0);
  }, [source]);

  const ensureLoaded = useCallback(async (): Promise<any | null> => {
    if (soundRef.current) return soundRef.current;
    if (!source) return null;

    const AV = await getAV();
    if (!AV) {
      if (mountedRef.current) setState('error');
      return null;
    }

    try {
      setState('loading');
      // Stop any other clip currently playing
      await stopActiveAudio();

      const src = typeof source === 'string' ? { uri: source } : source;
      const { sound } = await AV.Audio.Sound.createAsync(
        src,
        { shouldPlay: false, progressUpdateIntervalMillis: 250 },
        (status: any) => {
          if (!mountedRef.current) return;
          if (status.isLoaded) {
            setPositionMs(status.positionMillis ?? 0);
            setDurationMs(status.durationMillis ?? 0);
            if (status.didJustFinish) {
              setState('idle');
              setPositionMs(0);
              sound.setPositionAsync?.(0).catch(() => {});
            }
          } else if (status.error) {
            setState('error');
          }
        },
      );

      soundRef.current = sound;
      _activeSound    = sound;
      _activeCleanup  = () => {
        if (mountedRef.current) setState('idle');
        soundRef.current = null;
      };
      return sound;
    } catch {
      if (mountedRef.current) setState('error');
      return null;
    }
  }, [source]);

  const play = useCallback(async () => {
    const sound = await ensureLoaded();
    if (!sound) return;
    try {
      await sound.playAsync();
      if (mountedRef.current) setState('playing');
    } catch {
      if (mountedRef.current) setState('error');
    }
  }, [ensureLoaded]);

  const pause = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.pauseAsync();
      if (mountedRef.current) setState('paused');
    } catch {}
  }, []);

  const stop = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.stopAsync();
      await soundRef.current.setPositionAsync(0);
      if (mountedRef.current) {
        setState('idle');
        setPositionMs(0);
      }
    } catch {}
  }, []);

  const seek = useCallback(async (ms: number) => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(Math.max(0, ms));
    } catch {}
  }, []);

  const progress = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;

  return { state, progress, positionMs, durationMs, play, pause, stop, seek };
}
