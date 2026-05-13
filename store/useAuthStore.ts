/**
 * Authentication store
 *
 * Manages user identity, tokens, and auth state.
 * Persisted to AsyncStorage so users stay signed in across app restarts.
 *
 * Backed by Supabase Auth via authService. The store keeps token fields
 * as a cache — Supabase also persists the session to AsyncStorage internally
 * and handles auto-refresh. These two mechanisms are intentionally redundant
 * for offline resilience.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiUser } from '@/lib/types';
import * as authService from '@/services/authService';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

interface AuthState {
  // Identity
  user:         ApiUser | null;
  token:        string | null;
  refreshToken: string | null;
  tokenExpires: number | null; // Unix timestamp ms

  // UI state (not persisted)
  status:       AuthStatus;
  errorMessage: string | null;

  // Actions
  signIn:          (email: string, password: string) => Promise<boolean>;
  signUp:          (email: string, password: string, name: string) => Promise<boolean>;
  signOut:         () => Promise<void>;
  refreshSession:  () => Promise<boolean>;
  clearError:      () => void;
  updateProfile:   (updates: Partial<Pick<ApiUser, 'displayName' | 'avatarUrl'>>) => void;
  /** Called by _layout.tsx onAuthStateChange to keep store in sync */
  setSession:      (result: authService.AuthResult | null) => void;
}

function applyResult(set: (partial: Partial<AuthState>) => void, result: authService.AuthResult) {
  set({
    user:         result.user,
    token:        result.token,
    refreshToken: result.refreshToken,
    tokenExpires: Date.now() + result.expiresIn * 1000,
    status:       'authenticated',
    errorMessage: null,
  });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         null,
      token:        null,
      refreshToken: null,
      tokenExpires: null,
      status:       'idle',
      errorMessage: null,

      signIn: async (email, password) => {
        set({ status: 'loading', errorMessage: null });
        try {
          const result = await authService.signIn(email, password);
          applyResult(set, result);
          return true;
        } catch (err: any) {
          const status = err?.status ?? err?.statusCode;
          const msg = status === 401 || err?.message?.includes('Invalid login')
            ? 'Incorrect email or password'
            : 'Sign in failed. Please try again.';
          set({ status: 'error', errorMessage: msg });
          return false;
        }
      },

      signUp: async (email, password, name) => {
        set({ status: 'loading', errorMessage: null });
        try {
          const result = await authService.signUp(email, password, name);
          applyResult(set, result);
          return true;
        } catch (err: any) {
          if (err?.code === 'EMAIL_CONFIRMATION_REQUIRED') {
            set({ status: 'idle', errorMessage: err.message });
            return false;
          }
          const msg = err?.message?.includes('already registered')
            ? 'An account with this email already exists'
            : err?.status === 400 || err?.statusCode === 400
            ? 'Please check your details and try again'
            : 'Sign up failed. Please try again.';
          set({ status: 'error', errorMessage: msg });
          return false;
        }
      },

      signOut: async () => {
        try { await authService.signOut(); } catch {}
        set({
          user:         null,
          token:        null,
          refreshToken: null,
          tokenExpires: null,
          status:       'idle',
          errorMessage: null,
        });
      },

      refreshSession: async () => {
        const { tokenExpires } = get();
        // Only refresh if within 5 minutes of expiry
        if (tokenExpires && Date.now() < tokenExpires - 5 * 60 * 1000) {
          return true;
        }
        try {
          const result = await authService.refreshSession();
          if (!result) {
            set({ token: null, refreshToken: null, tokenExpires: null, user: null, status: 'idle' });
            return false;
          }
          applyResult(set, result);
          return true;
        } catch {
          set({ token: null, refreshToken: null, tokenExpires: null, user: null, status: 'idle' });
          return false;
        }
      },

      clearError: () => set({ errorMessage: null }),

      updateProfile: (updates) =>
        set(s => ({ user: s.user ? { ...s.user, ...updates } : null })),

      setSession: (result) => {
        if (result) {
          applyResult(set, result);
        } else {
          set({
            user:         null,
            token:        null,
            refreshToken: null,
            tokenExpires: null,
            status:       'idle',
          });
        }
      },
    }),
    {
      name:    'albert-auth-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user:         state.user,
        token:        state.token,
        refreshToken: state.refreshToken,
        tokenExpires: state.tokenExpires,
      }),
      onRehydrateStorage: () => () => {
        // Supabase manages its own session persistence; no extra wiring needed.
      },
    },
  ),
);
