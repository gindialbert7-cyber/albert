/**
 * services/authService.ts
 *
 * Wraps Supabase Auth + profiles table.
 * Exposes the same AuthResult shape that useAuthStore expects,
 * so the store never imports from supabase directly.
 */

import { supabase } from '@/lib/supabase';
import type { ApiUser } from '@/lib/types';

// ─── Shape returned to the store ─────────────────────────────────────────────

export interface AuthResult {
  user:         ApiUser;
  token:        string;
  refreshToken: string;
  expiresIn:    number; // seconds from now
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildApiUser(
  id:          string,
  email:       string,
  displayName: string | null | undefined,
  avatarUrl:   string | null | undefined,
  createdAt:   string,
): ApiUser {
  return {
    id,
    email,
    displayName: displayName ?? email.split('@')[0],
    avatarUrl:   avatarUrl   ?? undefined,
    createdAt,
  };
}

function sessionToResult(
  session: { access_token: string; refresh_token: string; expires_at?: number },
  user:    { id: string; email?: string; created_at: string },
  profile: { display_name?: string | null; avatar_url?: string | null } | null,
): AuthResult {
  const expiresIn = session.expires_at
    ? Math.max(0, Math.floor(session.expires_at - Date.now() / 1000))
    : 3600;

  return {
    user: buildApiUser(
      user.id,
      user.email ?? '',
      profile?.display_name,
      profile?.avatar_url,
      user.created_at,
    ),
    token:        session.access_token,
    refreshToken: session.refresh_token,
    expiresIn,
  };
}

async function fetchProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', userId)
    .single();
  return data;
}

// ─── Public auth operations ───────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const { session, user } = data;

  const profile = await fetchProfile(user.id);
  return sessionToResult(session, user, profile);
}

export async function signUp(
  email:       string,
  password:    string,
  displayName: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;

  if (!data.session) {
    // Supabase email confirmation is enabled — user must verify before logging in.
    // Throw a typed error the store can recognise.
    const e = new Error('Please check your email to confirm your account.') as any;
    e.code = 'EMAIL_CONFIRMATION_REQUIRED';
    throw e;
  }

  const { session, user } = data;

  // Upsert profile row with chosen display name.
  await supabase.from('profiles').upsert({ id: user.id, display_name: displayName });

  return sessionToResult(session, user, { display_name: displayName, avatar_url: null });
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function refreshSession(): Promise<AuthResult | null> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session || !data.user) return null;

  const { session, user } = data;

  const profile = await fetchProfile(user.id);
  return sessionToResult(session, user, profile);
}

export async function forgotPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'albert://auth/reset-password',
  });
  if (error) throw error;
}

/** Called from the reset-password screen after the session is restored from the deep-link tokens. */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/**
 * Restore session from persisted Supabase storage on app launch.
 * Returns null if no valid session exists.
 */
export async function getCurrentSession(): Promise<AuthResult | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;

  const profile = await fetchProfile(session.user.id);
  return sessionToResult(session, session.user, profile);
}
