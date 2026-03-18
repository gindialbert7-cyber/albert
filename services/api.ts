/**
 * Albert API client
 *
 * Typed fetch wrapper with:
 *   - Auth token injection
 *   - Timeout handling
 *   - Retry on transient errors (5xx / network)
 *   - Structured error types
 *
 * Currently all routes fall back to local data (no backend yet),
 * but the interface is designed for a real REST API.
 */

import { Config } from '@/constants/Config';

// ─── Error types ──────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor() {
    super(`Request timed out after ${Config.API_TIMEOUT_MS}ms`);
    this.name = 'TimeoutError';
  }
}

// ─── Token storage ────────────────────────────────────────────────────────

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────

interface RequestOptions {
  method?:  'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?:    object;
  headers?: Record<string, string>;
  retries?: number;
}

async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, retries = 2 } = options;

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), Config.API_TIMEOUT_MS);

  const reqHeaders: Record<string, string> = {
    'Content-Type':  'application/json',
    'Accept':        'application/json',
    'X-App-Version': Config.APP_VERSION,
    ...headers,
  };

  if (_authToken) {
    reqHeaders['Authorization'] = `Bearer ${_authToken}`;
  }

  try {
    const response = await fetch(`${Config.API_BASE_URL}${path}`, {
      method,
      headers: reqHeaders,
      body:    body ? JSON.stringify(body) : undefined,
      signal:  controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      let code = 'UNKNOWN_ERROR';
      try {
        const json = await response.json();
        code = json.code ?? code;
      } catch {}

      // Retry on 5xx errors
      if (response.status >= 500 && retries > 0) {
        await sleep(500);
        return apiFetch<T>(path, { ...options, retries: retries - 1 });
      }

      throw new ApiError(response.status, code, `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;

  } catch (err: any) {
    clearTimeout(timeout);

    if (err.name === 'AbortError') throw new TimeoutError();
    if (err instanceof ApiError) throw err;

    // Retry on network errors
    if (retries > 0) {
      await sleep(1000);
      return apiFetch<T>(path, { ...options, retries: retries - 1 });
    }

    throw new NetworkError(err?.message);
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Typed API endpoints ──────────────────────────────────────────────────

export interface ApiUser {
  id:          string;
  email:       string;
  displayName: string;
  avatarUrl?:  string;
  createdAt:   string;
}

export interface ApiBookContent {
  bookId:   string;
  chapters: ApiChapterContent[];
}

export interface ApiChapterContent {
  id:       string;
  title:    string;
  sections: ApiSection[];
}

export interface ApiSection {
  type:    'heading' | 'hebrew' | 'english' | 'commentary' | 'divider';
  text?:   string;
  level?:  1 | 2 | 3;
}

export interface AuthTokenResponse {
  token:        string;
  refreshToken: string;
  expiresIn:    number; // seconds
  user:         ApiUser;
}

// ── Auth ──────────────────────────────────────────────────────────────────

export const authApi = {
  signIn: (email: string, password: string) =>
    apiFetch<AuthTokenResponse>('/auth/sign-in', {
      method: 'POST',
      body:   { email, password },
    }),

  signUp: (email: string, password: string, displayName: string) =>
    apiFetch<AuthTokenResponse>('/auth/sign-up', {
      method: 'POST',
      body:   { email, password, displayName },
    }),

  signOut: () =>
    apiFetch<void>('/auth/sign-out', { method: 'POST' }),

  refreshToken: (refreshToken: string) =>
    apiFetch<AuthTokenResponse>('/auth/refresh', {
      method: 'POST',
      body:   { refreshToken },
    }),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body:   { email },
    }),

  me: () => apiFetch<ApiUser>('/auth/me'),
};

// ── Content ───────────────────────────────────────────────────────────────

export const contentApi = {
  getBookContent: (bookId: string) =>
    apiFetch<ApiBookContent>(`/books/${bookId}/content`),

  getChapter: (bookId: string, chapterId: string) =>
    apiFetch<ApiChapterContent>(`/books/${bookId}/chapters/${chapterId}`),
};

// ── User data sync ────────────────────────────────────────────────────────

export const syncApi = {
  uploadProgress: (data: object) =>
    apiFetch<void>('/sync/progress', { method: 'POST', body: data }),

  downloadProgress: () =>
    apiFetch<object>('/sync/progress'),

  uploadHighlights: (data: object) =>
    apiFetch<void>('/sync/highlights', { method: 'POST', body: data }),
};
