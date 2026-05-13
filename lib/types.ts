/**
 * Shared application-level types.
 * Replaces the type exports that previously lived in services/api.ts.
 */

export interface ApiUser {
  id:          string;
  email:       string;
  displayName: string;
  avatarUrl?:  string;
  createdAt:   string;
}

let _authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}
