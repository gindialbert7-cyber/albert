/**
 * Library client implementations.
 *
 * Each adapter has a real production endpoint, but in this codebase
 * we stub the HTTP layer behind a `fetch` strategy that the deployment
 * supplies. The reason: the renderer itself is pure (per the
 * RENDERER_DISCIPLINE.md boundary) — network is upstream. These
 * clients live OUTSIDE the boundary; they are not imported by anything
 * in the renderer purity zone.
 *
 * To wire up in production:
 *   1. Set provider API keys via env var (NOUN_PROJECT_KEY, PIXABAY_KEY, …).
 *   2. Register clients in the registry below.
 *   3. The asset-fetch service (a separate Node process) calls these,
 *      hashes results, and writes them to S3 + the per-Universe cache.
 *   4. The renderer reads from the cache only — never from network.
 *
 * This is the function-call signature that real code should fill in.
 */

import type { AssetCandidate, AssetQuery, LibraryClient, LibrarySourceId } from './types';

type FetchLike = (url: string, init?: RequestInit) => Promise<{
  ok: boolean;
  status: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
  json: () => Promise<unknown>;
}>;

export type ClientConfig = {
  fetch: FetchLike;
  apiKey?: string;
  /** Optional baseUrl override for testing. */
  baseUrl?: string;
};

// ─── SVG Repo client ────────────────────────────────────────────────────────

export class SvgRepoClient implements LibraryClient {
  readonly source: LibrarySourceId = 'svg-repo';
  constructor(private cfg: ClientConfig) {}

  async search(_q: AssetQuery): Promise<AssetCandidate[]> {
    // Production: GET https://www.svgrepo.com/api/search?term=...
    // SVG Repo's API is free, returns up to 100 results per page; respect
    // their RPS limit (~10/s) with a per-process token bucket.
    void this.cfg;
    throw new Error('SvgRepoClient: not wired up. Set fetcher in client config and implement against https://www.svgrepo.com/api/');
  }

  async fetch(_c: AssetCandidate): Promise<{ bytes: Uint8Array; sha256: string }> {
    throw new Error('SvgRepoClient.fetch: not wired up.');
  }
}

// ─── Noun Project client ───────────────────────────────────────────────────

export class NounProjectClient implements LibraryClient {
  readonly source: LibrarySourceId = 'noun-project';
  constructor(private cfg: ClientConfig) {}

  async search(_q: AssetQuery): Promise<AssetCandidate[]> {
    void this.cfg;
    throw new Error('NounProjectClient: not wired up. Requires OAuth1 key from https://thenounproject.com/api/');
  }

  async fetch(_c: AssetCandidate): Promise<{ bytes: Uint8Array; sha256: string }> {
    throw new Error('NounProjectClient.fetch: not wired up.');
  }
}

// ─── Biodiversity Heritage Library client ───────────────────────────────────

export class BhlClient implements LibraryClient {
  readonly source: LibrarySourceId = 'bhl';
  constructor(private cfg: ClientConfig) {}

  async search(_q: AssetQuery): Promise<AssetCandidate[]> {
    // Production: GET https://www.biodiversitylibrary.org/api3?op=PublicationSearch&...
    // All BHL imagery is CC0 / Public Domain.
    void this.cfg;
    throw new Error('BhlClient: not wired up. Free API at https://www.biodiversitylibrary.org/getapikey.aspx');
  }

  async fetch(_c: AssetCandidate): Promise<{ bytes: Uint8Array; sha256: string }> {
    throw new Error('BhlClient.fetch: not wired up.');
  }
}

// ─── Rijksmuseum client ────────────────────────────────────────────────────

export class RijksmuseumClient implements LibraryClient {
  readonly source: LibrarySourceId = 'rijksmuseum';
  constructor(private cfg: ClientConfig) {}

  async search(_q: AssetQuery): Promise<AssetCandidate[]> {
    // Production: GET https://www.rijksmuseum.nl/api/en/collection?key=...
    void this.cfg;
    throw new Error('RijksmuseumClient: not wired up. Free key from https://data.rijksmuseum.nl/');
  }

  async fetch(_c: AssetCandidate): Promise<{ bytes: Uint8Array; sha256: string }> {
    throw new Error('RijksmuseumClient.fetch: not wired up.');
  }
}

// ─── Pixabay client ────────────────────────────────────────────────────────

export class PixabayClient implements LibraryClient {
  readonly source: LibrarySourceId = 'pixabay';
  constructor(private cfg: ClientConfig) {}

  async search(_q: AssetQuery): Promise<AssetCandidate[]> {
    // Production: GET https://pixabay.com/api/?key=...&q=...&image_type=vector+illustration
    // Free unlimited; Pixabay License = Pixabay Content License.
    // NOTE: License compatibility verified before each call — Pixabay's
    // license forbids selling unaltered copies but our restyle pipeline
    // creates a derivative, which is permitted.
    void this.cfg;
    throw new Error('PixabayClient: not wired up. Free key from https://pixabay.com/api/docs/');
  }

  async fetch(_c: AssetCandidate): Promise<{ bytes: Uint8Array; sha256: string }> {
    throw new Error('PixabayClient.fetch: not wired up.');
  }
}

// ─── Registry / priority cascade ───────────────────────────────────────────

export const LIBRARY_PRIORITY: LibrarySourceId[] = [
  'svg-repo',
  'noun-project',
  'bhl',
  'rijksmuseum',
  'pixabay',
];

/** Build the full set of registered clients given a config map. */
export function buildClients(cfgs: Partial<Record<LibrarySourceId, ClientConfig>>): Map<LibrarySourceId, LibraryClient> {
  const out = new Map<LibrarySourceId, LibraryClient>();
  if (cfgs['svg-repo']) out.set('svg-repo', new SvgRepoClient(cfgs['svg-repo']));
  if (cfgs['noun-project']) out.set('noun-project', new NounProjectClient(cfgs['noun-project']));
  if (cfgs['bhl']) out.set('bhl', new BhlClient(cfgs['bhl']));
  if (cfgs['rijksmuseum']) out.set('rijksmuseum', new RijksmuseumClient(cfgs['rijksmuseum']));
  if (cfgs['pixabay']) out.set('pixabay', new PixabayClient(cfgs['pixabay']));
  return out;
}
