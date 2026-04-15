/**
 * audioManifestService — fetches a per-book audio manifest that maps
 * `audioId` strings embedded in TextSections to real CDN mp3 URLs plus
 * metadata (speaker, duration, language).
 *
 * Flow:
 *   1. Check AsyncStorage cache (7-day TTL)
 *   2. Fetch `${CDN_BASE}/audio/manifests/{bookId}.json`
 *   3. Cache and return
 *
 * Manifest shape:
 *   {
 *     "bookId":  "tanya",
 *     "version": 3,
 *     "clips": {
 *       "tanya_ch1_intro": {
 *          "url":      "https://cdn.../audio/tanya/ch1_intro.mp3",
 *          "speaker":  "Rabbi Yosef Jacobson",
 *          "duration": 183,
 *          "lang":     "en",
 *          "title":    "Introduction to Chapter 1"
 *       },
 *       ...
 *     }
 *   }
 *
 * Returns null gracefully (no manifest = no audio icons shown).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '@/constants/Config';

export interface AudioClip {
  url:       string;
  speaker?:  string;
  duration?: number;   // seconds
  lang?:     'en' | 'he' | 'yi';
  title?:    string;
}

export interface AudioManifest {
  bookId:  string;
  version: number;
  clips:   Record<string, AudioClip>;
}

const CACHE_PREFIX = 'albert-audio-manifest-v1-';
const TTL_MS       = 7 * 24 * 60 * 60 * 1000;
const TIMEOUT_MS   = 8_000;

// In-memory cache for the current session
const _memCache = new Map<string, AudioManifest | null>();

interface CacheEntry {
  manifest: AudioManifest;
  savedAt:  number;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function readCache(bookId: string): Promise<AudioManifest | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + bookId);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.savedAt > TTL_MS) return null;
    return entry.manifest;
  } catch {
    return null;
  }
}

async function writeCache(bookId: string, manifest: AudioManifest): Promise<void> {
  try {
    const entry: CacheEntry = { manifest, savedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_PREFIX + bookId, JSON.stringify(entry));
  } catch {}
}

/**
 * Fetch (or load from cache) the audio manifest for a given book.
 * Returns null if no manifest exists or the network fails.
 */
export async function getAudioManifest(bookId: string): Promise<AudioManifest | null> {
  if (_memCache.has(bookId)) return _memCache.get(bookId) ?? null;

  // Cache
  const cached = await readCache(bookId);
  if (cached) {
    _memCache.set(bookId, cached);
    return cached;
  }

  // Only attempt network if the feature flag is on
  if (!Config.FEATURE_AUDIO) {
    _memCache.set(bookId, null);
    return null;
  }

  try {
    const url  = `${Config.CDN_BASE}/audio/manifests/${encodeURIComponent(bookId)}.json`;
    const resp = await fetchWithTimeout(url);
    if (!resp.ok) {
      _memCache.set(bookId, null);
      return null;
    }
    const manifest: AudioManifest = await resp.json();
    if (!manifest || !manifest.clips) {
      _memCache.set(bookId, null);
      return null;
    }
    _memCache.set(bookId, manifest);
    await writeCache(bookId, manifest);
    return manifest;
  } catch {
    _memCache.set(bookId, null);
    return null;
  }
}

/**
 * Convenience lookup: get a single clip by id from a manifest.
 */
export function getClip(manifest: AudioManifest | null, audioId: string | undefined): AudioClip | null {
  if (!manifest || !audioId) return null;
  return manifest.clips[audioId] ?? null;
}

/**
 * Invalidate a single book's cached manifest (forces re-fetch next call).
 */
export async function invalidateAudioManifest(bookId: string): Promise<void> {
  _memCache.delete(bookId);
  try { await AsyncStorage.removeItem(CACHE_PREFIX + bookId); } catch {}
}
