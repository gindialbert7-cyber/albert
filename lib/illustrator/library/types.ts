/**
 * Library asset types.
 *
 * Authors request props/decor/scene-elements by name ("fire truck",
 * "kiddush cup", "magic mushroom"). The system queries public-domain
 * and CC0/CC-BY libraries in priority order, scores candidates with
 * CLIP, traces the winner, and re-renders it in the active Artist's
 * style. Per-asset license metadata is mandatory for the audit trail
 * KDP/legal compliance requires.
 *
 * The library priority cascade (per legal+research):
 *   1. SVG Repo (free CC0-equiv, 500k+ vectors, primary)
 *   2. The Noun Project (curated, $25/mo, secondary)
 *   3. Biodiversity Heritage Library (CC0 vintage line art)
 *   4. Rijksmuseum (CC0, historical engravings)
 *   5. Pixabay (Pixabay License, modern subjects)
 *
 * EXPLICITLY EXCLUDED from default cascade: Wikimedia Commons (mixed
 * CC-BY-SA contaminates customer books — legal audit hard-block).
 */

export type LicenseKind =
  | 'CC0'
  | 'PublicDomain'
  | 'PixabayLicense'
  | 'NounProjectRoyaltyFree'
  | 'CC-BY'  // allowed but requires printed attribution on credits page
  | 'CC-BY-ND' // attribution + no derivatives — blocks our restyle pipeline; reject
  | 'CC-BY-SA' // viral copyleft — HARD BLOCK
  | 'Unknown';

export const ALLOWED_LICENSES: LicenseKind[] = [
  'CC0',
  'PublicDomain',
  'PixabayLicense',
  'NounProjectRoyaltyFree',
  'CC-BY',
];

/** A library source (SVG Repo, Noun Project, BHL, Rijksmuseum, Pixabay, …) */
export type LibrarySourceId =
  | 'svg-repo'
  | 'noun-project'
  | 'bhl'
  | 'rijksmuseum'
  | 'pixabay'
  | 'user-upload';

/** Candidate returned from a library search */
export type AssetCandidate = {
  /** Stable provider-side id */
  providerId: string;
  source: LibrarySourceId;
  /** Direct URL to the asset (SVG/PNG/JPG). Will be fetched and hashed. */
  url: string;
  /** Original asset SHA-256, computed after download. */
  sha256?: string;
  /** Width/height in source units (px or 1 for SVG). */
  width?: number;
  height?: number;
  /** Format hint. */
  format: 'svg' | 'png' | 'jpg' | 'webp';
  /** License — must be in ALLOWED_LICENSES to proceed. */
  license: LicenseKind;
  /** Attribution string (used on the printed credits page for CC-BY). */
  attribution?: string;
  /** Provider-supplied tags. */
  tags?: string[];
  /** Provider-supplied title. */
  title?: string;
  /** CLIP-similarity score against the query. Set by the scorer. */
  clipScore?: number;
  /** Cheap heuristic score (line-art simplicity, color count, etc.). */
  heuristicScore?: number;
};

/** A search query against the library cascade. */
export type AssetQuery = {
  subject: string;
  /** Optional style hint to refine ("simple line art", "silhouette"). */
  styleHint?: string;
  /** Max number of candidates to consider before scoring. */
  maxCandidates?: number;
  /** Universe id, for caching. */
  universeId: string;
};

/** A cached + restyled asset, scoped to a Universe. */
export type CachedAsset = {
  /** Canonical name in the Universe (e.g., "fire-truck"). */
  name: string;
  universeId: string;
  /** Source metadata (immutable). */
  source: LibrarySourceId;
  providerId: string;
  sourceUrl: string;
  sourceSha256: string;
  license: LicenseKind;
  attribution?: string;
  /** SVG fragment, re-rendered in the active Artist's hand. */
  renderedSvg: string;
  /** When the restyle was last computed. */
  restyledAt: number;
  /** Snapshot of the Artist parameter set used for the restyle, so
   *  a future restyle (e.g., after style change) can be re-derived. */
  artistSnapshotId: string;
};

/** A library client adapter. Each provider implements this. */
export interface LibraryClient {
  source: LibrarySourceId;
  search(query: AssetQuery): Promise<AssetCandidate[]>;
  /** Fetch an asset's raw bytes (and compute SHA-256). */
  fetch(candidate: AssetCandidate): Promise<{ bytes: Uint8Array; sha256: string }>;
}
